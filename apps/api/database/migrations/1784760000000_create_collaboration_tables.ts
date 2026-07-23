import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('comments', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
        .index()
      table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.text('body').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('edited_at', { useTz: true }).nullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.index(['publication_id', 'created_at'])
    })

    this.schema.createTable('publication_reviews', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
        .index()
      table.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.integer('version').notNullable()
      table.string('decision', 40).notNullable()
      table.text('message').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.unique(['publication_id', 'reviewer_id', 'version'])
      table.index(['publication_id', 'created_at'])
    })

    this.schema.createTable('notifications', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table.string('type', 80).notNullable().index()
      table.jsonb('payload_json').notNullable().defaultTo('{}')
      table.timestamp('read_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.string('email_status', 20).notNullable().defaultTo('pending').index()
      table.string('email_job_id', 160).nullable()
      table.integer('email_attempts').notNullable().defaultTo(0)
      table.string('email_last_error', 240).nullable()
      table.timestamp('emailed_at', { useTz: true }).nullable()
      table.index(['user_id', 'read_at', 'created_at'])
    })

    this.schema.raw(`
      ALTER TABLE publication_reviews
      ADD CONSTRAINT publication_reviews_decision_check
      CHECK (decision IN ('approved', 'changes_requested'))
    `)
    this.schema.raw(`
      ALTER TABLE publication_reviews
      ADD CONSTRAINT publication_reviews_version_check CHECK (version >= 1)
    `)
    this.schema.raw(`
      ALTER TABLE notifications
      ADD CONSTRAINT notifications_email_status_check
      CHECK (email_status IN ('pending', 'sent', 'failed'))
    `)
    this.schema.raw(`
      ALTER TABLE notifications
      ADD CONSTRAINT notifications_email_attempts_check CHECK (email_attempts >= 0)
    `)
  }

  async down() {
    this.schema.dropTable('notifications')
    this.schema.dropTable('publication_reviews')
    this.schema.dropTable('comments')
  }
}
