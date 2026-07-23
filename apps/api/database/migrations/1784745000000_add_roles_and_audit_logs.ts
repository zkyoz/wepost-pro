import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'agency', 'client'))
    `)

    this.schema.createTable('audit_logs', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('actor_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .index()
      table
        .uuid('target_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .index()
      table.string('action', 80).notNullable().index()
      table.jsonb('previous_values').notNullable().defaultTo('{}')
      table.jsonb('next_values').notNullable().defaultTo('{}')
      table.timestamp('created_at', { useTz: true }).notNullable().index()
    })
  }

  async down() {
    this.schema.dropTable('audit_logs')
    this.schema.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check')
  }
}
