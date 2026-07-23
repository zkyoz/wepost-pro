import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(
      `CREATE INDEX IF NOT EXISTS publications_statistics_created_idx ON publications (agency_id, created_at, project_id)`
    )
    this.schema.raw(
      `CREATE INDEX IF NOT EXISTS scheduled_publications_statistics_idx ON scheduled_publications (run_at, status, network, publication_id)`
    )
    this.schema.raw(
      `CREATE INDEX IF NOT EXISTS publication_reviews_statistics_idx ON publication_reviews (created_at, decision, publication_id)`
    )
    this.schema.raw(
      `CREATE INDEX IF NOT EXISTS comments_statistics_idx ON comments (created_at, publication_id) WHERE deleted_at IS NULL`
    )
    this.schema.raw(
      `CREATE INDEX IF NOT EXISTS media_assets_statistics_idx ON media_assets (agency_id, created_at) WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS media_assets_statistics_idx')
    this.schema.raw('DROP INDEX IF EXISTS comments_statistics_idx')
    this.schema.raw('DROP INDEX IF EXISTS publication_reviews_statistics_idx')
    this.schema.raw('DROP INDEX IF EXISTS scheduled_publications_statistics_idx')
    this.schema.raw('DROP INDEX IF EXISTS publications_statistics_created_idx')
  }
}
