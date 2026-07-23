import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('calendar_feed_tokens', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('project_id').nullable().references('id').inTable('projects').onDelete('CASCADE')
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.index(['user_id', 'revoked_at', 'created_at'])
      table.index(['project_id', 'revoked_at'])
    })
  }

  async down() {
    this.schema.dropTable('calendar_feed_tokens')
  }
}
