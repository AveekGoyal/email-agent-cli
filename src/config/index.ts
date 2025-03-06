// config/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment variables schema
const envSchema = z.object({
  CLAUDE_API_KEY: z.string().min(1, "Claude API Key is required"),
});

// Validate environment variables
try {
  envSchema.parse(process.env);
} catch (error: unknown) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:", error.errors);
  } else {
    console.error("❌ An unexpected error occurred:", error);
  }
  process.exit(1);
}

// Export validated environment variables
export const config = {
  claudeApiKey: process.env.CLAUDE_API_KEY,
} as const;