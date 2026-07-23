import { ProjectSchema } from '#database/schema'
import type { ProjectStatus } from '#domain/projects/project_status'

export default class Project extends ProjectSchema {
  declare status: ProjectStatus
}
