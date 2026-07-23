import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('backup_runs', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('type', 30).notNullable()
      table.timestamp('started_at', { useTz: true }).notNullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.string('status', 20).notNullable()
      table.string('object_key', 512).nullable()
      table.string('checksum', 64).nullable()
      table.bigInteger('size_bytes').nullable()
      table.text('error_redacted').nullable()
      table.string('retention_tier', 20).nullable()
      table.timestamp('verified_at', { useTz: true }).nullable()
      table.timestamp('restored_at', { useTz: true }).nullable()
      table.index(['status', 'started_at'])
      table.index(['type', 'started_at'])
    })

    this.schema.raw(`
      ALTER TABLE backup_runs
      ADD CONSTRAINT backup_runs_type_check
      CHECK (type IN ('database', 'restore_drill'))
    `)
    this.schema.raw(`
      ALTER TABLE backup_runs
      ADD CONSTRAINT backup_runs_status_check
      CHECK (status IN ('running', 'succeeded', 'failed'))
    `)
    this.schema.raw(`
      ALTER TABLE backup_runs
      ADD CONSTRAINT backup_runs_retention_tier_check
      CHECK (retention_tier IS NULL OR retention_tier IN ('daily', 'weekly', 'monthly'))
    `)
    this.schema.raw(`
      ALTER TABLE backup_runs
      ADD CONSTRAINT backup_runs_completed_check
      CHECK (
        (status = 'running' AND completed_at IS NULL)
        OR (status IN ('succeeded', 'failed') AND completed_at IS NOT NULL)
      )
    `)
  }

  async down() {
    this.schema.dropTable('backup_runs')
  }
}
