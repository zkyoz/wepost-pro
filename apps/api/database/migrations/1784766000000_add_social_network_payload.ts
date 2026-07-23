import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('scheduled_publications', (table) => {
      table.jsonb('network_payload_json').notNullable().defaultTo('{}')
    })
  }

  async down() {
    this.schema.alterTable('scheduled_publications', (table) => {
      table.dropColumn('network_payload_json')
    })
  }
}
