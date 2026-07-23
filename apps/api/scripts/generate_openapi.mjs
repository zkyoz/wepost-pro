import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(apiRoot, '../..')
const specificationPath = resolve(apiRoot, 'resources/openapi.json')
const catalogPath = resolve(repositoryRoot, 'docs/api/endpoints.md')
const checkOnly = process.argv.includes('--check')

const HTTP_METHODS_WITH_CSRF = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const UUID_NAMES = new Set(['id', 'projectId', 'publicationId', 'mediaId', 'accountId'])
const SOCIAL_NETWORKS = ['facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok']
const PUBLICATION_STATUSES = [
  'draft',
  'in_progress',
  'awaiting_client_review',
  'changes_requested',
  'approved',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'archived',
]

const tags = [
  ['Santé', 'Disponibilité et préparation de l’API.'],
  ['Documentation', 'Documentation humaine et contrat OpenAPI.'],
  ['Authentification', 'Session web, inscription, connexion et protection CSRF.'],
  ['Utilisateurs', 'Profil utilisateur et préférences.'],
  ['Projets', 'Gestion des projets et de leurs membres.'],
  ['Publications', 'Contenu éditorial, versions et cycle de vie.'],
  ['Calendrier', 'Calendrier éditorial et flux ICS.'],
  ['Médias', 'Uploads privés, métadonnées et rattachement aux publications.'],
  ['Collaboration', 'Commentaires, revues client et annotations.'],
  ['Notifications', 'Notifications applicatives.'],
  ['Réseaux sociaux', 'OAuth, validation et programmation multi-réseaux.'],
  ['Administration', 'Ressources et opérations réservées aux administrateurs.'],
  ['Supervision', 'Synthèse métier et état technique.'],
  ['Statistiques', 'Agrégats métier et export CSV.'],
  ['IA', 'Génération assistée de contenu.'],
  ['Variantes réseau', 'Variantes de publication adaptées à chaque réseau.'],
  ['Traductions', 'Localisation utilisateur et traductions de publications.'],
]

const exactSummaries = {
  'GET /health/live': 'Vérifier que le processus API est vivant',
  'GET /health/ready': 'Vérifier que les dépendances nécessaires sont prêtes',
  'GET /api/docs': 'Consulter la documentation interactive',
  'GET /api/openapi.json': 'Télécharger la spécification OpenAPI',
  'GET /api/v1/auth/csrf': 'Initialiser la protection CSRF',
  'POST /api/v1/auth/register': 'Créer un compte et ouvrir une session',
  'POST /api/v1/auth/login': 'Ouvrir une session',
  'POST /api/v1/auth/logout': 'Fermer la session courante',
  'GET /api/v1/auth/me': 'Consulter le profil connecté',
  'GET /api/v1/projects': 'Lister les projets accessibles',
  'POST /api/v1/projects': 'Créer un projet',
  'GET /api/v1/calendar': 'Consulter le calendrier éditorial',
  'GET /api/v1/statistics': 'Consulter les statistiques métier',
  'GET /api/v1/statistics/export.csv': 'Exporter les statistiques en CSV',
  'GET /api/v1/calendar/export.ics': 'Exporter le calendrier au format ICS',
}

function listRoutes() {
  const output = execFileSync(process.execPath, ['ace', 'list:routes', '--json'], {
    cwd: apiRoot,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  })
  return JSON.parse(output).flatMap((domain) => domain.routes)
}

function openApiPath(pattern) {
  return pattern.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}')
}

function routePermission(route) {
  return (
    route.middleware?.find((entry) => entry.name === 'permission')?.args?.permissions?.[0] ?? null
  )
}

function requiresSession(route) {
  return route.middleware?.some((entry) => entry.name === 'auth') ?? false
}

function tagFor(path) {
  if (path.startsWith('/health/')) return 'Santé'
  if (path === '/api/docs' || path === '/api/openapi.json') return 'Documentation'
  if (path.includes('/auth/')) return 'Authentification'
  if (path.includes('/admin/')) return 'Administration'
  if (path.includes('/social/')) return 'Réseaux sociaux'
  if (path.includes('/supervision/')) return 'Supervision'
  if (path.includes('/statistics')) return 'Statistiques'
  if (path.includes('/ai-generations')) return 'IA'
  if (path.includes('/network-variants')) return 'Variantes réseau'
  if (path.includes('/translations') || path.includes('/locale')) return 'Traductions'
  if (path.includes('/notifications')) return 'Notifications'
  if (path.includes('/comments') || path.includes('/reviews') || path.includes('/annotations')) {
    return 'Collaboration'
  }
  if (path.includes('/media')) return 'Médias'
  if (path.includes('/calendar')) return 'Calendrier'
  if (path.includes('/publications')) return 'Publications'
  if (path.includes('/projects')) return 'Projets'
  if (path.includes('/users')) return 'Utilisateurs'
  return 'Documentation'
}

