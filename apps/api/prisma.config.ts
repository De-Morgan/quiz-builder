import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig, env } from 'prisma/config';

// .env.example/.env use ${VAR} interpolation for DATABASE_URL — expand it so the
// Prisma CLI (migrate/generate/studio) sees a fully-resolved connection string.
expand(loadEnv());

export default defineConfig({
  schema: path.join('src', 'database', 'schema.prisma'),
  migrations: {
    path: path.join('src', 'database', 'migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
