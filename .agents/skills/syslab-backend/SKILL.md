---
name: syslab-backend-typescript-prisma
description: Estándares de arquitectura por capas para la API REST de SysLab 2.0 con Node.js, Express, TypeScript, Prisma ORM y PostgreSQL.
---

# Instrucciones para el Agente Backend (SysLab 2.0)

## Stack Tecnológico
- **Runtime & Lenguaje:** Node.js (LTS) + TypeScript
- **Framework Web:** Express.js
- **ORM & Base de Datos:** Prisma ORM + PostgreSQL
- **Seguridad & RBAC:** JWT con `auth.middleware.ts` y `authorize.middleware.ts`
- **Gestión de Excepciones:** Clase personalizada `AppError` + middleware global `errorHandler.ts`

## Arquitectura y Flujo de Trabajo (`backend/src/`)
1. **Rutas (`src/routes/*.routes.ts`):** Definen los endpoints HTTP y aplican middlewares de validación, `authMiddleware` y `authorizeMiddleware`.
2. **Controladores (`src/controllers/*.controller.ts`):** Gestionan `req` y `res`, extraen parámetros y retornan la respuesta en formato JSON.
3. **Servicios (`src/services/*.service.ts`):** Concentran la lógica de negocio pura (validación de reglas de dominio, estados de laboratorios/equipos, asignación de materias).
4. **Repositorios (`src/repositories/*.repository.ts`):** Abstraen las consultas a la base de datos usando el cliente de Prisma.
5. **Configuración & Utilidades:**
   - Cliente Prisma singleton en `src/config/prisma.ts`.
   - Excepciones personalizadas con `AppError` en `src/utils/appError.ts`.
   - Interfaces e hipertipado en `src/interfaces/` y `src/types/`.

## Reglas de Código Obligatorias
- **Instancia de Prisma:** Usar únicamente la instancia exportada desde `src/config/prisma.ts`. Prohibido instanciar `new PrismaClient()` en otros archivos.
- **Manejo de Errores Uniforme:** Elevar excepciones usando `throw new AppError('Mensaje de error en español', statusCode)`. El middleware `errorHandler.ts` se encargará de responder al cliente.
- **Sin `any` en TypeScript:** Todos los parámetros, retornos de servicios y contratos de repositorios deben estar tipados con interfaces de `src/interfaces/` o tipos generados por Prisma (`Prisma.<Modelo>GetPayload`).
- **Respuestas de API:** Mantener coherencia en los códigos de respuesta: `200` (Éxito), `201` (Recurso Creado), `400` (Solicitud Incorrecta), `401` (No Autorizado), `403` (Prohibido), `404` (No Encontrado), `500` (Error Interno).
- **Migraciones:** Toda modificación en el modelo de datos debe realizarse actualizando `prisma/schema.prisma` y generando la migración correspondiente.
