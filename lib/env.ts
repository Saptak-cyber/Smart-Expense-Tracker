import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase Service Role Key is required').optional(),
  
  // AI
  GEMINI_API_KEY: z.string().min(1, 'Gemini API Key is required'),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  try {
    const env = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Environment validation failed. Check your .env.local file.');
    }
    throw error;
  }
}

// Validate on module load (server-side only)
export const env = typeof window === 'undefined' ? validateEnv() : ({} as Env);

// Helper function to safely access env vars with runtime checks
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  if (typeof window !== 'undefined') {
    // On client, only allow public vars
    if (!key.startsWith('NEXT_PUBLIC_')) {
      throw new Error(`Cannot access server-only env var "${key}" on client`);
    }
    return process.env[key] as Env[K];
  }
  
  if (!(key in env)) {
    throw new Error(`Environment variable "${key}" is not defined`);
  }
  
  return env[key];
}
