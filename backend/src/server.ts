// src/server.ts
import app from './app.ts';
import { prisma } from './config/prisma.ts';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor SysLab 2.0 corriendo en el puerto ${PORT} bajo TypeScript.`);
});

// Manejo de cierres limpios del contenedor (Graceful Shutdown)
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando el servidor limpiamente...`);
  server.close(async () => {
    console.log('📦 Servidor Express cerrado.');
    await prisma.$disconnect();
    console.log('🗄️ Conexión con PostgreSQL finalizada de forma segura.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));