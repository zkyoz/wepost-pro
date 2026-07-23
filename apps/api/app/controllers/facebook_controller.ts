import facebookConfig from '#config/facebook'
import { facebookIdempotencyKey, facebookPayloadHash } from '#domain/social/facebook'
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
  facebookMediaForPublication,
  validatePublicationForFacebook,
} from '#services/social/facebook_service'
import { getFacebookOAuthClient } from '#services/social/facebook_oauth_client'
import { enqueueFacebookPublication } from '#services/social/facebook_queue'
import { markSocialScheduleFailed } from '#services/social/social_status_service'
import { encryptSocialToken } from '#services/social/token_cipher'
import env from '#start/env'
import {
  facebookAccountValidator,
  facebookOAuthCallbackValidator,
  facebookOAuthStartValidator,
  facebookPublicationValidator,
  facebookScheduleValidator,
  facebookStatusValidator,
} from '#validators/facebook_validator'
import type { HttpContext } from '@adonisjs/core/http'
import encryption from '@adonisjs/core/services/encryption'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomBytes, timingSafeEqual } from 'node:crypto'

type OAuthState = {
  nonce: string
  actorId: string
  agencyId: string
  pageId: string
  expiresAt: number
}

const publicationNotFound = { errors: [{ message: 'Publication introuvable.' }] }
const accountNotFound = { errors: [{ message: 'Compte Facebook introuvable.' }] }
const scheduleNotFound = { errors: [{ message: 'Programmation Facebook introuvable.' }] }

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

async function accountForPublication(accountId: string, agencyId: string) {
  return SocialAccount.query()
    .where('id', accountId)
    .where('agencyId', agencyId)
    .where('network', 'facebook')
    .first()
}

export default class FacebookController {
  async oauthStart({ auth, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(facebookOAuthStartValidator)
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
      pageId: payload.pageId,
      expiresAt: Date.now() + 10 * 60_000,
    }
    session.put('facebook_oauth_nonce', nonce)
    const state = encryption.encrypt(JSON.stringify(statePayload), 600, 'facebook:oauth-state')
    return response.ok({
      data: { authorizationUrl: getFacebookOAuthClient().authorizationUrl(state) },
    })
  }

  async oauthCallback({ auth, logger, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(facebookOAuthCallbackValidator)
    const decrypted = encryption.decrypt(payload.state, 'facebook:oauth-state')
    const nonce = session.get('facebook_oauth_nonce')
    session.forget('facebook_oauth_nonce')
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
      const client = getFacebookOAuthClient()
      const shortToken = await client.exchangeCode(payload.code)
      const longToken = await client.exchangeLongLivedToken(shortToken.accessToken)
      const [pages, grantedScopes] = await Promise.all([
        client.managedPages(longToken.accessToken),
        client.grantedScopes(longToken.accessToken),
      ])
      const page = pages.find((candidate) => candidate.id === state.pageId)
      if (!page) {
        return response.unprocessableEntity({
          errors: [{ message: 'La page sélectionnée n’est pas administrée par ce compte.' }],
        })
      }
      const missingScopes = facebookConfig.scopes.filter((scope) => !grantedScopes.includes(scope))
      if (missingScopes.length) {
        return response.unprocessableEntity({
          errors: [{ message: 'Les permissions Facebook minimales n’ont pas été accordées.' }],
          meta: { missingScopes },
        })
      }
      const account = await db.transaction(async (trx) => {
        const existing = await SocialAccount.query({ client: trx })
          .where('agencyId', state.agencyId)
          .where('network', 'facebook')
          .where('externalAccountId', page.id)
          .first()
        const next = existing ?? new SocialAccount()
        next.useTransaction(trx)
        next.merge({
          agencyId: state.agencyId,
          network: 'facebook',
          externalAccountId: page.id,
          externalAccountName: page.name,
          encryptedAccessToken: encryptSocialToken(page.accessToken, tokenKey()),
          encryptedRefreshToken: null,
          expiresAt: longToken.expiresIn
            ? DateTime.utc().plus({ seconds: longToken.expiresIn })
            : null,
          scopes: grantedScopes,
          metadataJson: { pageTasks: page.tasks },
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
            action: 'social.facebook_connected',
            previousValues: existing ? { status: existing.status } : {},
            nextValues: { accountId: next.id, pageId: page.id, status: 'connected' },
          },
          { client: trx }
        )
        return next
      })
      logger.info({
        event: 'social.facebook_connected',
        accountId: account.id,
        actorId: actor.id,
      })
      const success = new URL(facebookConfig.successUrl)
      success.searchParams.set('facebook', 'connected')
      response.redirect(success.toString())
    } catch (error) {
      logger.warn({
        event: 'social.facebook_oauth_failed',
        actorId: actor.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.badRequest({ errors: [{ message: 'La connexion Facebook a échoué.' }] })
    }
  }

  async accounts({ auth, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const query = SocialAccount.query().where('network', 'facebook').orderBy('createdAt', 'desc')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const accounts = await query
    return response.ok({ data: accounts.map(toSocialAccountView) })
  }

  async revoke({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(facebookAccountValidator)
    const query = SocialAccount.query().where('id', params.id).where('network', 'facebook')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const account = await query.first()
    if (!account) return response.notFound(accountNotFound)
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
          action: 'social.facebook_revoked',
          previousValues: { accountId: account.id, status: 'connected' },
          nextValues: { accountId: account.id, status: 'revoked' },
        },
        { client: trx }
      )
    })
    logger.info({ event: 'social.facebook_revoked', accountId: account.id, actorId: actor.id })
    return response.ok({ data: toSocialAccountView(account) })
  }

