import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('audit_logs', (table) => {
      table.string('entity_type', 50).nullable().index()
      table.uuid('entity_id').nullable().index()
      table.jsonb('metadata_json').notNullable().defaultTo('{}')
    })

    this.schema.raw(`
      UPDATE audit_logs
      SET
        entity_type = CASE
          WHEN target_publication_id IS NOT NULL THEN 'publication'
          WHEN target_project_id IS NOT NULL THEN 'project'
          WHEN target_media_id IS NOT NULL THEN 'media'
          WHEN target_user_id IS NOT NULL THEN 'user'
          ELSE NULL
        END,
        entity_id = COALESCE(
          target_publication_id,
          target_project_id,
          target_media_id,
          target_user_id
        )
      WHERE entity_type IS NULL OR entity_id IS NULL
    `)

    this.schema.raw(`
      CREATE OR REPLACE FUNCTION audit_logs_complete_entity()
      RETURNS trigger AS $$
      BEGIN
        NEW.entity_type := COALESCE(
          NEW.entity_type,
          CASE
            WHEN NEW.target_publication_id IS NOT NULL THEN 'publication'
            WHEN NEW.target_project_id IS NOT NULL THEN 'project'
            WHEN NEW.target_media_id IS NOT NULL THEN 'media'
            WHEN NEW.target_user_id IS NOT NULL THEN 'user'
            ELSE NULL
          END
        );
        NEW.entity_id := COALESCE(
          NEW.entity_id,
          NEW.target_publication_id,
          NEW.target_project_id,
          NEW.target_media_id,
          NEW.target_user_id
        );
        NEW.metadata_json := COALESCE(NEW.metadata_json, '{}'::jsonb);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    this.schema.raw(`
      CREATE TRIGGER audit_logs_complete_entity_before_insert
      BEFORE INSERT ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION audit_logs_complete_entity()
    `)

    this.schema.raw(`
      CREATE OR REPLACE FUNCTION audit_logs_reject_mutation()
      RETURNS trigger AS $$
      BEGIN
        IF TG_OP = 'UPDATE'
          AND (to_jsonb(NEW) - ARRAY[
            'target_user_id',
            'target_project_id',
            'target_publication_id',
            'target_media_id'
          ]) = (to_jsonb(OLD) - ARRAY[
            'target_user_id',
            'target_project_id',
            'target_publication_id',
            'target_media_id'
          ])
          AND (NEW.target_user_id IS NOT DISTINCT FROM OLD.target_user_id OR NEW.target_user_id IS NULL)
          AND (NEW.target_project_id IS NOT DISTINCT FROM OLD.target_project_id OR NEW.target_project_id IS NULL)
          AND (NEW.target_publication_id IS NOT DISTINCT FROM OLD.target_publication_id OR NEW.target_publication_id IS NULL)
          AND (NEW.target_media_id IS NOT DISTINCT FROM OLD.target_media_id OR NEW.target_media_id IS NULL)
        THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION 'audit_logs entries are immutable';
      END;
      $$ LANGUAGE plpgsql
    `)
    this.schema.raw(`
      CREATE TRIGGER audit_logs_immutable_before_change
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_mutation()
    `)
  }

  async down() {
    this.schema.raw('DROP TRIGGER IF EXISTS audit_logs_immutable_before_change ON audit_logs')
    this.schema.raw('DROP FUNCTION IF EXISTS audit_logs_reject_mutation()')
    this.schema.raw('DROP TRIGGER IF EXISTS audit_logs_complete_entity_before_insert ON audit_logs')
    this.schema.raw('DROP FUNCTION IF EXISTS audit_logs_complete_entity()')
    this.schema.alterTable('audit_logs', (table) => {
      table.dropColumn('metadata_json')
      table.dropColumn('entity_id')
      table.dropColumn('entity_type')
    })
  }
}
