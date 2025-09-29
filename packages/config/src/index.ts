import { z } from 'zod';
import type { PaperSize } from '@coloringpage/types';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Google Gemini API
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_URL: z.string().url().optional(),

  // Stripe
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // App URLs - No default to prevent production issues
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Storage
  STORAGE_TTL_ORIGINALS_DAYS: z.coerce.number().default(30),
  STORAGE_TTL_INTERMEDIATES_HOURS: z.coerce.number().default(48),
  STORAGE_TTL_ARTIFACTS_DAYS: z.coerce.number().default(90),
});

export function validateEnv(env: NodeJS.ProcessEnv) {
  return envSchema.parse(env);
}

export const config = {
  app: {
    name: 'Coloring Page Generator',
    description: 'Convert photos to printable coloring pages',
    defaultPaperSize: 'A4' as PaperSize,
  },

  limits: {
    maxUploadSizeMB: 10,
    maxImageDimensions: 4096,
    maxPixels: 24000000, // 24MP
    freeGenerationsPerDay: 3,
    maxRetries: 2,
    jobTimeoutSeconds: 45,
  },

  pdf: {
    dpi: 300,
    a4: {
      width: 2480,
      height: 3508,
    },
    letter: {
      width: 2550,
      height: 3300,
    },
    marginMM: 10,
  },

  generation: {
    complexityLevels: {
      simple: 'Simple outlines with minimal detail',
      moderate: 'Balanced detail suitable for most ages',
      detailed: 'Complex patterns with fine details',
    },
    lineThickness: {
      thin: 1,
      medium: 2,
      thick: 3,
    },
  },

  pricing: {
    creditsPerGeneration: 1,
    packs: [
      { credits: 10, price: 499 }, // $4.99
      { credits: 25, price: 999 }, // $9.99
      { credits: 50, price: 1799 }, // $17.99
    ],
  },

  features: {
    fallbackEnabled: false,
    aiTitleSuggestions: true,
    quickEdits: true,
    facesWarning: true,
  },
};