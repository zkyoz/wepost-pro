import type {
  AiGenerationInput,
  AiProviderResult,
  AiTextProvider,
} from "./types.js";

export class InvalidAiProviderOutputError extends Error {
  name = "InvalidAiProviderOutputError";
}

export class AiProviderDisabledError extends Error {
  name = "AiProviderDisabledError";
}

const maximumLength = { short: 280, medium: 800, long: 1500 } as const;

export function parseAiOutput(output: unknown, input: AiGenerationInput) {
  const parsed =
    typeof output === "string"
      ? (() => {
          try {
            return JSON.parse(output) as unknown;
          } catch {
            throw new InvalidAiProviderOutputError("invalid_json");
          }
        })()
      : output;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { variants?: unknown }).variants)
  ) {
    throw new InvalidAiProviderOutputError("missing_variants");
  }
  const variants = (parsed as { variants: unknown[] }).variants;
  if (variants.length !== input.variantCount) {
    throw new InvalidAiProviderOutputError("invalid_variant_count");
  }
  return variants.map((text, index) => {
    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > maximumLength[input.length]
    ) {
      throw new InvalidAiProviderOutputError("invalid_variant");
    }
    return { id: `variant-${index + 1}`, text: text.trim() };
  });
}

export class MockAiTextProvider implements AiTextProvider {
  async generate(input: AiGenerationInput): Promise<AiProviderResult> {
    const prefixes = {
      fr: [
        "À retenir",
        "Une idée à partager",
        "En bref",
        "Notre regard",
        "Le point essentiel",
      ],
      en: [
        "Key takeaway",
        "An idea to share",
        "In short",
        "Our perspective",
        "The essential point",
      ],
      es: [
        "Para recordar",
        "Una idea para compartir",
        "En resumen",
        "Nuestra mirada",
        "El punto esencial",
      ],
    } as const;
    return {
      output: {
        variants: Array.from(
          { length: input.variantCount },
          (_, index) =>
            `${prefixes[input.language][index] ?? prefixes[input.language][0]} — ${input.brief}`,
        ),
      },
    };
  }
}

export class DisabledAiTextProvider implements AiTextProvider {
  async generate(): Promise<AiProviderResult> {
    throw new AiProviderDisabledError("provider_not_configured");
  }
}
