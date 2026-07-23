import DatabaseBackupService from '#services/backups/database_backup_service'
import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class BackupRestoreDrill extends BaseCommand {
  static commandName = 'backup:restore-drill'
  static description = 'Restore the latest verified backup into an isolated PostgreSQL database'
  static options: CommandOptions = { startApp: true }

  @args.string({ required: false, description: 'Exact R2 object key; latest verified by default' })
  declare objectKey?: string

  async run() {
    try {
      const run = await new DatabaseBackupService().restoreDrill(this.objectKey)
      this.logger.success(`Restore drill ${run.id} completed`)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'backup_operation_failed')
      this.exitCode = 1
    }
  }
}
