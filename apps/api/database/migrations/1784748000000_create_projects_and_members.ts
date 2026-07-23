import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('projects', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('agency_id').notNullable().index()
      table.string('name', 120).notNullable()
      table.text('description').notNullable().defaultTo('')
      table.string('status', 20).notNullable().defaultTo('active').index()
      table
        .uuid('client_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
        .index()
      table.string('timezone', 80).notNullable().defaultTo('UTC')
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('archived_at', { useTz: true }).nullable()
      table.index(['agency_id', 'status'])
    })

    this.schema.createTable('project_members', (table) => {
      table
        .uuid('project_id')
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
        .index()
      table.string('membership_role', 20).notNullable().defaultTo('member')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.primary(['project_id', 'user_id'])
      table.index(['project_id', 'membership_role'])
    })

    this.schema.raw(`
      ALTER TABLE projects
      ADD CONSTRAINT projects_status_check
      CHECK (status IN ('active', 'archived'))
    `)
    this.schema.raw(`
      ALTER TABLE project_members
      ADD CONSTRAINT project_members_role_check
      CHECK (membership_role IN ('primary', 'member'))
    `)

    this.schema.alterTable('audit_logs', (table) => {
      table
        .uuid('target_project_id')
        .nullable()
        .references('id')
        .inTable('projects')
        .onDelete('SET NULL')
        .index()
    })
  }

  async down() {
    this.schema.alterTable('audit_logs', (table) => {
      table.dropColumn('target_project_id')
    })
    this.schema.dropTable('project_members')
    this.schema.dropTable('projects')
  }
}
