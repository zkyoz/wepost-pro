import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('publication_network_variants', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
      table.string('network', 30).notNullable()
      table.integer('source_version').notNullable()
      table.text('text').notNullable()
      table.string('status', 20).notNullable().defaultTo('draft')
      table.boolean('generated_by_ai').notNullable().defaultTo(false)
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('approved_at', { useTz: true }).nullable()
      table.timestamp('stale_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['publication_id', 'network', 'source_version'])
      table.index(['publication_id', 'status'])
    })

    this.schema.raw(`
      ALTER TABLE publication_network_variants
      ADD CONSTRAINT publication_network_variants_network_check
      CHECK (network IN ('facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok'))
    `)
    this.schema.raw(`
      ALTER TABLE publication_network_variants
      ADD CONSTRAINT publication_network_variants_status_check
      CHECK (status IN ('draft', 'approved', 'stale'))
    `)
    this.schema.raw(`
      ALTER TABLE publication_network_variants
      ADD CONSTRAINT publication_network_variants_source_version_check CHECK (source_version >= 1)
    `)
  }

  async down() {
    this.schema.dropTable('publication_network_variants')
  }
}
