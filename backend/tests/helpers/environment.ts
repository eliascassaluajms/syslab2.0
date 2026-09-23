import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirnamePath = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.join(__dirnamePath, '..', '..', '.env'),
  override: false,
});

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('postgres-db:5432')) {
  process.env.DATABASE_URL = 'postgresql://admin_syslab:SecretPassword2026@127.0.0.1:5434/syslab_db?schema=public';
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms';

const appModule = await import('../../src/app.js');
const prismaModule = await import('../../src/config/prisma.js');

export const app = appModule.default;
export const prisma = prismaModule.prisma;