function socialSummary(method, path) {
  const network = SOCIAL_NETWORKS.find((candidate) => path.includes(`/social/${candidate}/`))
  if (!network) return null
  const label =
    network === 'linkedin' ? 'LinkedIn' : `${network[0].toUpperCase()}${network.slice(1)}`
  if (path.endsWith('/oauth/start')) return `Démarrer la connexion OAuth ${label}`
  if (path.endsWith('/oauth/callback')) return `Traiter le callback OAuth ${label}`
  if (path.endsWith('/accounts') && method === 'GET') return `Lister les comptes ${label}`
  if (path.includes('/accounts/') && path.endsWith('/refresh')) {
    return `Rafraîchir les autorisations ${label}`
  }
  if (path.includes('/accounts/') && method === 'DELETE') return `Révoquer un compte ${label}`
  if (path.endsWith('/validate')) return `Valider une publication pour ${label}`
  if (path.endsWith('/schedule')) return `Programmer une publication sur ${label}`
  if (path.endsWith('/retry')) return `Relancer une publication ${label}`
  if (path.includes('/publications/') && path.endsWith('/status')) {
    return `Consulter le statut ${label} d’une publication`
  }
  return `Consulter une programmation ${label}`
}

function summaryFor(method, path, routeName) {
  const exact = exactSummaries[`${method} ${path}`]
  if (exact) return exact
  const social = socialSummary(method, path)
  if (social) return social

  const action = path.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ?? 'ressource'
  const verbs = {
    GET: 'Consulter',
    POST: 'Créer ou déclencher',
    PUT: 'Remplacer',
    PATCH: 'Mettre à jour',
    DELETE: 'Supprimer ou révoquer',
  }
  return `${verbs[method] ?? method} ${action} (${routeName})`
}

function pathParameters(path) {
  return [...path.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => {
    const name = match[1]
    const schema = UUID_NAMES.has(name)
      ? { type: 'string', format: 'uuid' }
      : { type: 'string', minLength: 1 }
    return {
      name,
      in: 'path',
      required: true,
      description:
        name === 'token'
          ? 'Jeton opaque du flux. Ne doit pas être journalisé.'
          : `Identifiant de chemin « ${name} ».`,
      schema,
    }
  })
}

function queryParameter(name, schema, description) {
  return { name, in: 'query', required: false, schema, description }
}

function queryParameters(method, path) {
  if (method !== 'GET') return []
  const result = []
  const paginated =
    path === '/api/v1/projects' ||
    /^\/api\/v1\/admin\/(users|projects|publications|social-accounts|incidents|audit-logs|backups)$/.test(
      path
    ) ||
    path === '/api/v1/notifications' ||
    path === '/api/v1/supervision/items' ||
    /^\/api\/v1\/projects\/\{projectId\}\/publications$/.test(path) ||
    /^\/api\/v1\/publications\/\{id\}\/ai-generations$/.test(path)
  if (paginated) {
    result.push(
      queryParameter('page', { type: 'integer', minimum: 1, default: 1 }, 'Page demandée.'),
      queryParameter(
        'perPage',
        { type: 'integer', minimum: 1, maximum: 100 },
        'Nombre maximal de résultats.'
      )
    )
  }
  if (path === '/api/v1/projects' || path.includes('/admin/')) {
    result.push(queryParameter('q', { type: 'string', maxLength: 120 }, 'Recherche textuelle.'))
  }
  if (path === '/api/v1/projects') {
    result.push(
      queryParameter('status', { type: 'string', enum: ['active', 'archived'] }, 'État du projet.')
    )
  }
  if (path === '/api/v1/calendar') {
    result.push(
      queryParameter('start', { type: 'string', format: 'date-time' }, 'Début de la plage.'),
      queryParameter('end', { type: 'string', format: 'date-time' }, 'Fin de la plage.'),
      queryParameter('timezone', { type: 'string' }, 'Fuseau IANA utilisé pour l’affichage.'),
      queryParameter('projectId', { type: 'string', format: 'uuid' }, 'Projet filtré.'),
      queryParameter('clientId', { type: 'string', format: 'uuid' }, 'Client filtré.'),
      queryParameter('network', { $ref: '#/components/schemas/SocialNetwork' }, 'Réseau filtré.'),
      queryParameter(
        'status',
        { $ref: '#/components/schemas/PublicationStatus' },
        'Statut filtré.'
      ),
      queryParameter('includeUndated', { type: 'boolean' }, 'Inclure les publications sans date.')
    )
  }
  if (path.startsWith('/api/v1/statistics')) {
    result.push(
      queryParameter('from', { type: 'string', format: 'date' }, 'Début de la période.'),
      queryParameter('to', { type: 'string', format: 'date' }, 'Fin de la période.'),
      queryParameter('projectId', { type: 'string', format: 'uuid' }, 'Projet filtré.'),
      queryParameter('network', { $ref: '#/components/schemas/SocialNetwork' }, 'Réseau filtré.')
    )
  }
  if (path === '/api/v1/calendar/export.ics') {
    result.push(
      queryParameter('start', { type: 'string', format: 'date-time' }, 'Début de la plage.'),
      queryParameter('end', { type: 'string', format: 'date-time' }, 'Fin de la plage.'),
      queryParameter('timezone', { type: 'string' }, 'Fuseau IANA.'),
      queryParameter('projectId', { type: 'string', format: 'uuid' }, 'Projet filtré.')
    )
  }
  if (path.endsWith('/oauth/callback')) {
    result.push(
      queryParameter('code', { type: 'string', maxLength: 2048 }, 'Code OAuth à usage court.'),
      queryParameter('state', { type: 'string', minLength: 20 }, 'État OAuth anti-CSRF.')
    )
  }
  return result
}

