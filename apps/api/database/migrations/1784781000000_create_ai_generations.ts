import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ai_generations', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').notNullable().index()
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
      table.string('provider', 80).notNullable()
      table.string('model', 120).notNullable()
      table.string('prompt_version', 40).notNullable()
      table.string('input_hash', 64).notNullable()
      table.jsonb('output_json').notNullable().defaultTo('{"variants":[],"warnings":[]}')
      table.string('status', 30).notNullable().defaultTo('queued')
      table.jsonb('usage_json').notNullable().defaultTo('{}')
      table.string('error_code', 80).nullable()
      table.string('applied_variant_id', 40).nullable()
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.timestamp('applied_at', { useTz: true }).nullable()
      table.index(['publication_id', 'created_at'])
      table.index(['agency_id', 'status', 'created_at'])
      table.index(['created_by', 'created_at'])
    })

    this.schema.raw(`
      ALTER TABLE ai_generations
      ADD CONSTRAINT ai_generations_status_check
      CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'))
    `)
  }

  async down() {
    this.schema.dropTable('ai_generations')
  }
}
