import { ProjectMemberSchema } from '#database/schema'

export type ProjectMembershipRole = 'primary' | 'member'

export default class ProjectMember extends ProjectMemberSchema {
  declare membershipRole: ProjectMembershipRole
}
