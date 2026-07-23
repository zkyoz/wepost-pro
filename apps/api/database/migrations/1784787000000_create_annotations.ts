import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('annotations', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('publication_id')
        .notNullable()
        .references('id')
        .inTable('publications')
        .onDelete('CASCADE')
      table
        .uuid('media_id')
        .notNullable()
        .references('id')
        .inTable('media_assets')
        .onDelete('RESTRICT')
      table.uuid('comment_id').nullable().references('id').inTable('comments').onDelete('SET NULL')
      table.integer('publication_version').notNullable()
      table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.string('shape', 20).notNullable()
      table.double('x').notNullable()
      table.double('y').notNullable()
      table.double('width').nullable()
      table.double('height').nullable()
      table.text('body').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.index(['publication_id', 'media_id', 'publication_version', 'created_at'])
      table.index(['author_id', 'created_at'])
      table.index('comment_id')
    })

    this.schema.raw(`
      ALTER TABLE annotations
      ADD CONSTRAINT annotations_shape_check CHECK (shape IN ('point', 'rectangle')),
      ADD CONSTRAINT annotations_version_check CHECK (publication_version >= 1),
      ADD CONSTRAINT annotations_x_check CHECK (x >= 0 AND x <= 1),
      ADD CONSTRAINT annotations_y_check CHECK (y >= 0 AND y <= 1),
      ADD CONSTRAINT annotations_geometry_check CHECK (
        (shape = 'point' AND width IS NULL AND height IS NULL)
        OR
        (shape = 'rectangle' AND width > 0 AND height > 0 AND x + width <= 1 AND y + height <= 1)
      ),
      ADD CONSTRAINT annotations_body_check CHECK (char_length(trim(body)) BETWEEN 1 AND 2000)
    `)
  }

  async down() {
    this.schema.dropTable('annotations')
  }
}
