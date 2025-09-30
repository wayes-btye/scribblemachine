import { z } from 'zod';

// Worker-specific environment validation schema
// Only includes variables the worker actually needs
const workerEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Supabase (required for worker)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),

    // Google Gemini API (required for worker)
    GEMINI_API_KEY: z.string(),

    // Worker Control (optional)
    PAUSE_WORKER: z.enum(['true', 'false']).optional(),

    // Server port (optional)
    PORT: z.string().optional(),
});

export function validateWorkerEnv(env: NodeJS.ProcessEnv) {
    return workerEnvSchema.parse(env);
}

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