function requestSchema(method, path) {
  const bodyless = new Set([
    'POST /api/v1/auth/logout',
    'POST /api/v1/projects/{id}/restore',
    'POST /api/v1/publications/{id}/duplicate',
    'POST /api/v1/publications/{id}/archive',
    'POST /api/v1/media/{id}/finalize',
    'POST /api/v1/media/{id}/purge',
    'POST /api/v1/ai-generations/{id}/cancel',
    'POST /api/v1/network-variants/{id}/approve',
    'POST /api/v1/network-variants/{id}/stale',
    'PATCH /api/v1/supervision/notifications/{id}/read',
  ])
  if (method === 'DELETE' || bodyless.has(`${method} ${path}`) || path.endsWith('/retry')) {
    return null
  }
  if (/^\/api\/v1\/admin\/(projects|publications)\/\{id\}\/(archive|restore)$/.test(path)) {
    return null
  }
  if (/^\/api\/v1\/admin\/system\/jobs\/\{jobId\}\/retry$/.test(path)) return null
  if (/^\/api\/v1\/social\/[^/]+\/accounts\/\{id\}\/refresh$/.test(path)) return null

  const exact = {
    'POST /api/v1/auth/register': 'RegisterInput',
    'POST /api/v1/auth/login': 'LoginInput',
    'PATCH /api/v1/users/me/locale': 'LocaleInput',
    'POST /api/v1/projects': 'ProjectInput',
    'PATCH /api/v1/projects/{id}': 'ProjectUpdateInput',
    'POST /api/v1/projects/{projectId}/publications': 'PublicationInput',
    'PATCH /api/v1/publications/{id}': 'PublicationUpdateInput',
    'POST /api/v1/publications/{id}/transition': 'PublicationTransitionInput',
    'POST /api/v1/publications/{id}/calendar/move': 'CalendarMoveInput',
    'POST /api/v1/publications/{id}/comments': 'CommentInput',
    'PATCH /api/v1/comments/{id}': 'CommentInput',
    'POST /api/v1/publications/{id}/reviews': 'ReviewInput',
    'POST /api/v1/publications/{publicationId}/media/{mediaId}/annotations': 'AnnotationInput',
    'PATCH /api/v1/annotations/{id}': 'AnnotationInput',
    'POST /api/v1/publications/{id}/media/uploads': 'MediaUploadInput',
    'POST /api/v1/publications/{id}/media': 'MediaAttachInput',
    'PATCH /api/v1/media/{id}': 'MediaUpdateInput',
    'PATCH /api/v1/publications/{id}/media/order': 'MediaOrderInput',
    'PATCH /api/v1/notifications/{id}': 'NotificationInput',
    'POST /api/v1/publications/{id}/ai-generations': 'AiGenerationInput',
    'POST /api/v1/ai-generations/{id}/apply': 'AiApplyInput',
    'POST /api/v1/calendar/feeds': 'CalendarFeedInput',
    'PATCH /api/v1/admin/users/{id}/role': 'AdminRoleInput',
    'PATCH /api/v1/admin/users/{id}/status': 'AdminStatusInput',
    'POST /api/v1/publications/{id}/network-variants': 'NetworkVariantInput',
    'POST /api/v1/publications/{id}/network-variants/generate': 'NetworkVariantGenerationInput',
    'PATCH /api/v1/network-variants/{id}': 'NetworkVariantUpdateInput',
    'POST /api/v1/publications/{id}/translations/generate': 'TranslationGenerationInput',
    'PUT /api/v1/publications/{id}/translations/{locale}': 'TranslationInput',
    'POST /api/v1/publications/{id}/translations/{locale}/approve': 'TranslationApprovalInput',
  }
  const match = exact[`${method} ${path}`]
  if (match) return match
  if (path.includes('/social/facebook/') && path.endsWith('/oauth/start')) {
    return 'FacebookOAuthStartInput'
  }
  if (path.includes('/social/instagram/') && path.endsWith('/oauth/start')) {
    return 'InstagramOAuthStartInput'
  }
  if (path.includes('/social/linkedin/') && path.endsWith('/oauth/start')) {
    return 'LinkedInOAuthStartInput'
  }
  if (path.endsWith('/oauth/start')) return 'AgencyOAuthStartInput'
  if (path.includes('/social/pinterest/') && path.endsWith('/validate')) {
    return 'PinterestPublicationInput'
  }
  if (path.includes('/social/pinterest/') && path.endsWith('/schedule')) {
    return 'PinterestScheduleInput'
  }
  if (path.includes('/social/tiktok/') && path.endsWith('/validate')) {
    return 'TikTokPublicationInput'
  }
  if (path.includes('/social/tiktok/') && path.endsWith('/schedule')) {
    return 'TikTokScheduleInput'
  }
  if (path.endsWith('/validate')) return 'SocialPublicationInput'
  if (path.endsWith('/schedule')) return 'SocialScheduleInput'
  return 'GenericInput'
}

