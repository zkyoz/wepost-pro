import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('social_accounts', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').notNullable().index()
      table.string('network', 30).notNullable().index()
      table.string('external_account_id', 160).notNullable()
      table.string('external_account_name', 255).notNullable()
      table.text('encrypted_access_token').nullable()
      table.text('encrypted_refresh_token').nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.jsonb('scopes').notNullable().defaultTo('[]')
      table.jsonb('metadata_json').notNullable().defaultTo('{}')
      table.string('status', 30).notNullable().defaultTo('connected').index()
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.unique(['agency_id', 'network', 'external_account_id'])
    })

    this.schema.createTable('scheduled_publications', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
        .index()
      table.string('network', 30).notNullable().index()
      table
        .uuid('account_id')
        .notNullable()
        .references('id')
        .inTable('social_accounts')
        .onDelete('RESTRICT')
        .index()
      table.integer('publication_version').notNullable()
      table.timestamp('run_at', { useTz: true }).notNullable().index()
      table.string('status', 30).notNullable().defaultTo('queued').index()
      table.string('idempotency_key', 64).notNullable().unique()
      table.string('payload_hash', 64).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['network', 'status', 'run_at'])
    })

    this.schema.createTable('publication_attempts', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('scheduled_id')
        .notNullable()
        .references('id')
        .inTable('scheduled_publications')
        .onDelete('CASCADE')
        .index()
      table.integer('attempt').notNullable()
      table.timestamp('started_at', { useTz: true }).notNullable()
      table.timestamp('finished_at', { useTz: true }).nullable()
      table.string('result', 40).notNullable().defaultTo('started').index()
      table.jsonb('normalized_error').nullable()
      table.string('remote_post_id', 255).nullable().index()
      table.unique(['scheduled_id', 'attempt'])
    })

    this.schema.raw(`
      ALTER TABLE social_accounts
      ADD CONSTRAINT social_accounts_network_check
      CHECK (network IN ('facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok'))
    `)
    this.schema.raw(`
      ALTER TABLE social_accounts
      ADD CONSTRAINT social_accounts_status_check
      CHECK (status IN ('connected', 'expired', 'revoked', 'error'))
    `)
    this.schema.raw(`
      ALTER TABLE scheduled_publications
      ADD CONSTRAINT scheduled_publications_network_check
      CHECK (network IN ('facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok'))
    `)
    this.schema.raw(`
      ALTER TABLE scheduled_publications
      ADD CONSTRAINT scheduled_publications_status_check
      CHECK (status IN ('queued', 'publishing', 'published', 'failed', 'cancelled'))
    `)
    this.schema.raw(`
      ALTER TABLE scheduled_publications
      ADD CONSTRAINT scheduled_publications_version_check CHECK (publication_version >= 1)
    `)
    this.schema.raw(`
      ALTER TABLE publication_attempts
      ADD CONSTRAINT publication_attempts_attempt_check CHECK (attempt >= 1)
    `)
    this.schema.raw(`
      ALTER TABLE publication_attempts
      ADD CONSTRAINT publication_attempts_result_check
      CHECK (result IN ('started', 'success', 'transient_failure', 'permanent_failure', 'skipped'))
    `)
  }

  async down() {
    this.schema.dropTable('publication_attempts')
    this.schema.dropTable('scheduled_publications')
    this.schema.dropTable('social_accounts')
  }
}
