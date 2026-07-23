import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('publications', (table) => {
      table.index(['scheduled_at'], 'publications_scheduled_at_index')
      table.index(['agency_id', 'scheduled_at'], 'publications_agency_scheduled_at_index')
      table.index(['project_id', 'scheduled_at'], 'publications_project_scheduled_at_index')
    })
  }

  async down() {
    this.schema.alterTable('publications', (table) => {
      table.dropIndex(['scheduled_at'], 'publications_scheduled_at_index')
      table.dropIndex(['agency_id', 'scheduled_at'], 'publications_agency_scheduled_at_index')
      table.dropIndex(['project_id', 'scheduled_at'], 'publications_project_scheduled_at_index')
    })
  }
}
