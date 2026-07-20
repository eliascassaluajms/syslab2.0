// backend/src/server.ts
import 'dotenv/config'; 
import app from './app.js';                 
import { prisma } from './config/prisma.js'; 

const PORT = process.env.PORT || 5000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor SysLab 2.0 corriendo en el puerto ${PORT} bajo TypeScript.`);
});

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