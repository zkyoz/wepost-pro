import tiktokConfig from '#config/tiktok'
import {
  tiktokIdempotencyKey,
  tiktokPayloadHash,
  type TikTokVideoPayload,
} from '#domain/social/tiktok'
import AuditLog from '#models/audit_log'
import Project from '#models/project'
import PublicationAttempt from '#models/publication_attempt'
import ScheduledPublication from '#models/scheduled_publication'
import SocialAccount from '#models/social_account'
import { findAccessiblePublication } from '#services/publications/publication_service'
import { effectiveNetworkText } from '#services/publications/network_variant_service'
import {
  toScheduleView,
  toSocialAccountView,
  tiktokMediaForPublication,
  validatePublicationForTikTok,
} from '#services/social/tiktok_service'
import { getTikTokOAuthClient } from '#services/social/tiktok_oauth_client'
import { enqueueTikTokPublication } from '#services/social/tiktok_queue'
import { markSocialScheduleFailed } from '#services/social/social_status_service'
import { decryptSocialToken, encryptSocialToken } from '#services/social/token_cipher'
import env from '#start/env'
import {
  tiktokAccountValidator,
  tiktokOAuthCallbackValidator,
  tiktokOAuthStartValidator,
  tiktokPublicationValidator,
  tiktokScheduleValidator,
  tiktokStatusValidator,
} from '#validators/tiktok_validator'
import type { HttpContext } from '@adonisjs/core/http'
import encryption from '@adonisjs/core/services/encryption'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomBytes, timingSafeEqual } from 'node:crypto'

type OAuthState = {
  nonce: string
  actorId: string
  agencyId: string
  expiresAt: number
}

const publicationNotFound = { errors: [{ message: 'Publication introuvable.' }] }
const accountNotFound = { errors: [{ message: 'Compte TikTok introuvable.' }] }
const scheduleNotFound = { errors: [{ message: 'Programmation TikTok introuvable.' }] }

function equalSecret(left: string, right: string) {
  const first = Buffer.from(left)
  const second = Buffer.from(right)
  return first.length === second.length && timingSafeEqual(first, second)
}

function tokenKey() {
  const key = env.get('SOCIAL_TOKEN_ENCRYPTION_KEY')
  if (!key) throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY manquante.')
  return key
}

function videoFrom(input: TikTokVideoPayload): TikTokVideoPayload {
  return {
    privacyLevel: input.privacyLevel,
    caption: input.caption,
    disableComment: input.disableComment,
    disableDuet: input.disableDuet,
    disableStitch: input.disableStitch,
    brandContentToggle: input.brandContentToggle,
    brandOrganicToggle: input.brandOrganicToggle,
    isAigc: input.isAigc,
  }
}

async function accountForPublication(accountId: string, agencyId: string) {
  return SocialAccount.query()
    .where('id', accountId)
    .where('agencyId', agencyId)
    .where('network', 'tiktok')
    .first()
}

async function refreshCreatorCapabilities(account: SocialAccount) {
  if (!account.encryptedAccessToken || account.status !== 'connected') return
  const creatorInfo = await getTikTokOAuthClient().creatorInfo(
    decryptSocialToken(account.encryptedAccessToken, tokenKey())
  )
  account.metadataJson = { ...account.metadataJson, creatorInfo }
  await account.save()
}