function responseContent(path) {
  if (path.endsWith('.csv')) return { 'text/csv': { schema: { type: 'string' } } }
  if (path.endsWith('.ics') || path.includes('/calendar/feeds/{token}')) {
    return { 'text/calendar': { schema: { type: 'string' } } }
  }
  if (path === '/api/docs') return { 'text/html': { schema: { type: 'string' } } }
  if (path === '/api/openapi.json') {
    return { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
  }
  if (path === '/health/live' || path === '/health/ready') {
    return { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } }
  }
  return { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } }
}

function operationFor(route, method) {
  const path = openApiPath(route.pattern)
  const permission = routePermission(route)
  const session = requiresSession(route)
  const parameters = [...pathParameters(path), ...queryParameters(method, path)]
  const csrfRequired = HTTP_METHODS_WITH_CSRF.has(method) && path !== '/api/v1/media/local-upload'

  if (csrfRequired) {
    parameters.push({
      name: 'X-XSRF-TOKEN',
      in: 'header',
      required: true,
      description: 'Valeur décodée du cookie XSRF-TOKEN obtenu avec GET /api/v1/auth/csrf.',
      schema: { type: 'string', minLength: 1 },
    })
  }

  const operation = {
    'tags': [tagFor(path)],
    'summary': summaryFor(method, path, route.name),
    'description': [
      `Route Adonis : \`${route.name}\`.`,
      permission ? `Permission serveur requise : \`${permission}\`.` : null,
      session ? 'Une session web active est obligatoire.' : null,
      csrfRequired ? 'La requête est protégée contre les attaques CSRF.' : null,
    ]
      .filter(Boolean)
      .join(' '),
    'operationId': route.name.replaceAll(/[^A-Za-z0-9_]/g, '_'),
    parameters,
    'security': session ? [{ sessionCookie: [] }] : [],
    'responses': {
      '2XX': {
        description: 'Opération réussie.',
        content: responseContent(path),
      },
      ...(session ? { 401: { $ref: '#/components/responses/Unauthorized' } } : {}),
      ...(permission ? { 403: { $ref: '#/components/responses/Forbidden' } } : {}),
      '422': { $ref: '#/components/responses/ValidationError' },
      '429': { $ref: '#/components/responses/RateLimited' },
      '500': { $ref: '#/components/responses/ServerError' },
    },
    'x-adonis-route-name': route.name,
    'x-controller-action': `${route.handler.moduleNameOrPath}.${route.handler.method}`,
    ...(permission ? { 'x-required-permission': permission } : {}),
    ...(path.includes('/media/local-') ? { 'x-internal': true } : {}),
  }

  const schemaName = requestSchema(method, path)
  if (HTTP_METHODS_WITH_CSRF.has(method) && path !== '/api/v1/media/local-upload' && schemaName) {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    }
  }

  if (path === '/api/v1/media/local-upload') {
    operation.requestBody = {
      required: true,
      description: 'Corps binaire envoyé vers l’URL locale signée.',
      content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
    }
  }

  return operation
}

