# SysLab 2.0 - Documento de revisi�n del proyecto

## ?? Resumen ejecutivo

SysLab 2.0 es una aplicaci�n web para la gesti�n integral de laboratorios, usuarios, accesos y estructuras institucionales de la Facultad de Ciencias Integradas de Yacuiba. La implementaci�n actual ya incluye un backend en Node.js/Express con TypeScript, un frontend en React/Vite y una base de datos PostgreSQL gestionada con Prisma.

Durante la revisi�n realizada sobre la estructura real del repositorio, se confirm� que el proyecto est� en una fase de desarrollo avanzado, con m�dulos funcionales de autenticaci�n, control de acceso, gesti�n de usuarios, cat�logos institucionales y administraci�n de laboratorios.

---

## ? Estado actual del proyecto

### Alcance implementado

- Autenticaci�n de usuarios con JWT y middleware de protecci�n.
- Sistema RBAC b�sico con roles, permisos y control por middleware.
- Gesti�n de usuarios con activaci�n/desactivaci�n l�gica.
- Gesti�n de roles y permisos desde el backend y el frontend.
- Cat�logos institucionales de facultades y carreras.
- Gesti�n de laboratorios, incluyendo cambio de estado y gesti�n de equipos asociada.
- Modelo de datos con soporte para equipos e incidencias.

### �reas en desarrollo o pendientes

- Integraci�n completa de la UI de incidencias con el m�dulo de backend.
- Refinamiento del flujo de permisos en vistas espec�ficas.
- Definici�n m�s completa de los roles institucionales y sus permisos por entorno.
- Mejoras de validaci�n, pruebas automatizadas y documentaci�n operativa.

---

## ?? Arquitectura actual

### Backend

El backend est� estructurado con una separaci�n clara en capas:

- Routes: definen los endpoints REST.
- Controllers: procesan peticiones y respuestas.
- Services: encapsulan la l�gica de negocio.
- Middlewares: manejan autenticaci�n, autorizaci�n y errores.
- Prisma: abstrae el acceso a PostgreSQL.

### Frontend

El frontend est� construido con React + Vite y organiza la experiencia en:

- Vistas principales: login, dashboard, usuarios, roles, cat�logos y laboratorios.
- Componentes reutilizables: modales, tablas, controles de permisos.
- Contexto de autenticaci�n para gestionar la sesi�n del usuario.
- Rutas protegidas con redirecci�n seg�n el estado de autenticaci�n.

### Base de datos

El modelo Prisma cubre entidades como:

- usuarios
- roles
- permisos
- asignaciones de �mbito
- facultades
- carreras
- laboratorios
- equipos
- incidencias

---

## ??? Tecnolog�as utilizadas

### Backend

| Tecnolog�a | Uso principal |
|---|---|
| Node.js | Runtime del servidor |
| Express | API REST |
| TypeScript | Tipado est�tico |
| Prisma | ORM y migraciones |
| PostgreSQL | Base de datos relacional |
| JWT | Autenticaci�n stateless |
| bcrypt/bcryptjs | Hash de contrase�as |
| CORS | Control de acceso HTTP |

### Frontend

| Tecnolog�a | Uso principal |
|---|---|
| React | Interfaz de usuario |
| TypeScript | Tipado est�tico |
| Vite | Herramienta de compilaci�n y desarrollo |
| React Router | Manejo de rutas |
| Axios | Peticiones HTTP |
| Tailwind CSS | Estilos y dise�o de UI |

### Infraestructura

| Tecnolog�a | Uso principal |
|---|---|
| Docker | Contenedores para backend, frontend y PostgreSQL |
| Docker Compose | Orquestaci�n de servicios |
| Git | Control de versiones |

---

## ?? Estructura del repositorio

`	ext
syslab2.0/
+-- backend/
�   +-- prisma/
�   �   +-- schema.prisma
�   �   +-- migrations/
�   +-- src/
�   �   +-- controllers/
�   �   +-- services/
�   �   +-- routes/
�   �   +-- middlewares/
�   �   +-- config/
�   �   +-- utils/
�   +-- package.json
�   +-- Dockerfile
+-- frontend/
�   +-- src/
�   �   +-- components/
�   �   +-- views/
�   �   +-- hooks/
�   �   +-- services/
�   �   +-- routes/
�   �   +-- context/
�   +-- package.json
�   +-- Dockerfile
+-- docker-compose.yml
+-- package.json
+-- PROYECTO.md
`

---

## ?? M�dulos implementados

### 1. Autenticaci�n y sesi�n

- Login con correo y contrase�a.
- Generaci�n de token JWT.
- Middleware de verificaci�n de sesi�n.
- Protecci�n de rutas seg�n permisos.

### 2. Gesti�n de usuarios

- Alta de usuarios b�sicos.
- Modificaci�n de datos b�sicos.
- Cambio de estado activo/inactivo.
- Asignaci�n de roles y �mbitos institucionales.

### 3. Roles y permisos

- Creaci�n, edici�n y eliminaci�n de roles.
- Asignaci�n de permisos granulares.
- Uso de middleware de autorizaci�n para restringir accesos.

### 4. Cat�logos institucionales

