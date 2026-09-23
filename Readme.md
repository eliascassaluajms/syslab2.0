# SysLab 2.0

## Resumen ejecutivo

SysLab 2.0 es una aplicación web para la gestión integral de laboratorios, usuarios, accesos y estructuras institucionales de la Facultad de Ciencias Integradas de Yacuiba (FIRNT-UA/MS). Incluye backend en Node.js/Express con TypeScript, frontend en React/Vite y una base de datos PostgreSQL gestionada con Prisma ORM.

La aplicación está en desarrollo activo y cubre: autenticación JWT con RBAC, gestión de usuarios y roles con ámbitos institucionales, catálogos (facultades y carreras), laboratorios y equipos, incidencias, planes de estudio y materias, designaciones docentes, horarios, solicitudes de horarios extraordinarios, bitácoras de uso con QR, asistencia estudiantil, eventos y pagos (CITREN), y defensas de trabajos de grado.

---

## Tecnologías

### Backend
| Tecnología | Uso principal |
|---|---|
| Node.js | Runtime del servidor |
| Express | API REST |
| TypeScript | Tipado estático |
| Prisma | ORM y migraciones |
| PostgreSQL | Base de datos relacional |
| JWT | Autenticación stateless |
| bcryptjs | Hash de contraseñas |
| Multer | Subida de archivos (comprobantes, actas) |
| Tesseract.js / ExcelJS / XLSX | Importación y OCR de datos académicos |
| PDFKit / PDFMake | Generación de vouchers y documentos |
| express-rate-limit | Protección de endpoints |

### Frontend
| Tecnología | Uso principal |
|---|---|
| React | Interfaz de usuario |
| TypeScript | Tipado estático |
| Vite | Compilación y desarrollo |
| React Router | Manejo de rutas |
| Axios | Peticiones HTTP |
| Tailwind CSS | Estilos y diseño de UI |
| lucide-react / qrcode.react | Iconografía y generación de QR |

### Infraestructura
| Tecnología | Uso principal |
|---|---|
| Docker / Docker Compose | Contenedores para backend, frontend y PostgreSQL |
| Nginx + Certbot | Proxy reverso y TLS para sysfacultad.duckdns.org |
| Git | Control de versiones |

---

## Arquitectura

### Backend (`backend/`)

Separación clara en capas:

- `src/routes/*.routes.ts` — definen los endpoints HTTP, validaciones, `verificarJWT` y `requirePermission`.
- `src/controllers/*.controller.ts` — gestionan `req`/`res` y retornan respuestas JSON.
- `src/services/*.service.ts` — lógica de negocio pura (validaciones de dominio, estados, ámbitos).
- `src/repositories/*.repository.ts` — abstracción de consultas con el cliente Prisma.
- `src/middlewares/` — autenticación (`auth.middleware.ts`), autorización RBAC y perimetral (`authorize.middleware.ts`), errores (`errorHandler.ts`), rate limiting, subida de archivos y cabeceras de seguridad HTTP (`nosniff`, `SAMEORIGIN`, `XSS`, `Referrer-Policy`, `HSTS`).
- `src/config/prisma.ts` — instancia única de `PrismaClient` con adapter `PrismaPg`.
- `src/interfaces/` y `src/types/` — contratos tipados de la API y el contexto `Request.user`.

Flujo de petición: `Route → Controller → Service → Repository → Prisma → PostgreSQL`.

### Frontend (`frontend/`)

- Vistas públicas: landing (CITREN), login, recuperación de contraseña y registro público de asistencia por QR.
- Vistas protegidas bajo `ProtectedRoute` + `DashboardLayout` (sidebar con permisos).
- `context/AuthContext.tsx` gestiona sesión (JWT en `localStorage`) y `tienePermiso`.
- `services/httpClient.ts` inyecta `Authorization: Bearer <token>` y emite `auth_unauthorized` ante 401.
- Componentes reutilizables: modales por módulo, tablas, `Can.tsx` para permisos en UI.

### Base de datos

El modelo Prisma (`backend/prisma/schema.prisma`) cubre:

- RBAC: `Rol`, `Permiso`, `RolPermiso`, `AsignacionAmbito` (matriz rol + ámbito institucional).
- Institucional: `Usuario`, `Facultad`, `Carrera`, `PlanEstudio`, `Materia`, `DesignacionMateria`.
- Laboratorios: `Laboratorio`, `Horario`, `SolicitudHorarioExtraordinario`, `SesionBitacora`, `AsistenciaEstudiante`.
- Activos: `Equipo` e `Incidencia` (con transición de estados).
- Eventos: `Activity`, `CategoriaEvento`, `EventoParticipante`, `EventoPaymentConfig`.
- Defensas: `TrabajoGrado`, `DesignacionTribunal`, `VersionDocumento`, `ObservacionTribunal`, `ActaDefensa`.

---

## Estructura del repositorio

