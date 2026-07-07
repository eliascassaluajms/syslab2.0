// src/config/prisma.ts
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ La variable de entorno DATABASE_URL no está configurada.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });