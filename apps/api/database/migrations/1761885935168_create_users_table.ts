import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').nullable().index()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('display_name', 120).notNullable()
      table.string('role', 32).notNullable().defaultTo('client').index()
      table.boolean('is_active').notNullable().defaultTo(true).index()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
