import linkedinConfig from '#config/linkedin'
import { linkedinIdempotencyKey, linkedinPayloadHash } from '#domain/social/linkedin'
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
  linkedinMediaForPublication,
  validatePublicationForLinkedIn,
} from '#services/social/linkedin_service'
import { getLinkedInOAuthClient } from '#services/social/linkedin_oauth_client'
import { enqueueLinkedInPublication } from '#services/social/linkedin_queue'
import { markSocialScheduleFailed } from '#services/social/social_status_service'
import { decryptSocialToken, encryptSocialToken } from '#services/social/token_cipher'
import env from '#start/env'
import {
  linkedinAccountValidator,
  linkedinOAuthCallbackValidator,
  linkedinOAuthStartValidator,
  linkedinPublicationValidator,
  linkedinScheduleValidator,
  linkedinStatusValidator,
} from '#validators/linkedin_validator'
import type { HttpContext } from '@adonisjs/core/http'
import encryption from '@adonisjs/core/services/encryption'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { randomBytes, timingSafeEqual } from 'node:crypto'

type OAuthState = {
  nonce: string
  actorId: string
  agencyId: string
  organizationId: string
  expiresAt: number
}

const publicationNotFound = { errors: [{ message: 'Publication introuvable.' }] }
const accountNotFound = { errors: [{ message: 'Compte LinkedIn introuvable.' }] }
const scheduleNotFound = { errors: [{ message: 'Programmation LinkedIn introuvable.' }] }

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
    .where('network', 'linkedin')
    .first()
}

export default class LinkedInController {
  async oauthStart({ auth, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(linkedinOAuthStartValidator)
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
      organizationId: payload.organizationId,
      expiresAt: Date.now() + 10 * 60_000,
    }
    session.put('linkedin_oauth_nonce', nonce)
    const state = encryption.encrypt(JSON.stringify(statePayload), 600, 'linkedin:oauth-state')
    return response.ok({
      data: { authorizationUrl: getLinkedInOAuthClient().authorizationUrl(state) },
    })
  }

  async oauthCallback({ auth, logger, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(linkedinOAuthCallbackValidator)
    const decrypted = encryption.decrypt(payload.state, 'linkedin:oauth-state')
    const nonce = session.get('linkedin_oauth_nonce')
    session.forget('linkedin_oauth_nonce')
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
      const client = getLinkedInOAuthClient()
      const token = await client.exchangeCode(payload.code)
      const organizations = await client.managedOrganizations(token.accessToken)
      const organization = organizations.find((candidate) => candidate.id === state.organizationId)
      if (!organization) {
        return response.unprocessableEntity({
          errors: [{ message: 'L’organisation LinkedIn sélectionnée n’est pas administrable.' }],
        })
      }
      const missingScopes = linkedinConfig.scopes.filter((scope) => !token.scopes.includes(scope))
      if (missingScopes.length) {
        return response.unprocessableEntity({
          errors: [{ message: 'Les permissions LinkedIn minimales n’ont pas été accordées.' }],
          meta: { missingScopes },
        })
      }
      const account = await db.transaction(async (trx) => {
        const existing = await SocialAccount.query({ client: trx })
          .where('agencyId', state.agencyId)
          .where('network', 'linkedin')
          .where('externalAccountId', organization.id)
          .first()
        const next = existing ?? new SocialAccount()
        next.useTransaction(trx)
        next.merge({
          agencyId: state.agencyId,
          network: 'linkedin',
          externalAccountId: organization.id,
          externalAccountName: organization.name,
          encryptedAccessToken: encryptSocialToken(token.accessToken, tokenKey()),
          encryptedRefreshToken: token.refreshToken
            ? encryptSocialToken(token.refreshToken, tokenKey())
            : null,
          expiresAt: token.expiresIn ? DateTime.utc().plus({ seconds: token.expiresIn }) : null,
          scopes: token.scopes,
          metadataJson: {
            role: organization.role,
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
            action: 'social.linkedin_connected',
            previousValues: existing ? { status: existing.status } : {},
            nextValues: {
              accountId: next.id,
              organizationId: organization.id,
              status: 'connected',
            },
          },
          { client: trx }
        )
        return next
      })
      logger.info({
        event: 'social.linkedin_connected',
        accountId: account.id,
        actorId: actor.id,
      })
      const success = new URL(linkedinConfig.successUrl)
      success.searchParams.set('linkedin', 'connected')
      response.redirect(success.toString())
    } catch (error) {
      logger.warn({
        event: 'social.linkedin_oauth_failed',
        actorId: actor.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.badRequest({ errors: [{ message: 'La connexion LinkedIn a échoué.' }] })
    }
  }

  async accounts({ auth, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const query = SocialAccount.query().where('network', 'linkedin').orderBy('createdAt', 'desc')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const accounts = await query
    return response.ok({ data: accounts.map(toSocialAccountView) })
  }

  async refresh({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(linkedinAccountValidator)
    const query = SocialAccount.query().where('id', params.id).where('network', 'linkedin')
    if (actor.role === 'agency') query.where('agencyId', actor.agencyId!)
    const account = await query.first()
    if (!account) return response.notFound(accountNotFound)
    if (!account.encryptedRefreshToken) {
      return response.unprocessableEntity({
        errors: [
          {
            message:
              'Le renouvellement programmatique est indisponible pour ce compte. Reconnectez LinkedIn.',
          },
        ],
      })
    }
    const previousStatus = account.status
    try {
      const token = await getLinkedInOAuthClient().refreshToken(
        decryptSocialToken(account.encryptedRefreshToken, tokenKey())
      )
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
            action: 'social.linkedin_refreshed',
            previousValues: { accountId: account.id, status: previousStatus },
            nextValues: { accountId: account.id, status: 'connected' },
          },
          { client: trx }
        )
      })
      logger.info({ event: 'social.linkedin_refreshed', accountId: account.id, actorId: actor.id })
      return response.ok({ data: toSocialAccountView(account) })
    } catch (error) {
      logger.warn({
        event: 'social.linkedin_refresh_failed',
        accountId: account.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.badGateway({
        errors: [{ message: 'Le renouvellement LinkedIn a échoué. Reconnectez le compte.' }],
      })
    }
  }

  async revoke({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(linkedinAccountValidator)
    const query = SocialAccount.query().where('id', params.id).where('network', 'linkedin')
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
          action: 'social.linkedin_revoked',
          previousValues: { accountId: account.id, status: 'connected' },
          nextValues: { accountId: account.id, status: 'revoked' },
        },
        { client: trx }
      )
    })
    logger.info({ event: 'social.linkedin_revoked', accountId: account.id, actorId: actor.id })
    return response.ok({ data: toSocialAccountView(account) })
  }

