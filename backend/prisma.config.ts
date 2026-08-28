// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Si la variable de entorno no está definida, usa esta cadena de conexión directa del contenedor
    url: process.env.DATABASE_URL || 'postgresql://admin_syslab:SecretPassword2026@postgres-db:5432/syslab_db?schema=public',
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
});