  async validate({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(facebookPublicationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const account = await accountForPublication(payload.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    const effective = await effectiveNetworkText(publication, 'facebook')
    return response.ok({
      data: await validatePublicationForFacebook(publication, account, effective.text),
    })
  }

  async schedule({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(facebookScheduleValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const account = await accountForPublication(payload.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    const idempotencyKey = facebookIdempotencyKey({
      publicationId: publication.id,
      version: publication.contentVersion,
      accountId: account.id,
    })
    const existing = await ScheduledPublication.query()
      .where('idempotencyKey', idempotencyKey)
      .first()
    if (existing) return response.ok({ data: await toScheduleView(existing) })
    const effective = await effectiveNetworkText(publication, 'facebook')
    const validation = await validatePublicationForFacebook(publication, account, effective.text)
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
        const media = await facebookMediaForPublication(publication.id)
        const created = await ScheduledPublication.create(
          {
            publicationId: publication.id,
            network: 'facebook',
            accountId: account.id,
            publicationVersion: publication.contentVersion,
            runAt,
            status: 'queued',
            idempotencyKey,
            networkPayloadJson: { text: effective.text, networkVariantId: effective.variantId },
            payloadHash: facebookPayloadHash({
              text: effective.text,
              media,
            }),
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
            action: 'social.facebook_scheduled',
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
      await enqueueFacebookPublication({
        scheduledPublicationId: schedule.id,
        jobId: `facebook-${idempotencyKey}`,
        runAt: runAt.toJSDate(),
      })
    } catch (error) {
      await markSocialScheduleFailed(schedule.id, publication.id)
      schedule.status = 'failed'
      logger.error({
        event: 'social.facebook_enqueue_failed',
        scheduledPublicationId: schedule.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.serviceUnavailable({
        errors: [{ message: 'La programmation n’a pas pu être placée dans la file.' }],
      })
    }
    logger.info({
      event: 'social.facebook_scheduled',
      scheduledPublicationId: schedule.id,
      actorId: actor.id,
    })
    return response.created({ data: await toScheduleView(schedule) })
  }

  async publicationStatus({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(facebookStatusValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const schedule = await ScheduledPublication.query()
      .where('publicationId', publication.id)
      .where('network', 'facebook')
      .orderBy('createdAt', 'desc')
      .first()
    return response.ok({ data: schedule ? await toScheduleView(schedule) : null })
  }

  async scheduleStatus({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(facebookStatusValidator)
    const schedule = await ScheduledPublication.query()
      .where('id', params.id)
      .where('network', 'facebook')
      .first()
    if (!schedule) return response.notFound(scheduleNotFound)
    if (!(await findAccessiblePublication(actor, schedule.publicationId))) {
      return response.notFound(scheduleNotFound)
    }
    return response.ok({ data: await toScheduleView(schedule) })
  }

  async retry({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(facebookStatusValidator)
    const schedule = await ScheduledPublication.query()
      .where('id', params.id)
      .where('network', 'facebook')
      .first()
    if (!schedule) return response.notFound(scheduleNotFound)
    const publication = await findAccessiblePublication(actor, schedule.publicationId)
    if (!publication) return response.notFound(scheduleNotFound)
    if (schedule.status !== 'failed') {
      return response.conflict({ errors: [{ message: 'Seul un échec peut être relancé.' }] })
    }
    const account = await accountForPublication(schedule.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    const frozenText =
      typeof schedule.networkPayloadJson.text === 'string'
        ? schedule.networkPayloadJson.text
        : publication.baseText
    const validation = await validatePublicationForFacebook(publication, account, frozenText)
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
    schedule.status = 'queued'
    publication.status = 'scheduled'
    await Promise.all([schedule.save(), publication.save()])
    try {
      await enqueueFacebookPublication({
        scheduledPublicationId: schedule.id,
        jobId: `facebook-${schedule.idempotencyKey}-manual-${generation}`,
        runAt: new Date(),
      })
    } catch (error) {
      await markSocialScheduleFailed(schedule.id, publication.id)
      schedule.status = 'failed'
      logger.error({
        event: 'social.facebook_retry_enqueue_failed',
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
      action: 'social.facebook_retry_requested',
      previousValues: { status: 'failed' },
      nextValues: { status: 'queued', scheduledPublicationId: schedule.id },
    })
    logger.info({
      event: 'social.facebook_retry_requested',
      scheduledPublicationId: schedule.id,
      actorId: actor.id,
    })
    return response.accepted({ data: await toScheduleView(schedule) })
  }
}
