import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE INDEX publications_supervision_status_date_idx
      ON publications (agency_id, status, scheduled_at, updated_at)
    `)
    this.schema.raw(`
      CREATE INDEX publications_target_networks_gin_idx
      ON publications USING GIN (target_networks)
    `)
    this.schema.raw(`
      CREATE INDEX notifications_unread_comments_idx
      ON notifications (user_id, created_at DESC)
      WHERE read_at IS NULL AND type = 'publication.comment_created'
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS notifications_unread_comments_idx')
    this.schema.raw('DROP INDEX IF EXISTS publications_target_networks_gin_idx')
    this.schema.raw('DROP INDEX IF EXISTS publications_supervision_status_date_idx')
  }
}
