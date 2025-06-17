import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  CORS_ORIGINS: z
    .string()
    .transform(val => val?.split(',') ?? ['http://localhost:4200']),
  JWT_SECRET: z.string().nonempty('Variable JWT_SECRET must be set'),
  JWT_REFRESH_SECRET: z
    .string()
    .nonempty('Variable JWT_REFRESH_SECRET must be set'),
});

// Validate
const parsed = EnvSchema.parse(process.env);
export const config = {
  port: parsed.PORT,
  nodeEnv: parsed.NODE_ENV,
  corsOrigins: parsed.CORS_ORIGINS,
  jwtSecret: parsed.JWT_SECRET,
  jwtSecretRefresh: parsed.JWT_REFRESH_SECRET,
};
