import DatabaseBackupService from '#services/backups/database_backup_service'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class BackupDatabase extends BaseCommand {
  static commandName = 'backup:database'
  static description = 'Create, encrypt, verify and retain a PostgreSQL backup in R2'
  static options: CommandOptions = { startApp: true }

  async run() {
    try {
      const run = await new DatabaseBackupService().backup()
      this.logger.success(`Backup ${run.id} verified`)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'backup_operation_failed')
      this.exitCode = 1
    }
  }
}
