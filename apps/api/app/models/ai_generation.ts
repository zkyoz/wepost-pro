import { AiGenerationSchema } from '#database/schema'

export type AiGenerationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type AiVariant = { id: string; text: string }

export default class AiGeneration extends AiGenerationSchema {
  declare status: AiGenerationStatus
  declare outputJson: { variants: AiVariant[]; warnings: string[] }
  declare usageJson: { latencyMs?: number; providerUsage?: Record<string, number> | null }
}
