import app from '@adonisjs/core/services/app'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

const password = 'correct-horse-battery-staple'
const agencyId = '00000000-0000-4000-8000-000000000001'

export default class SeedE2eRoles extends BaseCommand {
  static commandName = 'test:seed-roles'
  static description = 'Seed the three role accounts used by Playwright'
  static options: CommandOptions = { startApp: true }

  async run() {
    if (app.inProduction) {
      this.logger.error('Refusing to seed E2E accounts in production')
      this.exitCode = 1
      return
    }

    // Ace discovers command modules before the application providers are booted.
    // Import the model here so AuthFinder receives the initialized hash service.
    const { default: User } = await import('#models/user')

    await Promise.all([
      User.updateOrCreate(
        { email: 'admin.e2e@example.test' },
        {
          displayName: 'Admin E2E',
          email: 'admin.e2e@example.test',
          password,
          role: 'admin',
          agencyId: null,
          isActive: true,
        }
      ),
      User.updateOrCreate(
        { email: 'agency.e2e@example.test' },
        {
          displayName: 'Agence E2E',
          email: 'agency.e2e@example.test',
          password,
          role: 'agency',
          agencyId,
          isActive: true,
        }
      ),
      User.updateOrCreate(
        { email: 'client.e2e@example.test' },
        {
          displayName: 'Client E2E',
          email: 'client.e2e@example.test',
          password,
          role: 'client',
          agencyId,
          isActive: true,
        }
      ),
    ])

    this.logger.success('E2E role accounts are ready')
  }
}
