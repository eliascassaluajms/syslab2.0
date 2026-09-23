// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // La cadena de conexión proviene del entorno (backend/.env o el .env raíz vía env_file).
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
});