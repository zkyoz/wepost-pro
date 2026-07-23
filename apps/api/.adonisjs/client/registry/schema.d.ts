/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health.live': {
    methods: ["GET","HEAD"]
    pattern: '/health/live'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['live']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['live']>>>
    }
  }
  'health.ready': {
    methods: ["GET","HEAD"]
    pattern: '/health/ready'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['ready']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['ready']>>>
    }
  }
  'docs.ui': {
    methods: ["GET","HEAD"]
    pattern: '/api/docs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_docs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/api_docs_controller').default['show']>>>
    }
  }
  'docs.spec': {
    methods: ["GET","HEAD"]
    pattern: '/api/openapi.json'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_docs_controller').default['spec']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/api_docs_controller').default['spec']>>>
    }
  }
  'auth.csrf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/csrf'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/csrf_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/csrf_controller').default['show']>>>
    }
  }
  'calendar.feed.public': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calendar/feeds/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['show']>>>
    }
  }
  'media.local_upload': {
    methods: ["PUT"]
    pattern: '/api/v1/media/local-upload'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['localUpload']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['localUpload']>>>
    }
  }
  'media.local_read': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/media/local-read'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['localRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['localRead']>>>
    }
  }
  'projects.clients': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/projects/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['clients']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['clients']>>>
    }
  }
  'auth.register.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/register_validator').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/register_validator').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/register_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/register_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.session.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth/login_validator').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth/login_validator').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.me.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/me_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/me_controller').default['show']>>>
    }
  }
  'auth.session.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['destroy']>>>
    }
  }
  'users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/user_validator').userIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.locale': {
    methods: ["PATCH"]
    pattern: '/api/v1/users/me/locale'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/translation_validator').updateLocaleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/translation_validator').updateLocaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/locales_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/locales_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.read.facebook.publication_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/facebook/publications/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/facebook_validator').facebookStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['publicationStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['publicationStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.read.facebook.schedule_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/facebook/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/facebook_validator').facebookStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['scheduleStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['scheduleStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.manage.facebook.oauth_start': {
    methods: ["POST"]
    pattern: '/api/v1/social/facebook/oauth/start'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/facebook_validator').facebookOAuthStartValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/facebook_validator').facebookOAuthStartValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['oauthStart']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['oauthStart']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.manage.facebook.oauth_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/facebook/oauth/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/facebook_validator').facebookOAuthCallbackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['oauthCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['oauthCallback']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.manage.facebook.accounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/facebook/accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['accounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['accounts']>>>
    }
  }
  'social.facebook.manage.facebook.revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/social/facebook/accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/facebook_validator').facebookAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/facebook_validator').facebookAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['revoke']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['revoke']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.manage.facebook.validate': {
    methods: ["POST"]
    pattern: '/api/v1/social/facebook/publications/:id/validate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/facebook_validator').facebookPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/facebook_validator').facebookPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['validate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['validate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.manage.facebook.schedule': {
    methods: ["POST"]
    pattern: '/api/v1/social/facebook/publications/:id/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/facebook_validator').facebookScheduleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/facebook_validator').facebookScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['schedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['schedule']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.facebook.manage.facebook.retry': {
    methods: ["POST"]
    pattern: '/api/v1/social/facebook/schedules/:id/retry'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/facebook_validator').facebookStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/facebook_validator').facebookStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/facebook_controller').default['retry']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.read.pinterest.publication_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/pinterest/publications/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pinterest_validator').pinterestStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['publicationStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['publicationStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.read.pinterest.schedule_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/pinterest/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pinterest_validator').pinterestStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['scheduleStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['scheduleStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.oauth_start': {
    methods: ["POST"]
    pattern: '/api/v1/social/pinterest/oauth/start'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pinterest_validator').pinterestOAuthStartValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/pinterest_validator').pinterestOAuthStartValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['oauthStart']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['oauthStart']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.oauth_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/pinterest/oauth/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pinterest_validator').pinterestOAuthCallbackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['oauthCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['oauthCallback']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.accounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/pinterest/accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['accounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['accounts']>>>
    }
  }
  'social.pinterest.manage.pinterest.refresh': {
    methods: ["POST"]
    pattern: '/api/v1/social/pinterest/accounts/:id/refresh'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pinterest_validator').pinterestAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pinterest_validator').pinterestAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['refresh']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['refresh']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/social/pinterest/accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pinterest_validator').pinterestAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pinterest_validator').pinterestAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['revoke']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['revoke']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.validate': {
    methods: ["POST"]
    pattern: '/api/v1/social/pinterest/publications/:id/validate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pinterest_validator').pinterestPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pinterest_validator').pinterestPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['validate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['validate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.schedule': {
    methods: ["POST"]
    pattern: '/api/v1/social/pinterest/publications/:id/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pinterest_validator').pinterestScheduleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pinterest_validator').pinterestScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['schedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['schedule']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.pinterest.manage.pinterest.retry': {
    methods: ["POST"]
    pattern: '/api/v1/social/pinterest/schedules/:id/retry'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pinterest_validator').pinterestStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pinterest_validator').pinterestStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pinterest_controller').default['retry']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.read.tik_tok.publication_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/tiktok/publications/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/tiktok_validator').tiktokStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['publicationStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['publicationStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.read.tik_tok.schedule_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/tiktok/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/tiktok_validator').tiktokStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['scheduleStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['scheduleStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.oauth_start': {
    methods: ["POST"]
    pattern: '/api/v1/social/tiktok/oauth/start'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tiktok_validator').tiktokOAuthStartValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/tiktok_validator').tiktokOAuthStartValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['oauthStart']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['oauthStart']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.oauth_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/tiktok/oauth/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/tiktok_validator').tiktokOAuthCallbackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['oauthCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['oauthCallback']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.accounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/tiktok/accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['accounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['accounts']>>>
    }
  }
  'social.tiktok.manage.tik_tok.refresh': {
    methods: ["POST"]
    pattern: '/api/v1/social/tiktok/accounts/:id/refresh'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tiktok_validator').tiktokAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tiktok_validator').tiktokAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['refresh']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['refresh']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/social/tiktok/accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tiktok_validator').tiktokAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tiktok_validator').tiktokAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['revoke']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['revoke']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.validate': {
    methods: ["POST"]
    pattern: '/api/v1/social/tiktok/publications/:id/validate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tiktok_validator').tiktokPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tiktok_validator').tiktokPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['validate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['validate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.schedule': {
    methods: ["POST"]
    pattern: '/api/v1/social/tiktok/publications/:id/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tiktok_validator').tiktokScheduleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tiktok_validator').tiktokScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['schedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['schedule']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.tiktok.manage.tik_tok.retry': {
    methods: ["POST"]
    pattern: '/api/v1/social/tiktok/schedules/:id/retry'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tiktok_validator').tiktokStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tiktok_validator').tiktokStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tiktok_controller').default['retry']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.read.linked_in.publication_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/linkedin/publications/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/linkedin_validator').linkedinStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['publicationStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['publicationStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.read.linked_in.schedule_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/linkedin/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/linkedin_validator').linkedinStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['scheduleStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['scheduleStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.oauth_start': {
    methods: ["POST"]
    pattern: '/api/v1/social/linkedin/oauth/start'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/linkedin_validator').linkedinOAuthStartValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/linkedin_validator').linkedinOAuthStartValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['oauthStart']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['oauthStart']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.oauth_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/linkedin/oauth/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/linkedin_validator').linkedinOAuthCallbackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['oauthCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['oauthCallback']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.accounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/linkedin/accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['accounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['accounts']>>>
    }
  }
  'social.linkedin.manage.linked_in.refresh': {
    methods: ["POST"]
    pattern: '/api/v1/social/linkedin/accounts/:id/refresh'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/linkedin_validator').linkedinAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/linkedin_validator').linkedinAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['refresh']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['refresh']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/social/linkedin/accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/linkedin_validator').linkedinAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/linkedin_validator').linkedinAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['revoke']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['revoke']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.validate': {
    methods: ["POST"]
    pattern: '/api/v1/social/linkedin/publications/:id/validate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/linkedin_validator').linkedinPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/linkedin_validator').linkedinPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['validate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['validate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.schedule': {
    methods: ["POST"]
    pattern: '/api/v1/social/linkedin/publications/:id/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/linkedin_validator').linkedinScheduleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/linkedin_validator').linkedinScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['schedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['schedule']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.linkedin.manage.linked_in.retry': {
    methods: ["POST"]
    pattern: '/api/v1/social/linkedin/schedules/:id/retry'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/linkedin_validator').linkedinStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/linkedin_validator').linkedinStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/linkedin_controller').default['retry']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.read.instagram.publication_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/instagram/publications/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/instagram_validator').instagramStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['publicationStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['publicationStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.read.instagram.schedule_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/instagram/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/instagram_validator').instagramStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['scheduleStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['scheduleStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.manage.instagram.oauth_start': {
    methods: ["POST"]
    pattern: '/api/v1/social/instagram/oauth/start'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/instagram_validator').instagramOAuthStartValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/instagram_validator').instagramOAuthStartValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['oauthStart']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['oauthStart']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.manage.instagram.oauth_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/instagram/oauth/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/instagram_validator').instagramOAuthCallbackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['oauthCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['oauthCallback']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.manage.instagram.accounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/social/instagram/accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['accounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['accounts']>>>
    }
  }
  'social.instagram.manage.instagram.revoke': {
    methods: ["DELETE"]
    pattern: '/api/v1/social/instagram/accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/instagram_validator').instagramAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/instagram_validator').instagramAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['revoke']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['revoke']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.manage.instagram.validate': {
    methods: ["POST"]
    pattern: '/api/v1/social/instagram/publications/:id/validate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/instagram_validator').instagramPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/instagram_validator').instagramPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['validate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['validate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.manage.instagram.schedule': {
    methods: ["POST"]
    pattern: '/api/v1/social/instagram/publications/:id/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/instagram_validator').instagramScheduleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/instagram_validator').instagramScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['schedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['schedule']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'social.instagram.manage.instagram.retry': {
    methods: ["POST"]
    pattern: '/api/v1/social/instagram/schedules/:id/retry'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/instagram_validator').instagramStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/instagram_validator').instagramStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/instagram_controller').default['retry']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.overview': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/overview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['overview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['overview']>>>
    }
  }
  'admin.admin_users.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/user_validator').listAdminUsersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/user_validator').userIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_users.update_role': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/users/:id/role'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin/user_validator').updateUserRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin/user_validator').updateUserRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateRole']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateRole']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_users.update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/users/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin/user_validator').updateUserStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin/user_validator').updateUserStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.projects': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/projects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminProjectsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['projects']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['projects']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.project': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/projects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['project']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['project']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.archive_project': {
    methods: ["POST"]
    pattern: '/api/v1/admin/projects/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['archiveProject']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['archiveProject']>>>
    }
  }
  'admin.admin_resources.restore_project': {
    methods: ["POST"]
    pattern: '/api/v1/admin/projects/:id/restore'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['restoreProject']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['restoreProject']>>>
    }
  }
  'admin.admin_resources.publications': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/publications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminPublicationsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['publications']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['publications']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.publication': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/publications/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['publication']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['publication']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.archive_publication': {
    methods: ["POST"]
    pattern: '/api/v1/admin/publications/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['archivePublication']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['archivePublication']>>>
    }
  }
  'admin.admin_resources.restore_publication': {
    methods: ["POST"]
    pattern: '/api/v1/admin/publications/:id/restore'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['restorePublication']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['restorePublication']>>>
    }
  }
  'admin.admin_resources.social_accounts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/social-accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminSocialAccountsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['socialAccounts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['socialAccounts']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.social_account': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/social-accounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['socialAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['socialAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.incidents': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/incidents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminIncidentsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['incidents']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['incidents']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.incident': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/incidents/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['incident']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['incident']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_resources.audit_logs': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/audit-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/resource_validator').adminAuditValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['auditLogs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/resources_controller').default['auditLogs']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_system.status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/system/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/system_controller').default['status']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/system_controller').default['status']>>>
    }
  }
  'admin.admin_system.metrics': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/system/metrics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/system_controller').default['metrics']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/system_controller').default['metrics']>>>
    }
  }
  'admin.admin_backups.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/backups'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin/backup_validator').adminBackupsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/backups_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/backups_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_system.retry': {
    methods: ["POST"]
    pattern: '/api/v1/admin/system/jobs/:jobId/retry'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { jobId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/system_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/system_controller').default['retry']>>>
    }
  }
  'supervision.supervision.summary': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/supervision/summary'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/supervision_validator').supervisionSummaryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/supervision_controller').default['summary']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/supervision_controller').default['summary']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'supervision.supervision.items': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/supervision/items'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/supervision_validator').supervisionItemsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/supervision_controller').default['items']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/supervision_controller').default['items']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'supervision.supervision.mark_read': {
    methods: ["PATCH"]
    pattern: '/api/v1/supervision/notifications/:id/read'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/supervision_validator').supervisionNotificationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/supervision_validator').supervisionNotificationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/supervision_controller').default['markRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/supervision_controller').default['markRead']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'statistics.statistics.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/statistics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/statistics_validator').statisticsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/statistics_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/statistics_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'statistics.statistics.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/statistics/export.csv'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/statistics_validator').statisticsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/statistics_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/statistics_controller').default['export']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calendar.export.calendar_feeds.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calendar/export.ics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/calendar_feed_validator').calendarExportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['export']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calendar.export.calendar_feeds.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calendar/feeds'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['index']>>>
    }
  }
  'calendar.export.calendar_feeds.store': {
    methods: ["POST"]
    pattern: '/api/v1/calendar/feeds'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/calendar_feed_validator').createCalendarFeedValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/calendar_feed_validator').createCalendarFeedValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calendar.export.calendar_feeds.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/calendar/feeds/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/calendar_feed_validator').calendarFeedIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/calendar_feed_validator').calendarFeedIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_feeds_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ai-generations.ai_generations.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id/ai-generations'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/ai_generation_validator').aiGenerationParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ai-generations.ai_generations.store': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/ai-generations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_generation_validator').createAiGenerationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_generation_validator').createAiGenerationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ai-generations.ai_generations.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/ai-generations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/ai_generation_validator').aiGenerationParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ai-generations.ai_generations.apply': {
    methods: ["POST"]
    pattern: '/api/v1/ai-generations/:id/apply'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_generation_validator').applyAiVariantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_generation_validator').applyAiVariantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['apply']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['apply']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ai-generations.ai_generations.cancel': {
    methods: ["POST"]
    pattern: '/api/v1/ai-generations/:id/cancel'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_generation_validator').aiGenerationParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_generation_validator').aiGenerationParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai_generations_controller').default['cancel']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.read.network_variants.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id/network-variants'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/network_variant_validator').publicationNetworkVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.read.network_variants.effective': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id/network-variants/:network/effective'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; network: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/network_variant_validator').effectiveNetworkVariantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['effective']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['effective']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'translations.read': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id/translations'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/translation_validator').publicationTranslationsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'translations.manage.translations.generate': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/translations/generate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/translation_validator').createTranslationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/translation_validator').createTranslationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['generate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['generate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'translations.manage.translations.update': {
    methods: ["PUT"]
    pattern: '/api/v1/publications/:id/translations/:locale'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/translation_validator').updateTranslationValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; locale: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/translation_validator').updateTranslationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'translations.manage.translations.approve': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/translations/:locale/approve'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/translation_validator').approveTranslationValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; locale: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/translation_validator').approveTranslationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['approve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['approve']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.approve': {
    methods: ["POST"]
    pattern: '/api/v1/network-variants/:id/approve'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/network_variant_validator').publicationNetworkVariantParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/network_variant_validator').publicationNetworkVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['approve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['approve']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.manage.network_variants.store': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/network-variants'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/network_variant_validator').createNetworkVariantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/network_variant_validator').createNetworkVariantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.manage.network_variants.generate': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/network-variants/generate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/network_variant_validator').generateNetworkVariantsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/network_variant_validator').generateNetworkVariantsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['generate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['generate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.manage.network_variants.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/network-variants/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/network_variant_validator').updateNetworkVariantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/network_variant_validator').updateNetworkVariantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network-variants.manage.network_variants.stale': {
    methods: ["POST"]
    pattern: '/api/v1/network-variants/:id/stale'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/network_variant_validator').publicationNetworkVariantParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/network_variant_validator').publicationNetworkVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['stale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/network_variants_controller').default['stale']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projects.projects.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/projects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project_validator').listProjectsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projects.projects.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/projects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/project_validator').projectIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projects.manage.projects.store': {
    methods: ["POST"]
    pattern: '/api/v1/projects'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_validator').createProjectValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/project_validator').createProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projects.manage.projects.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/projects/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/project_validator').updateProjectValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/project_validator').updateProjectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projects.manage.projects.archive': {
    methods: ["DELETE"]
    pattern: '/api/v1/projects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['archive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['archive']>>>
    }
  }
  'projects.manage.projects.restore': {
    methods: ["POST"]
    pattern: '/api/v1/projects/:id/restore'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['restore']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projects_controller').default['restore']>>>
    }
  }
  'calendar.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/calendar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/calendar_validator').listCalendarValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/projects/:projectId/publications'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/publication_validator').listPublicationsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/publication_validator').showPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'discussion.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id/discussion'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/collaboration_validator').publicationDiscussionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discussion_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discussion_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:id/media'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.read_url': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/media/:id/read-url'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['readUrl']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['readUrl']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'annotations.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/publications/:publicationId/media/:mediaId/annotations'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { publicationId: ParamValue; mediaId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/annotation_validator').listAnnotationsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'comments.store': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/comments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').createCommentValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').createCommentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'comments.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/comments/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').updateCommentValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').updateCommentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'comments.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/comments/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').publicationDiscussionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').publicationDiscussionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'reviews.store': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/reviews'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').createReviewValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').createReviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'annotations.store': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:publicationId/media/:mediaId/annotations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/annotation_validator').createAnnotationValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { publicationId: ParamValue; mediaId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/annotation_validator').createAnnotationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'annotations.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/annotations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/annotation_validator').updateAnnotationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/annotation_validator').updateAnnotationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'annotations.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/annotations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/annotation_validator').annotationIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/annotation_validator').annotationIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annotations_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'notifications.notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/collaboration_validator').listNotificationsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'notifications.notifications.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/notifications/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collaboration_validator').updateNotificationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collaboration_validator').updateNotificationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.store': {
    methods: ["POST"]
    pattern: '/api/v1/projects/:projectId/publications'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/publication_validator').createPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/publication_validator').createPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/publications/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/publication_validator').updatePublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/publication_validator').updatePublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.duplicate': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/duplicate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/publication_validator').showPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/publication_validator').showPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['duplicate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['duplicate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.archive': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/publication_validator').showPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/publication_validator').showPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['archive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['archive']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'publications.transition': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/transition'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/publication_validator').transitionPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/publication_validator').transitionPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['transition']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/publications_controller').default['transition']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'calendar.move': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/calendar/move'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/calendar_validator').moveCalendarPublicationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/calendar_validator').moveCalendarPublicationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/calendar_controller').default['move']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/calendar_controller').default['move']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.initialize': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/media/uploads'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').initializeMediaUploadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').initializeMediaUploadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['initialize']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['initialize']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.finalize': {
    methods: ["POST"]
    pattern: '/api/v1/media/:id/finalize'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['finalize']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['finalize']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.attach': {
    methods: ["POST"]
    pattern: '/api/v1/publications/:id/media'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').attachMediaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').attachMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['attach']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['attach']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/media/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').updateMediaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').updateMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.reorder': {
    methods: ["PATCH"]
    pattern: '/api/v1/publications/:id/media/order'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').reorderMediaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').reorderMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['reorder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['reorder']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.detach': {
    methods: ["DELETE"]
    pattern: '/api/v1/publications/:id/media/:mediaId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').publicationMediaValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; mediaId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').publicationMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['detach']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['detach']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/media/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'media.purge': {
    methods: ["POST"]
    pattern: '/api/v1/media/:id/purge'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media_validator').mediaIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/media_controller').default['purge']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/media_controller').default['purge']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