function buildSchemas() {
  const uuid = { type: 'string', format: 'uuid' }
  const nullableDateTime = { type: ['string', 'null'], format: 'date-time' }
  const stringArray = { type: 'array', items: { type: 'string' }, uniqueItems: true }
  return {
    SocialNetwork: { type: 'string', enum: SOCIAL_NETWORKS },
    PublicationStatus: { type: 'string', enum: PUBLICATION_STATUSES },
    ErrorItem: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string' },
        field: { type: 'string' },
        rule: { type: 'string' },
      },
      additionalProperties: false,
    },
    ErrorResponse: {
      type: 'object',
      required: ['errors'],
      properties: {
        errors: { type: 'array', items: { $ref: '#/components/schemas/ErrorItem' } },
      },
      additionalProperties: false,
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        currentPage: { type: 'integer', minimum: 1 },
        perPage: { type: 'integer', minimum: 1 },
        total: { type: 'integer', minimum: 0 },
        lastPage: { type: 'integer', minimum: 1 },
      },
    },
    User: {
      type: 'object',
      required: ['id', 'displayName', 'email', 'role', 'isActive', 'locale'],
      properties: {
        id: uuid,
        agencyId: { oneOf: [uuid, { type: 'null' }] },
        displayName: { type: 'string', maxLength: 120 },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['admin', 'agency', 'client'] },
        isActive: { type: 'boolean' },
        locale: { type: 'string', enum: ['fr', 'en'] },
      },
      description: 'Profil public. Le mot de passe et les secrets ne sont jamais sérialisés.',
    },
    Project: {
      type: 'object',
      required: ['id', 'name', 'status', 'timezone'],
      properties: {
        id: uuid,
        agencyId: uuid,
        name: { type: 'string', maxLength: 120 },
        description: { type: 'string', maxLength: 5000 },
        status: { type: 'string', enum: ['active', 'archived'] },
        clientUserId: uuid,
        timezone: { type: 'string', example: 'Europe/Paris' },
        archivedAt: nullableDateTime,
      },
    },
    Publication: {
      type: 'object',
      required: ['id', 'projectId', 'title', 'baseText', 'status', 'contentVersion'],
      properties: {
        id: uuid,
        projectId: uuid,
        title: { type: 'string', maxLength: 120 },
        baseText: { type: 'string', maxLength: 10000 },
        status: { $ref: '#/components/schemas/PublicationStatus' },
        targetNetworks: {
          type: 'array',
          items: { $ref: '#/components/schemas/SocialNetwork' },
          uniqueItems: true,
        },
        scheduledAt: nullableDateTime,
        timezone: { type: 'string' },
        contentVersion: { type: 'integer', minimum: 1 },
        approvedVersion: { type: ['integer', 'null'], minimum: 1 },
      },
    },
    ApiResponse: {
      type: 'object',
      properties: {
        data: {
          oneOf: [
            { $ref: '#/components/schemas/User' },
            { $ref: '#/components/schemas/Project' },
            { $ref: '#/components/schemas/Publication' },
            { type: 'array', items: { type: 'object', additionalProperties: true } },
            { type: 'object', additionalProperties: true },
          ],
        },
        meta: { $ref: '#/components/schemas/PaginationMeta' },
        message: { type: 'string' },
      },
      additionalProperties: true,
    },
    Health: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['ok', 'ready', 'degraded', 'unavailable'] },
        ready: { type: 'boolean' },
        checks: { type: 'object', additionalProperties: true },
      },
      additionalProperties: true,
    },
    GenericInput: {
      type: 'object',
      description:
        'Corps JSON validé par VineJS. Consulter le contrôleur et le validateur indiqués par les extensions x-adonis.',
      additionalProperties: true,
    },
    RegisterInput: {
      type: 'object',
      required: ['displayName', 'email', 'password', 'passwordConfirmation'],
      properties: {
        displayName: { type: 'string', minLength: 2, maxLength: 120 },
        email: { type: 'string', format: 'email', maxLength: 254 },
        password: { type: 'string', format: 'password', minLength: 12, maxLength: 128 },
        passwordConfirmation: {
          type: 'string',
          format: 'password',
          minLength: 12,
          maxLength: 128,
        },
      },
      additionalProperties: false,
    },
    LoginInput: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', maxLength: 254 },
        password: { type: 'string', format: 'password', maxLength: 128 },
      },
      additionalProperties: false,
    },
    LocaleInput: {
      type: 'object',
      required: ['locale'],
      properties: { locale: { type: 'string', enum: ['fr', 'en'] } },
      additionalProperties: false,
    },
    ProjectInput: {
      type: 'object',
      required: ['name', 'clientUserId', 'timezone'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', maxLength: 5000 },
        clientUserId: uuid,
        memberUserIds: { type: 'array', items: uuid, uniqueItems: true },
        timezone: { type: 'string', maxLength: 80, example: 'Europe/Paris' },
      },
      additionalProperties: false,
    },
    ProjectUpdateInput: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 120 },
        description: { type: 'string', maxLength: 5000 },
        clientUserId: uuid,
        memberUserIds: { type: 'array', items: uuid, uniqueItems: true },
        timezone: { type: 'string', maxLength: 80, example: 'Europe/Paris' },
      },
      additionalProperties: false,
    },
    PublicationInput: {
      type: 'object',
      required: ['title', 'baseText', 'targetNetworks', 'timezone'],
      properties: {
        title: { type: 'string', minLength: 2, maxLength: 120 },
        baseText: { type: 'string', maxLength: 10000 },
        targetNetworks: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: { $ref: '#/components/schemas/SocialNetwork' },
        },
        scheduledAt: nullableDateTime,
        timezone: { type: 'string', maxLength: 80 },
      },
      additionalProperties: false,
    },
    PublicationUpdateInput: {
      type: 'object',
      required: ['contentVersion'],
      properties: {
        contentVersion: { type: 'integer', minimum: 1 },
        title: { type: 'string', minLength: 2, maxLength: 120 },
        baseText: { type: 'string', maxLength: 10000 },
        targetNetworks: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: { $ref: '#/components/schemas/SocialNetwork' },
        },
        scheduledAt: nullableDateTime,
        timezone: { type: 'string', maxLength: 80 },
      },
      additionalProperties: false,
    },
    PublicationTransitionInput: {
      type: 'object',
      required: ['contentVersion', 'status'],
      properties: {
        contentVersion: { type: 'integer', minimum: 1 },
        status: { $ref: '#/components/schemas/PublicationStatus' },
      },
      additionalProperties: false,
    },
    CalendarMoveInput: {
      type: 'object',
      required: ['contentVersion', 'scheduledAt', 'timezone'],
      properties: {
        contentVersion: { type: 'integer', minimum: 1 },
        scheduledAt: nullableDateTime,
        timezone: { type: 'string', maxLength: 80 },
      },
      additionalProperties: false,
    },
    CommentInput: {
      type: 'object',
      required: ['body'],
      properties: { body: { type: 'string', minLength: 1, maxLength: 5000 } },
      additionalProperties: false,
    },
    ReviewInput: {
      type: 'object',
      required: ['contentVersion', 'decision'],
      properties: {
        contentVersion: { type: 'integer', minimum: 1 },
        decision: { type: 'string', enum: ['approved', 'changes_requested'] },
        message: { type: ['string', 'null'], maxLength: 5000 },
      },
      additionalProperties: false,
    },
    AnnotationInput: {
      type: 'object',
      required: ['shape', 'x', 'y', 'body'],
      properties: {
        shape: { type: 'string', enum: ['point', 'rectangle'] },
        x: { type: 'number', minimum: 0, maximum: 1 },
        y: { type: 'number', minimum: 0, maximum: 1 },
        width: { type: ['number', 'null'], minimum: 0, maximum: 1 },
        height: { type: ['number', 'null'], minimum: 0, maximum: 1 },
        body: { type: 'string', minLength: 1, maxLength: 2000 },
        commentId: { oneOf: [uuid, { type: 'null' }] },
      },
      additionalProperties: false,
    },
    MediaUploadInput: {
      type: 'object',
      required: ['originalName', 'declaredMimeType', 'sizeBytes', 'checksum'],
      properties: {
        originalName: { type: 'string', maxLength: 255 },
        declaredMimeType: { type: 'string', maxLength: 120 },
        sizeBytes: { type: 'integer', minimum: 1 },
        checksum: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
        altText: { type: ['string', 'null'], maxLength: 2000 },
        isDecorative: { type: 'boolean', default: false },
      },
      additionalProperties: false,
    },
    MediaAttachInput: {
      type: 'object',
      required: ['mediaId'],
      properties: { mediaId: uuid },
      additionalProperties: false,
    },
    MediaUpdateInput: {
      type: 'object',
      required: ['isDecorative'],
      properties: {
        altText: { type: ['string', 'null'], maxLength: 2000 },
        isDecorative: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    MediaOrderInput: {
      type: 'object',
      required: ['mediaIds'],
      properties: { mediaIds: { type: 'array', items: uuid, uniqueItems: true } },
      additionalProperties: false,
    },
    NotificationInput: {
      type: 'object',
      required: ['read'],
      properties: { read: { type: 'boolean' } },
      additionalProperties: false,
    },
    AiGenerationInput: {
      type: 'object',
      required: ['brief', 'tone', 'length', 'language', 'variantCount'],
      properties: {
        brief: { type: 'string', minLength: 10, maxLength: 2000 },
        tone: {
          type: 'string',
          enum: ['professional', 'friendly', 'engaging', 'informative'],
        },
        length: { type: 'string', enum: ['short', 'medium', 'long'] },
        language: { type: 'string', enum: ['fr', 'en'] },
        variantCount: { type: 'integer', minimum: 2, maximum: 5 },
      },
      additionalProperties: false,
    },
    AiApplyInput: {
      type: 'object',
      required: ['variantId', 'contentVersion'],
      properties: {
        variantId: { type: 'string', pattern: '^variant-[1-5]$' },
        contentVersion: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
    CalendarFeedInput: {
      type: 'object',
      properties: { projectId: { oneOf: [uuid, { type: 'null' }] } },
      additionalProperties: false,
    },
    AdminRoleInput: {
      type: 'object',
      required: ['role'],
      properties: { role: { type: 'string', enum: ['admin', 'agency', 'client'] } },
      additionalProperties: false,
    },
    AdminStatusInput: {
      type: 'object',
      required: ['isActive'],
      properties: { isActive: { type: 'boolean' } },
      additionalProperties: false,
    },
    AgencyOAuthStartInput: {
      type: 'object',
      properties: { agencyId: uuid },
      additionalProperties: false,
    },
    FacebookOAuthStartInput: {
      type: 'object',
      required: ['pageId'],
      properties: { pageId: { type: 'string', pattern: '^\\d{5,30}$' }, agencyId: uuid },
      additionalProperties: false,
    },
    InstagramOAuthStartInput: {
      type: 'object',
      required: ['instagramAccountId'],
      properties: {
        instagramAccountId: { type: 'string', pattern: '^\\d{5,30}$' },
        agencyId: uuid,
      },
      additionalProperties: false,
    },
    LinkedInOAuthStartInput: {
      type: 'object',
      required: ['organizationId'],
      properties: {
        organizationId: { type: 'string', pattern: '^\\d{5,30}$' },
        agencyId: uuid,
      },
      additionalProperties: false,
    },
    SocialPublicationInput: {
      type: 'object',
      required: ['accountId'],
      properties: { accountId: uuid },
      additionalProperties: false,
    },
    SocialScheduleInput: {
      type: 'object',
      required: ['accountId'],
      properties: {
        accountId: uuid,
        runAt: { type: ['string', 'null'], format: 'date-time' },
      },
      additionalProperties: false,
    },
    PinterestPublicationInput: {
      type: 'object',
      required: ['accountId', 'boardId', 'title', 'description'],
      properties: {
        accountId: uuid,
        boardId: { type: 'string', pattern: '^\\d{5,30}$' },
        title: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', minLength: 1, maxLength: 800 },
        link: { type: ['string', 'null'], maxLength: 2048 },
      },
      additionalProperties: false,
    },
    PinterestScheduleInput: {
      allOf: [
        { $ref: '#/components/schemas/PinterestPublicationInput' },
        {
          type: 'object',
          properties: { runAt: { type: ['string', 'null'], format: 'date-time' } },
        },
      ],
    },
    TikTokPublicationInput: {
      type: 'object',
      required: [
        'accountId',
        'privacyLevel',
        'caption',
        'disableComment',
        'disableDuet',
        'disableStitch',
        'brandContentToggle',
        'brandOrganicToggle',
        'isAigc',
      ],
      properties: {
        accountId: uuid,
        privacyLevel: { type: 'string' },
        caption: { type: 'string', maxLength: 2200 },
        disableComment: { type: 'boolean' },
        disableDuet: { type: 'boolean' },
        disableStitch: { type: 'boolean' },
        brandContentToggle: { type: 'boolean' },
        brandOrganicToggle: { type: 'boolean' },
        isAigc: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    TikTokScheduleInput: {
      allOf: [
        { $ref: '#/components/schemas/TikTokPublicationInput' },
        {
          type: 'object',
          properties: { runAt: { type: ['string', 'null'], format: 'date-time' } },
        },
      ],
    },
    NetworkVariantInput: {
      type: 'object',
      required: ['network', 'text'],
      properties: {
        network: { $ref: '#/components/schemas/SocialNetwork' },
        text: { type: 'string', minLength: 1, maxLength: 20000 },
      },
      additionalProperties: false,
    },
    NetworkVariantGenerationInput: {
      type: 'object',
      required: ['networks', 'tone', 'length', 'language'],
      properties: {
        networks: {
          type: 'array',
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
          items: { $ref: '#/components/schemas/SocialNetwork' },
        },
        tone: { type: 'string' },
        length: { type: 'string' },
        language: { type: 'string', enum: ['fr', 'en'] },
      },
      additionalProperties: false,
    },
    NetworkVariantUpdateInput: {
      type: 'object',
      required: ['text'],
      properties: { text: { type: 'string', minLength: 1, maxLength: 20000 } },
      additionalProperties: false,
    },
    TranslationGenerationInput: {
      type: 'object',
      required: ['sourceLocale', 'targetLocale', 'sourceVersion'],
      properties: {
        sourceLocale: { type: 'string', enum: ['fr', 'en'] },
        targetLocale: { type: 'string', enum: ['fr', 'en'] },
        sourceVersion: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
    TranslationInput: {
      type: 'object',
      required: ['sourceLocale', 'sourceVersion', 'text'],
      properties: {
        sourceLocale: { type: 'string', enum: ['fr', 'en'] },
        sourceVersion: { type: 'integer', minimum: 1 },
        text: { type: 'string', minLength: 1, maxLength: 10000 },
      },
      additionalProperties: false,
    },
    TranslationApprovalInput: {
      type: 'object',
      required: ['sourceVersion'],
      properties: { sourceVersion: { type: 'integer', minimum: 1 } },
      additionalProperties: false,
    },
  }
}

function buildSpecification(routes) {
  const paths = {}
  const operationIds = new Set()
  for (const route of routes) {
    const method = route.methods[0]
    const path = openApiPath(route.pattern)
    const operation = operationFor(route, method)
    if (operationIds.has(operation.operationId)) {
      throw new Error(`Identifiant OpenAPI dupliqué : ${operation.operationId}`)
    }
    operationIds.add(operation.operationId)
    paths[path] ??= {}
    paths[path][method.toLowerCase()] = operation
  }

  return {
    'openapi': '3.1.0',
    'info': {
      title: 'Wepost.pro REST API',
      version: '1.0.0',
      summary: 'Contrat HTTP de la plateforme éditoriale Wepost.pro.',
      description:
        'API REST AdonisJS utilisée par Nuxt. L’authentification repose sur une session HttpOnly et toutes les requêtes mutatives, hors upload local signé, utilisent le cookie XSRF-TOKEN.',
      contact: { name: 'Équipe Wepost.pro' },
    },
    'jsonSchemaDialect': 'https://json-schema.org/draft/2020-12/schema',
    'servers': [
      { url: 'http://localhost:3333', description: 'Développement local' },
      { url: '/', description: 'Serveur courant' },
    ],
    'tags': tags.map(([name, description]) => ({ name, description })),
    paths,
    'components': {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'wepost_session',
          description:
            'Cookie de session HttpOnly. Son nom exact dépend de SESSION_COOKIE_NAME dans chaque environnement.',
        },
      },
      schemas: buildSchemas(),
      responses: {
        Unauthorized: {
          description: 'Session absente, expirée ou compte désactivé.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        Forbidden: {
          description: 'Permission insuffisante pour le périmètre demandé.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ValidationError: {
          description: 'Entrée invalide ou règle métier non satisfaite.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        RateLimited: {
          description: 'Limite de requêtes atteinte.',
          headers: {
            'Retry-After': {
              description: 'Délai conseillé avant une nouvelle tentative.',
              schema: { type: 'integer', minimum: 0 },
            },
          },
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ServerError: {
          description: 'Erreur interne sans exposition de secret.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
    },
    'x-generated-from': 'apps/api/start/routes.ts',
    'x-route-count': routes.length,
  }
}

function validateSpecification(specification) {
  const operationIds = new Set()
  let operationCount = 0
  for (const [path, pathItem] of Object.entries(specification.paths)) {
    const expectedParameters = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])
    for (const operation of Object.values(pathItem)) {
      operationCount += 1
      if (operationIds.has(operation.operationId)) {
        throw new Error(`operationId dupliqué : ${operation.operationId}`)
      }
      operationIds.add(operation.operationId)
      const declaredParameters = new Set(
        operation.parameters
          .filter((parameter) => parameter.in === 'path')
          .map((parameter) => parameter.name)
      )
      for (const parameter of expectedParameters) {
        if (!declaredParameters.has(parameter)) {
          throw new Error(`Paramètre « ${parameter} » absent de ${operation.operationId}`)
        }
      }
    }
  }
  if (operationCount !== specification['x-route-count']) {
    throw new Error(
      `Nombre d’opérations incohérent : ${operationCount} au lieu de ${specification['x-route-count']}`
    )
  }

  const source = JSON.stringify(specification)
  for (const match of source.matchAll(/"#\/components\/(schemas|responses)\/([^"]+)"/g)) {
    const [, collection, name] = match
    if (specification.components[collection][name] === undefined) {
      throw new Error(`Référence OpenAPI introuvable : #/components/${collection}/${name}`)
    }
  }
}

function buildCatalog(routes) {
  const rows = routes
    .map((route) => {
      const method = route.methods[0]
      const permission = routePermission(route)
      return {
        tag: tagFor(route.pattern),
        method,
        path: route.pattern,
        name: route.name,
        session: requiresSession(route) ? 'Oui' : 'Non',
        permission: permission ? `\`${permission}\`` : '—',
      }
    })
    .sort((left, right) => left.tag.localeCompare(right.tag) || left.path.localeCompare(right.path))

  const lines = [
    '# Catalogue des endpoints Wepost.pro',
    '',
    '> Fichier généré par `pnpm api:docs:generate`. Ne pas le modifier manuellement.',
    '',
    `Nombre de routes documentées : **${rows.length}**.`,
    '',
    'La documentation interactive est disponible sur `/api/docs` et le contrat OpenAPI sur',
    '`/api/openapi.json` lorsque l’API est démarrée.',
    '',
  ]
  let currentTag
  for (const row of rows) {
    if (row.tag !== currentTag) {
      if (currentTag !== undefined) lines.push('')
      currentTag = row.tag
      lines.push(
        `## ${currentTag}`,
        '',
        '| Méthode | Chemin | Session | Permission | Route Adonis |',
        '|---|---|---:|---|---|'
      )
    }
    lines.push(
      `| ${row.method} | \`${row.path}\` | ${row.session} | ${row.permission} | \`${row.name}\` |`
    )
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

function assertOrWrite(path, content) {
  if (!checkOnly) {
    writeFileSync(path, content)
    return
  }
  let current
  try {
    current = readFileSync(path, 'utf8')
  } catch {
    throw new Error(`Documentation absente : ${path}`)
  }
  if (current !== content) {
    throw new Error(
      `Documentation API obsolète : ${path}. Exécuter « pnpm api:docs:generate » puis valider les changements.`
    )
  }
}

const routes = listRoutes()
const openApiDocument = buildSpecification(routes)
validateSpecification(openApiDocument)
const specification = `${JSON.stringify(openApiDocument, null, 2)}\n`
const catalog = buildCatalog(routes)
assertOrWrite(specificationPath, specification)
assertOrWrite(catalogPath, catalog)

console.log(
  checkOnly
    ? `Documentation API synchronisée (${routes.length} routes).`
    : `Documentation API générée (${routes.length} routes).`
)