  async validate({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(linkedinPublicationValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const account = await accountForPublication(payload.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    const effective = await effectiveNetworkText(publication, 'linkedin')
    return response.ok({
      data: await validatePublicationForLinkedIn(publication, account, effective.text),
    })
  }

  async schedule({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(linkedinScheduleValidator)
    const publication = await findAccessiblePublication(actor, payload.params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const account = await accountForPublication(payload.accountId, publication.agencyId)
    if (!account) return response.notFound(accountNotFound)
    const idempotencyKey = linkedinIdempotencyKey({
      publicationId: publication.id,
      version: publication.contentVersion,
      accountId: account.id,
    })
    const existing = await ScheduledPublication.query()
      .where('idempotencyKey', idempotencyKey)
      .first()
    if (existing) return response.ok({ data: await toScheduleView(existing) })
    const effective = await effectiveNetworkText(publication, 'linkedin')
    const validation = await validatePublicationForLinkedIn(publication, account, effective.text)
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
        const media = await linkedinMediaForPublication(publication.id)
        const created = await ScheduledPublication.create(
          {
            publicationId: publication.id,
            network: 'linkedin',
            accountId: account.id,
            publicationVersion: publication.contentVersion,
            runAt,
            status: 'queued',
            idempotencyKey,
            networkPayloadJson: { text: effective.text, networkVariantId: effective.variantId },
            payloadHash: linkedinPayloadHash({
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
            action: 'social.linkedin_scheduled',
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
      await enqueueLinkedInPublication({
        scheduledPublicationId: schedule.id,
        jobId: `linkedin-${idempotencyKey}`,
        runAt: runAt.toJSDate(),
      })
    } catch (error) {
      await markSocialScheduleFailed(schedule.id, publication.id)
      schedule.status = 'failed'
      logger.error({
        event: 'social.linkedin_enqueue_failed',
        scheduledPublicationId: schedule.id,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return response.serviceUnavailable({
        errors: [{ message: 'La programmation n’a pas pu être placée dans la file.' }],
      })
    }
    logger.info({
      event: 'social.linkedin_scheduled',
      scheduledPublicationId: schedule.id,
      actorId: actor.id,
    })
    return response.created({ data: await toScheduleView(schedule) })
  }

  async publicationStatus({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(linkedinStatusValidator)
    const publication = await findAccessiblePublication(actor, params.id)
    if (!publication) return response.notFound(publicationNotFound)
    const schedule = await ScheduledPublication.query()
      .where('publicationId', publication.id)
      .where('network', 'linkedin')
      .orderBy('createdAt', 'desc')
      .first()
    return response.ok({ data: schedule ? await toScheduleView(schedule) : null })
  }

  async scheduleStatus({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(linkedinStatusValidator)
    const schedule = await ScheduledPublication.query()
      .where('id', params.id)
      .where('network', 'linkedin')
      .first()
    if (!schedule) return response.notFound(scheduleNotFound)
    if (!(await findAccessiblePublication(actor, schedule.publicationId))) {
      return response.notFound(scheduleNotFound)
    }
    return response.ok({ data: await toScheduleView(schedule) })
  }

  async retry({ auth, logger, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { params } = await request.validateUsing(linkedinStatusValidator)
    const schedule = await ScheduledPublication.query()
      .where('id', params.id)
      .where('network', 'linkedin')
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
    const validation = await validatePublicationForLinkedIn(publication, account, frozenText)
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
      await enqueueLinkedInPublication({
        scheduledPublicationId: schedule.id,
        jobId: `linkedin-${schedule.idempotencyKey}-manual-${generation}`,
        runAt: new Date(),
      })
    } catch (error) {
      await markSocialScheduleFailed(schedule.id, publication.id)
      schedule.status = 'failed'
      logger.error({
        event: 'social.linkedin_retry_enqueue_failed',
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
      action: 'social.linkedin_retry_requested',
      previousValues: { status: 'failed' },
      nextValues: { status: 'queued', scheduledPublicationId: schedule.id },
    })
    logger.info({
      event: 'social.linkedin_retry_requested',
      scheduledPublicationId: schedule.id,
      actorId: actor.id,
    })
    return response.accepted({ data: await toScheduleView(schedule) })
  }
}