export default class TikTokController {
  async oauthStart({ auth, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(tiktokOAuthStartValidator)
    const agencyId = actor.role === 'agency' ? actor.agencyId : payload.agencyId
    if (!agencyId) {
      return response.unprocessableEntity({
        errors: [{ field: 'agencyId', message: 'Sélectionnez une agence.' }],
      })
    }
    if (actor.role === 'admin' && !(await Project.query().where('agencyId', agencyId).first())) {
      return response.unprocessableEntity({
        errors: [{ field: 'agencyId', message: 'Cette agence ne possède aucun projet connu.' }],
      })
    }
    const nonce = randomBytes(32).toString('base64url')
    const statePayload: OAuthState = {
      nonce,
      actorId: actor.id,
      agencyId,
      expiresAt: Date.now() + 10 * 60_000,
    }
    session.put('tiktok_oauth_nonce', nonce)
    const state = encryption.encrypt(JSON.stringify(statePayload), 600, 'tiktok:oauth-state')
    return response.ok({
      data: { authorizationUrl: getTikTokOAuthClient().authorizationUrl(state) },
    })
  }

  async oauthCallback({ auth, logger, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(tiktokOAuthCallbackValidator)
    const decrypted = encryption.decrypt(payload.state, 'tiktok:oauth-state')
    const nonce = session.get('tiktok_oauth_nonce')
    session.forget('tiktok_oauth_nonce')
    if (typeof decrypted !== 'string' || typeof nonce !== 'string') {
      return response.badRequest({ errors: [{ message: 'État OAuth invalide ou expiré.' }] })
    }
    let state: OAuthState
    try {
      state = JSON.parse(decrypted) as OAuthState
    } catch {
      return response.badRequest({ errors: [{ message: 'État OAuth invalide ou expiré.' }] })
    }
    if (
      state.actorId !== actor.id ||
      state.expiresAt <= Date.now() ||
      !equalSecret(state.nonce, nonce)
    ) {
      return response.badRequest({ errors: [{ message: 'État OAuth invalide ou expiré.' }] })
    }
    try {
      const client = getTikTokOAuthClient()
      const token = await client.exchangeCode(payload.code)
      const [profile, creatorInfo] = await Promise.all([
        client.profile(token.accessToken),
        client.creatorInfo(token.accessToken),
      ])
      const missingScopes = tiktokConfig.scopes.filter((scope) => !token.scopes.includes(scope))
      if (missingScopes.length) {
        return response.unprocessableEntity({
          errors: [{ message: 'Les permissions TikTok minimales n’ont pas été accordées.' }],
          meta: { missingScopes },
        })
      }
      const account = await db.transaction(async (trx) => {
        const existing = await SocialAccount.query({ client: trx })
          .where('agencyId', state.agencyId)
          .where('network', 'tiktok')
          .where('externalAccountId', profile.openId)
          .first()
        const next = existing ?? new SocialAccount()
        next.useTransaction(trx)
        next.merge({
          agencyId: state.agencyId,
          network: 'tiktok',
          externalAccountId: profile.openId,
          externalAccountName: profile.displayName,
          encryptedAccessToken: encryptSocialToken(token.accessToken, tokenKey()),
          encryptedRefreshToken: token.refreshToken
            ? encryptSocialToken(token.refreshToken, tokenKey())
            : null,
          expiresAt: token.expiresIn ? DateTime.utc().plus({ seconds: token.expiresIn }) : null,
          scopes: token.scopes,
          metadataJson: {
            creatorInfo,
            refreshTokenExpiresAt: token.refreshTokenExpiresIn
              ? DateTime.utc().plus({ seconds: token.refreshTokenExpiresIn }).toISO()
              : null,
          },
          status: 'connected',
          createdBy: existing?.createdBy ?? actor.id,
          revokedAt: null,
        })
        await next.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetUserId: null,
            targetProjectId: null,
            targetPublicationId: null,
            action: 'social.tiktok_connected',
            previousValues: existing ? { status: existing.status } : {},
            nextValues: {
              accountId: next.id,
              tiktokUserId: profile.openId,
              maxVideoPostDurationSec: creatorInfo.maxVideoPostDurationSec,
              status: 'connected',
            },
          },
          { client: trx }
        )
        return next
      })
      logger.info({
        event: 'social.tiktok_connected',
        accountId: account.id,
        actorId: actor.id,
      })
      const success = new URL(tiktokConfig.successUrl)
      success.searchParams.set('tiktok', 'connected')
      response.redirect(success.toString())
    } catch (error) {
      logger.warn({
        event: 'social.tiktok_oauth_failed',
        actorId: actor.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.badRequest({ errors: [{ message: 'La connexion TikTok a échoué.' }] })
    }
  }

  async accounts({ auth, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const query = SocialAccount.query().where('network', 'tiktok').orderBy('createdAt', 'desc')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const accounts = await query
    return response.ok({ data: accounts.map(toSocialAccountView) })
  }

  async refresh({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(tiktokAccountValidator)
    const query = SocialAccount.query().where('id', params.id).where('network', 'tiktok')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const account = await query.first()
    if (!account) return response.notFound(accountNotFound)
    if (!account.encryptedRefreshToken) {
      return response.unprocessableEntity({
        errors: [
          {
            message:
              'Le renouvellement programmatique est indisponible pour ce compte. Reconnectez TikTok.',
          },
        ],
      })
    }
    const previousStatus = account.status
    try {
      const token = await getTikTokOAuthClient().refreshToken(
        decryptSocialToken(account.encryptedRefreshToken, tokenKey())
      )
      const creatorInfo = await getTikTokOAuthClient().creatorInfo(token.accessToken)
      await db.transaction(async (trx) => {
        account.useTransaction(trx)
        account.merge({
          encryptedAccessToken: encryptSocialToken(token.accessToken, tokenKey()),
          encryptedRefreshToken: token.refreshToken
            ? encryptSocialToken(token.refreshToken, tokenKey())
            : account.encryptedRefreshToken,
          expiresAt: token.expiresIn ? DateTime.utc().plus({ seconds: token.expiresIn }) : null,
          scopes: token.scopes,
          metadataJson: {
            ...account.metadataJson,
            creatorInfo,
            refreshTokenExpiresAt: token.refreshTokenExpiresIn
              ? DateTime.utc().plus({ seconds: token.refreshTokenExpiresIn }).toISO()
              : account.metadataJson.refreshTokenExpiresAt,
          },
          status: 'connected',
        })
        await account.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetUserId: null,
            targetProjectId: null,
            targetPublicationId: null,
            action: 'social.tiktok_refreshed',
            previousValues: { accountId: account.id, status: previousStatus },
            nextValues: { accountId: account.id, status: 'connected' },
          },
          { client: trx }
        )
      })
      logger.info({ event: 'social.tiktok_refreshed', accountId: account.id, actorId: actor.id })
      return response.ok({ data: toSocialAccountView(account) })
    } catch (error) {
      logger.warn({
        event: 'social.tiktok_refresh_failed',
        accountId: account.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.badGateway({
        errors: [{ message: 'Le renouvellement TikTok a échoué. Reconnectez le compte.' }],
      })
    }
  }

  async revoke({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(tiktokAccountValidator)
    const query = SocialAccount.query().where('id', params.id).where('network', 'tiktok')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const account = await query.first()
    if (!account) return response.notFound(accountNotFound)
    if (account.encryptedAccessToken) {
      try {
        await getTikTokOAuthClient().revoke(
          decryptSocialToken(account.encryptedAccessToken, tokenKey())
        )
      } catch (error) {
        logger.warn({
          event: 'social.tiktok_revoke_failed',
          accountId: account.id,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        return response.badGateway({
          errors: [{ message: 'TikTok n’a pas confirmé la révocation. Réessayez.' }],
        })
      }
    }
    await db.transaction(async (trx) => {
      account.useTransaction(trx)
      account.merge({
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        status: 'revoked',
        revokedAt: DateTime.utc(),
      })
      await account.save()
      await AuditLog.create(
        {
          actorUserId: actor.id,
          targetUserId: null,
          targetProjectId: null,
          targetPublicationId: null,
          action: 'social.tiktok_revoked',
          previousValues: { accountId: account.id, status: 'connected' },
          nextValues: { accountId: account.id, status: 'revoked' },
        },
        { client: trx }
      )
    })
    logger.info({ event: 'social.tiktok_revoked', accountId: account.id, actorId: actor.id })
    return response.ok({ data: toSocialAccountView(account) })
  }

  async validate({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(tiktokPublicationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const account = await accountForPublication(payload.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    await refreshCreatorCapabilities(account)
    const effective = await effectiveNetworkText(publication, 'tiktok')
    const requestedVideo = videoFrom(payload)
    const video =
      effective.source === 'variant'
        ? { ...requestedVideo, caption: effective.text }
        : requestedVideo
    return response.ok({ data: await validatePublicationForTikTok(publication, account, video) })
  }

  async schedule({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(tiktokScheduleValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const account = await accountForPublication(payload.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    await refreshCreatorCapabilities(account)
    const idempotencyKey = tiktokIdempotencyKey({
      publicationId: publication.id,
      version: publication.contentVersion,
      accountId: account.id,
    })
    const existing = await ScheduledPublication.query()
      .where('idempotencyKey', idempotencyKey)
      .first()
    if (existing) return response.ok({ data: await toScheduleView(existing) })
    const effective = await effectiveNetworkText(publication, 'tiktok')
    const requestedVideo = videoFrom(payload)
    const video =
      effective.source === 'variant'
        ? { ...requestedVideo, caption: effective.text }
        : requestedVideo
    const validation = await validatePublicationForTikTok(publication, account, video)
    if (!validation.valid) return response.unprocessableEntity({ errors: validation.errors })
    const runAt = payload.runAt
      ? DateTime.fromISO(payload.runAt, { setZone: true }).toUTC()
      : (publication.scheduledAt ?? DateTime.utc())
    if (!runAt.isValid) {
      return response.unprocessableEntity({ errors: [{ message: 'La date est invalide.' }] })
    }
    let schedule: ScheduledPublication
    const previousStatus = publication.status
    try {
      schedule = await db.transaction(async (trx) => {
        const media = await tiktokMediaForPublication(publication.id)
        const created = await ScheduledPublication.create(
          {
            publicationId: publication.id,
            network: 'tiktok',
            accountId: account.id,
            publicationVersion: publication.contentVersion,
            runAt,
            status: 'queued',
            idempotencyKey,
            networkPayloadJson: video,
            payloadHash: tiktokPayloadHash({
              video,
              media,
            }),
            providerJobId: null,
            providerStatus: null,
          },
          { client: trx }
        )
        publication.useTransaction(trx)
        publication.status = 'scheduled'
        await publication.save()
        await AuditLog.create(
          {
            actorUserId: actor.id,
            targetUserId: null,
            targetProjectId: publication.projectId,
            targetPublicationId: publication.id,
            action: 'social.tiktok_scheduled',
            previousValues: { status: previousStatus },
            nextValues: {
              status: 'scheduled',
              scheduledPublicationId: created.id,
              publicationVersion: created.publicationVersion,
            },
          },
          { client: trx }
        )
        return created
      })
    } catch (error) {
      if ((error as { code?: string }).code !== '23505') throw error
      const concurrent = await ScheduledPublication.query()
        .where('idempotencyKey', idempotencyKey)
        .firstOrFail()
      return response.ok({ data: await toScheduleView(concurrent) })
    }
    try {
      await enqueueTikTokPublication({
        scheduledPublicationId: schedule.id,
        jobId: `tiktok-${idempotencyKey}`,
        runAt: runAt.toJSDate(),
      })
    } catch (error) {
      await markSocialScheduleFailed(schedule.id, publication.id)
      schedule.status = 'failed'
      logger.error({
        event: 'social.tiktok_enqueue_failed',
        scheduledPublicationId: schedule.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.serviceUnavailable({
        errors: [{ message: 'La programmation n’a pas pu être placée dans la file.' }],
      })
    }
    logger.info({
      event: 'social.tiktok_scheduled',
      scheduledPublicationId: schedule.id,
      actorId: actor.id,
    })
    return response.created({ data: await toScheduleView(schedule) })
  }

  async publicationStatus({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(tiktokStatusValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const schedule = await ScheduledPublication.query()
      .where('publicationId', publication.id)
      .where('network', 'tiktok')
      .orderBy('createdAt', 'desc')
      .first()
    return response.ok({ data: schedule ? await toScheduleView(schedule) : null })
  }

  async scheduleStatus({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(tiktokStatusValidator)
    const schedule = await ScheduledPublication.query()
      .where('id', params.id)
      .where('network', 'tiktok')
      .first()
    if (!schedule) return response.notFound(scheduleNotFound)
    if (!(await findAccessiblePublication(actor, schedule.publicationId))) {
      return response.notFound(scheduleNotFound)
    }
    return response.ok({ data: await toScheduleView(schedule) })
  }

  async retry({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(tiktokStatusValidator)
    const schedule = await ScheduledPublication.query()
      .where('id', params.id)
      .where('network', 'tiktok')
      .first()
    if (!schedule) return response.notFound(scheduleNotFound)
    const publication = await findAccessiblePublication(actor, schedule.publicationId)
    if (!publication) return response.notFound(scheduleNotFound)
    if (schedule.status !== 'failed') {
      return response.conflict({ errors: [{ message: 'Seul un échec peut être relancé.' }] })
    }
    const account = await accountForPublication(schedule.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    await refreshCreatorCapabilities(account)
    const video = schedule.networkPayloadJson as TikTokVideoPayload
    const validation = await validatePublicationForTikTok(publication, account, video)
    const versionStillApproved =
      schedule.publicationVersion === publication.contentVersion &&
      publication.approvedVersion === publication.contentVersion
    const retryErrors = validation.errors.filter(
      (message) => message !== 'La publication doit être approuvée.'
    )
    if (retryErrors.length || !versionStillApproved) {
      return response.conflict({
        errors: [{ message: 'La publication ou le compte doit être corrigé avant la relance.' }],
      })
    }
    const attempts = await PublicationAttempt.query()
      .where('scheduledId', schedule.id)
      .count('* as total')
    const generation = Number(attempts[0].$extras.total) + 1
    const media = await tiktokMediaForPublication(publication.id)
    schedule.status = 'queued'
    schedule.providerJobId = null
    schedule.providerStatus = null
    schedule.payloadHash = tiktokPayloadHash({ video, media })
    publication.status = 'scheduled'
    await Promise.all([schedule.save(), publication.save()])
    try {
      await enqueueTikTokPublication({
        scheduledPublicationId: schedule.id,
        jobId: `tiktok-${schedule.idempotencyKey}-manual-${generation}`,
        runAt: new Date(),
      })
    } catch (error) {
      await markSocialScheduleFailed(schedule.id, publication.id)
      schedule.status = 'failed'
      logger.error({
        event: 'social.tiktok_retry_enqueue_failed',
        scheduledPublicationId: schedule.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.serviceUnavailable({
        errors: [{ message: 'La relance n’a pas pu être placée dans la file.' }],
      })
    }
    await AuditLog.create({
      actorUserId: actor.id,
      targetUserId: null,
      targetProjectId: publication.projectId,
      targetPublicationId: publication.id,
      action: 'social.tiktok_retry_requested',
      previousValues: { status: 'failed' },
      nextValues: { status: 'queued', scheduledPublicationId: schedule.id },
    })
    logger.info({
      event: 'social.tiktok_retry_requested',
      scheduledPublicationId: schedule.id,
      actorId: actor.id,
    })
    return response.accepted({ data: await toScheduleView(schedule) })
  }
}
