import { BaseSchema } from '@adonisjs/lucid/schema'

const statuses = [
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

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('publications', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').notNullable().index()
      table
        .uuid('project_id')
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')
        .index()
      table.string('title', 120).notNullable()
      table.text('base_text').notNullable().defaultTo('')
      table.string('status', 40).notNullable().defaultTo('draft').index()
      table.specificType('target_networks', 'text[]').notNullable().defaultTo('{}')
      table.timestamp('scheduled_at', { useTz: true }).nullable()
      table.string('timezone', 80).notNullable().defaultTo('UTC')
      table.integer('content_version').notNullable().defaultTo(1)
      table.integer('approved_version').nullable()
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.uuid('updated_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('archived_at', { useTz: true }).nullable()
      table.index(['agency_id', 'status'])
      table.index(['project_id', 'status'])
    })

    this.schema.createTable('publication_versions', (table) => {
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
      table.integer('version').notNullable()
      table.jsonb('snapshot_json').notNullable()
      table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.primary(['publication_id', 'version'])
    })

    this.schema.raw(`
      ALTER TABLE publications
      ADD CONSTRAINT publications_status_check
      CHECK (status IN (${statuses.map((status) => `'${status}'`).join(', ')}))
    `)
    this.schema.raw(`
      ALTER TABLE publications
      ADD CONSTRAINT publications_content_version_check
      CHECK (content_version >= 1 AND (approved_version IS NULL OR approved_version BETWEEN 1 AND content_version))
    `)
    this.schema.raw(`
      ALTER TABLE publication_versions
      ADD CONSTRAINT publication_versions_version_check CHECK (version >= 1)
    `)

    this.schema.alterTable('audit_logs', (table) => {
      table
        .uuid('target_publication_id')
        .nullable()
        .references('id')
        .inTable('publications')
        .onDelete('SET NULL')
        .index()
    })
  }

  async down() {
    this.schema.alterTable('audit_logs', (table) => table.dropColumn('target_publication_id'))
    this.schema.dropTable('publication_versions')
    this.schema.dropTable('publications')
  }
}
