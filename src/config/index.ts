// config/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment variables schema
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OpenAI API Key is required"),
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
  openAiApiKey: process.env.OPENAI_API_KEY,
} as const;