- Administraci�n de facultades.
- Administraci�n de carreras asociadas a facultades.
- Vista protegida para usuarios con permisos correspondientes.

### 5. Laboratorios y recursos

- Alta, edici�n y desactivaci�n de laboratorios.
- Gesti�n de capacidad, ubicaci�n y descripci�n.
- Integraci�n con gesti�n de equipos por laboratorio.

### 6. Equipos e incidencias

- El esquema y las rutas de soporte est�n preparados para este m�dulo.
- La l�gica de incidencias existe en backend, aunque la experiencia visual puede requerir m�s consolidaci�n.

---

## ??? Modelo de datos principal

El esquema actual refleja un dise�o orientado a la administraci�n universitaria y al control de accesos por �mbito:

- Usuario: identidad y credenciales.
- Rol: agrupaci�n de permisos.
- Permiso: capacidad espec�fica del sistema.
- AsignacionAmbito: matriz de alcance institucional por facultad o carrera.
- Facultad y Carrera: estructura org�nica de la universidad.
- Laboratorio: ambientes de pr�ctica e infraestructura.
- Equipo e Incidencia: soporte t�cnico y control operativo.

Este dise�o permite avanzar hacia procesos m�s completos de reserva, mantenimiento y trazabilidad.

---

## ?? C�mo ejecutar el proyecto

### Opci�n 1: con Docker

`ash
docker compose up --build
`

Servicios esperados:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432

### Opci�n 2: desarrollo local

Backend:

`ash
cd backend
npm install
npm run dev
`

Frontend:

`ash
cd frontend
npm install
npm run dev
`

---

## ?? Observaciones de revisi�n

La revisi�n del c�digo confirm� que el proyecto ya no est� solo en una fase conceptual: cuenta con una base s�lida para operar como sistema administrativo. La mayor fortaleza del proyecto es la combinaci�n de autenticaci�n, roles, asignaci�n de �mbitos y m�dulos de gesti�n institucionales.

La principal mejora pendiente es la consolidaci�n de la experiencia de usuario en los m�dulos m�s complejos, especialmente el flujo de incidencias y la integraci�n de todos los permisos con la interfaz.

---

## ?? Pr�ximos pasos recomendados

1. Completar la integraci�n visual del m�dulo de incidencias.
2. A�adir pruebas automatizadas para backend y frontend.
3. Definir un cat�logo de permisos m�s detallado por rol y m�dulo.
4. Mejorar el manejo de errores y mensajes de validaci�n en la interfaz.
5. Documentar los endpoints y flujos de negocio para operaci�n diaria.

---
## ?? Configuración para acceso desde la red local

Si otro desarrollador desea acceder al sistema desde su celular o desde otra computadora en la misma red Wi‑Fi, debe ajustar únicamente los puntos relacionados con la URL base del frontend y la API.

### Archivos a configurar manualmente

- [sislab/syslab2.0/frontend/.env](sislab/syslab2.0/frontend/.env)
  - Definir la variable:
    - VITE_API_URL=http://<IP_LOCAL>:5000/api
  - Ejemplo: VITE_API_URL=http://192.168.100.8:5000/api

- [sislab/syslab2.0/frontend/src/services/httpClient.ts](sislab/syslab2.0/frontend/src/services/httpClient.ts)
  - Si se usa un valor por defecto en el código, debe coincidir con la misma IP local del host.
  - Ejemplo: const API_URL = 'http://192.168.100.8:5000/api';
  - Esto es importante cuando el proyecto no recibe la variable de entorno correctamente en el arranque.

- [sislab/syslab2.0/.env](sislab/syslab2.0/.env) o [sislab/syslab2.0/backend/.env](sislab/syslab2.0/backend/.env)
  - Definir la variable:
    - FRONTEND_URL=http://<IP_LOCAL>:5173
  - Ejemplo: FRONTEND_URL=http://192.168.100.8:5173
  - Esto permite que el backend acepte correctamente las peticiones del frontend desde otra máquina en la red local.

### Pasos adicionales recomendados

1. Asegurarse de que la computadora que ejecuta Docker y el dispositivo que accede estén en la misma red Wi‑Fi o red local.
2. Usar la IP privada de la máquina anfitriona, no `localhost` ni `127.0.0.1`.
3. Abrir en el navegador del otro dispositivo:
   - Frontend: http://<IP_LOCAL>:5173
   - API: http://<IP_LOCAL>:5000/api
4. Si el acceso sigue fallando, verificar que los puertos 5173 y 5000 estén abiertos y que Docker esté exponiendo los contenedores correctamente.

### Acceso esperado

- Frontend: http://<IP_LOCAL>:5173
- Backend: http://<IP_LOCAL>:5000
- API: http://<IP_LOCAL>:5000/api

> No es necesario modificar [sislab/syslab2.0/docker-compose.yml](sislab/syslab2.0/docker-compose.yml) para este escenario, salvo que se desee cambiar puertos o nombres de servicios.

## ?? Información de versión

- Estado: desarrollo activo
- Base de datos: PostgreSQL + Prisma
- Stack actual: Node.js / Express / React / Vite / TypeScript
- �ltima revisi�n: 2026-07-23
