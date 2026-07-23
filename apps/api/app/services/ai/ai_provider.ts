import { buildVersionedPrompt, type AiGenerationInput } from '#domain/ai/text_generation'

export type AiProviderResult = {
  output: unknown
  usage?: Record<string, number>
}

export interface AiTextProvider {
  readonly name: string
  readonly model: string
  generate(input: AiGenerationInput): Promise<AiProviderResult>
}

export class AiProviderUnavailableError extends Error {
  name = 'AiProviderUnavailableError'
}

export class AiProviderTimeoutError extends Error {
  name = 'AiProviderTimeoutError'
}

export class MockAiTextProvider implements AiTextProvider {
  readonly name = 'mock'
  readonly model = 'mock-text-v1'

  async generate(input: AiGenerationInput): Promise<AiProviderResult> {
    const { sanitizedBrief } = buildVersionedPrompt(input)
    const prefixes: Record<AiGenerationInput['language'], string[]> = {
      fr: ['À retenir', 'Une idée à partager', 'En bref', 'Notre regard', 'Le point essentiel'],
      en: [
        'Key takeaway',
        'An idea to share',
        'In short',
        'Our perspective',
        'The essential point',
      ],
      es: [
        'Para recordar',
        'Una idea para compartir',
        'En resumen',
        'Nuestra mirada',
        'El punto esencial',
      ],
    }
    return {
      output: {
        variants: Array.from(
          { length: input.variantCount },
          (_, index) =>
            `${prefixes[input.language][index] ?? prefixes[input.language][0]} — ${sanitizedBrief}`
        ),
      },
    }
  }
}

export class DisabledAiTextProvider implements AiTextProvider {
  readonly name = 'disabled'
  readonly model = 'TODO_PROVIDER_MODEL'
  async generate(): Promise<AiProviderResult> {
    throw new AiProviderUnavailableError('Aucun fournisseur IA réel n’est configuré.')
  }
}

export class ProtectedAiTextProvider implements AiTextProvider {
  readonly name: string
  readonly model: string
  private failures = 0
  private openedAt = 0

  constructor(
    private readonly provider: AiTextProvider,
    private readonly timeoutMs = 15_000,
    private readonly failureThreshold = 3,
    private readonly resetAfterMs = 60_000
  ) {
    this.name = provider.name
    this.model = provider.model
  }

  async generate(input: AiGenerationInput) {
    if (this.failures >= this.failureThreshold && Date.now() - this.openedAt < this.resetAfterMs) {
      throw new AiProviderUnavailableError(
        'Le circuit du fournisseur IA est temporairement ouvert.'
      )
    }
    let timer: NodeJS.Timeout | undefined
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new AiProviderTimeoutError('Délai fournisseur dépassé.')),
          this.timeoutMs
        )
      })
      const result = await Promise.race([this.provider.generate(input), timeout])
      this.failures = 0
      return result
    } catch (error) {
      this.failures += 1
      this.openedAt = Date.now()
      throw error
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}