```
syslab2.0/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seeds/             # Seed por módulo (seguridad, estructura, planes, usuarios, eventos)
│   │   └── seed.ts
│   ├── scripts/               # Importación de datos académicos (padrón, programaciones, designaciones)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── config/
│   │   ├── interfaces/
│   │   ├── types/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── interfaces/
│   │   └── utils/
│   └── package.json
├── procesador-syslab/         # Utilidades de procesamiento de PDF/OCR/XLSX
├── docker-compose.yml
├── nginx-syslab.conf
├── package.json
└── .env.example
```

---

## Módulos implementados

1. **Autenticación y sesión** — login por correo o username, JWT con expiración, middleware de verificación y logout.
2. **RBAC y ámbitos** — roles, permisos granulares, matriz de asignaciones por facultad/carrera en el backend y en la UI, control perimetral por carrera.
3. **Usuarios** — alta, edición, activación/desactivación lógica, cambio de contraseña, asignación de roles y ámbitos.
4. **Catálogos institucionales** — administración de facultades y carreras.
5. **Laboratorios y equipos** — CRUD de laboratorios, inventario de equipos con categoría y estado, códigos patrimoniales.
6. **Incidencias** — reporte y gestión (asignación de técnico, prioridad, solución) con transición automática del estado del equipo.
7. **Planes de estudio y materias** — planes por carrera/gestión con materias.
8. **Designaciones** — carga académica de materias a docentes por gestión y período.
9. **Horarios** — programación por laboratorio, materia, docente y grupo.
10. **Solicitudes extraordinarias** — reservas fuera de horario regular con aprobación/rechazo.
11. **Bitácoras y asistencia** — sesiones de uso con token QR, registro de asistencia por QR/PIN/manual y justificativos.
12. **Eventos y pagos (CITREN)** — categorías, actividades, inscripción de participantes, verificación de comprobantes de pago y configuración bancaria/QR.
13. **Defensas de grado** — trabajos de grado, designación de tribunal, revisiones con observaciones, versiones de documento y actas.

---

## Modelo de datos principal

El esquema refleja un diseño orientado a la administración universitaria y al control de accesos por ámbito:

- `Usuario` — identidad y credenciales.
- `Rol` / `Permiso` — agrupación de capacidades del sistema.
- `AsignacionAmbito` — matriz de alcance institucional por facultad o carrera.
- `Facultad` / `Carrera` — estructura orgánica.
- `Laboratorio` / `Horario` / `SesionBitacora` — ambientes, programación y uso real.
- `Equipo` / `Incidencia` — inventario y soporte técnico.
- `TrabajoGrado` / `DesignacionTribunal` / `ActaDefensa` — ciclo de defensas.
- `Activity` / `EventoParticipante` / `EventoPaymentConfig` — eventos con inscripción y pagos.

---

## Cómo ejecutar el proyecto

### Opción 1: Docker

```bash
docker compose up --build
```

Servicios esperados:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000 (health: `/api/health`)
- PostgreSQL: localhost:5434

> Los contenedores requieren que el archivo `.env` raíz exista (ver `.env.example`). El arranque del backend ejecuta `prisma generate`, `db push` y `seed` automáticamente.

### Opción 2: desarrollo local

Requisitos: Node.js 20+, PostgreSQL accesible.

```bash
# Backend (puerto 5000)
cd backend
npm install
npm run dev

# Frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

Las variables de entorno se cargan desde `backend/.env` (backend) y `frontend/.env` (frontend). Ajusta `DATABASE_URL` y `JWT_SECRET` según tu entorno.

---

## Pruebas

```bash
# Backend (Node test runner) — base en backend/
cd backend
npm test

# Frontend (Vitest + Testing Library) — base en frontend/
cd frontend
npm test
```

---

## Módulo de importación de datos académicos

El backend incluye scripts de carga en `backend/scripts/` (padrón estudiantil, programaciones, designaciones) que procesan archivos XLSX/PDF/TXT con apoyo de `tesseract.js` (OCR en `src/services/ocr.service.ts`). Los resultados se persisten vía Prisma.

---

## Acceso desde la red local

Si otro dispositivo debe acceder al sistema en la misma red Wi-Fi:

1. Modifica la variable en `frontend/.env`:
   - `VITE_API_URL=http://<IP_LOCAL>:5000/api`
2. En el `.env` raíz (o `backend/.env`):
   - `FRONTEND_URL=http://<IP_LOCAL>:5173`
3. Usa la IP privada del host, no `localhost`.
4. Verifica que los puertos 5173 y 5000 estén abiertos.

---

## Buenas prácticas del backend

- Usar únicamente la instancia de Prisma de `src/config/prisma.ts`; prohibido crear `new PrismaClient()` en otros archivos.
- Levantar errores con `throw new AppError('Mensaje en español', statusCode)`.
- No usar `any`; tipar con las interfaces de `src/interfaces/` o tipos generados por Prisma.
- Toda modificación del modelo se hace en `prisma/schema.prisma` con su migración.
- Respuestas coherentes: `200`, `201`, `400`, `401`, `403`, `404`, `500`.

---

## Información de versión

- Estado: desarrollo activo
- Base de datos: PostgreSQL + Prisma
- Stack: Node.js / Express / React / Vite / TypeScript
- Última revisión: 2026-09-18