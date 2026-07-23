import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('locale', 5).notNullable().defaultTo('fr').index()
    })
    this.schema.raw(`
      ALTER TABLE users
      ADD CONSTRAINT users_locale_check CHECK (locale IN ('fr', 'en'))
    `)

    this.schema.createTable('publication_translations', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').notNullable().index()
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
      table.string('source_locale', 5).notNullable()
      table.string('target_locale', 5).notNullable()
      table.integer('source_version').notNullable()
      table.string('source_hash', 64).notNullable()
      table.text('text').notNullable()
      table.string('status', 20).notNullable().defaultTo('draft')
      table.boolean('generated_by_ai').notNullable().defaultTo(false)
      table.string('provider', 80).nullable()
      table.string('model', 120).nullable()
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('approved_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['publication_id', 'target_locale', 'source_version'])
      table.index(['agency_id', 'status'])
      table.index(['publication_id', 'target_locale', 'status'])
    })
    this.schema.raw(`
      ALTER TABLE publication_translations
      ADD CONSTRAINT publication_translations_locales_check
      CHECK (
        source_locale IN ('fr', 'en')
        AND target_locale IN ('fr', 'en')
        AND source_locale <> target_locale
      )
    `)
    this.schema.raw(`
      ALTER TABLE publication_translations
      ADD CONSTRAINT publication_translations_status_check
      CHECK (status IN ('draft', 'approved', 'stale'))
    `)
    this.schema.raw(`
      ALTER TABLE publication_translations
      ADD CONSTRAINT publication_translations_source_version_check CHECK (source_version >= 1)
    `)
  }

  async down() {
    this.schema.dropTable('publication_translations')
    this.schema.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_locale_check')
    this.schema.alterTable('users', (table) => table.dropColumn('locale'))
  }
}
