import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('media_assets', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').notNullable().index()
      table.uuid('uploader_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.string('storage_key', 512).notNullable().unique()
      table.string('original_name', 255).notNullable()
      table.string('mime_type', 120).notNullable()
      table.bigInteger('size_bytes').notNullable()
      table.string('checksum', 64).notNullable()
      table.integer('width').nullable()
      table.integer('height').nullable()
      table.bigInteger('duration_ms').nullable()
      table.text('alt_text').nullable()
      table.boolean('is_decorative').notNullable().defaultTo(false)
      table.string('scan_status', 30).notNullable().defaultTo('pending_upload').index()
      table.timestamp('upload_expires_at', { useTz: true }).notNullable().index()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable().index()
      table.index(['agency_id', 'checksum'])
    })

    this.schema.createTable('publication_media', (table) => {
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
      table
        .uuid('media_id')
        .notNullable()
        .references('id')
        .inTable('media_assets')
        .onDelete('CASCADE')
      table.integer('position').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.primary(['publication_id', 'media_id'])
      table.unique(['publication_id', 'position'])
      table.index('media_id')
    })

    this.schema.raw(`
      ALTER TABLE media_assets
      ADD CONSTRAINT media_assets_scan_status_check
      CHECK (scan_status IN ('pending_upload', 'clean', 'rejected', 'quarantined'))
    `)
    this.schema.raw(
      'ALTER TABLE media_assets ADD CONSTRAINT media_assets_size_check CHECK (size_bytes > 0)'
    )
    this.schema.raw(
      'ALTER TABLE publication_media ADD CONSTRAINT publication_media_position_check CHECK (position >= 0)'
    )

    this.schema.alterTable('audit_logs', (table) => {
      table
        .uuid('target_media_id')
        .nullable()
        .references('id')
        .inTable('media_assets')
        .onDelete('SET NULL')
        .index()
    })
  }

  async down() {
    this.schema.alterTable('audit_logs', (table) => table.dropColumn('target_media_id'))
    this.schema.dropTable('publication_media')
    this.schema.dropTable('media_assets')
  }
}
