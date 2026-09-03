import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED is required for migrations');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED },
  strict: true,
  verbose: true,
});
