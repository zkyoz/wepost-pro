import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'scheduled_publications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('provider_job_id', 255).nullable().index()
      table.string('provider_status', 64).nullable().index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('provider_status')
      table.dropColumn('provider_job_id')
    })
  }
}
