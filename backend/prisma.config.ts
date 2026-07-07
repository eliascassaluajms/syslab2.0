// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';

// Provide a minimal declaration for `process` so TypeScript does not complain
declare const process: { env: { DATABASE_URL?: string } };

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'node ./prisma/seed.js',
  },
});