# SysLab 2.0 — Guía de instalación y prueba piloto

> **Enlace oficial de descargas para usuarios:**
> **`http://200.87.27.36:5173/descargas/index.html`**
> (App Estudiante, App Docente, App de Escritorio Linux/Windows y guías paso a paso)

Fecha: 2026-09-21 · Serie de materias: **Plan 2024 (semestres 1-4)**

## 1. Qué ya está listo

| Componente | Estado | URL |
|---|---|---|
| API / Backend (Docker) | ✓ operativo | `http://200.87.27.36:5000` |
| Base de datos PostgreSQL | ✓ poblada | puerto `5434` (host) |
| Frontend web | ✓ operativo | `http://200.87.27.36:5173` |
| Gestiones | ✓ 2 planes | 2007 (id 1), 2024 (id 2) |
| Materias | ✓ 24 plan 2024 / 63 plan 2007 | siglas DIC/EST/FIS/MAT |
| Inscripciones | ✓ 2254 | gestión 2026 |
| Horarios piloto | ✓ 10 bloques | DIC121 (g1/g2), DIC221, DIC226 |

**Datos corregidos el 2026-09-21** (`backend/scripts/fix-piloto-2024.ts`):
- Las 24 materias oficiales del Plan 2024 (sem 1-4) reasignadas a su plan (antes caían al plan 2007).
- Contraseñas de estudiantes rehasheadas con bcrypt (ahora pueden iniciar sesión).
- Eliminadas las 49 materias `NINF-*` (inventadas) y sus 8 horarios.
- Creados 10 horarios reales a partir del Excel `PERIODO 2 GESTION 2026.xlsx` (hoja 29-07).

**Horarios piloto:**

| Materia | Grupo | Docente | Lab | Días / Horas |
|---|---|---|---|---|
| DIC121 Programación II | 1 | jose.narvaez | LAB-3 | Vie 11:00-13:15 · Sáb 08:00-10:15 |
| DIC121 Programación II | 2 | pedro.arenas | LAB-1 | Lun/Mar/Vie 18:00-19:30 |
| DIC221 Programación IV | 1 | pedro.arenas | LAB-2 | Lun/Mie/Vie 10:00-11:30 |
| DIC226 Internet de las Cosas | 1 | juan.carlos.jaramillo (jjaramillo) | LAB-5 | Lun 11:30-13:00 · Mar 09:15-10:45 |

**Credenciales de prueba (idénticas para TODO):**
- Usuario: `admin`, `ecassal` (jefe labs), docentes (`jnarvaez`, `parenas`, `jjaramillo`, …)
- Estudiantes: su **RU** (ej. `136630`)
- Contraseña en todos los casos: **`SysLab2026*`**

## 2. Descargas oficiales (paquetes generados el 2026-09-21)

Los instaladores se compilaron **localmente** en el servidor y están publicados en el directorio `frontend/public/descargas/` (servidos por el frontend web en `:5173`). Los **APK** están firmados y listos para instalar (Android 8+, targetSdk 36, tráfico HTTP habilitado).

| Archivo | Uso | Tamaño |
|---|---|---|
| `SysLab-Estudiante-1.0.0.apk` | App móvil del estudiante | 98 MB |
| `SysLab-Docente-1.1.0.apk` | App móvil del docente (v1.1.0 / code 3) | 81 MB |
| `SysLab-Lock-1.0.0.AppImage` | Escritorio Linux (no requiere instalación) | 94 MB |
| `SysLab-Lock-1.0.0.deb` | Escritorio Debian/Ubuntu | 66 MB |
| `SysLab-Lock-Setup-1.0.0.exe` | Escritorio Windows (instalador NSIS) | 72 MB |
| `SysLab-Lock-1.0.0-win.zip` | Escritorio Windows (portable) | 98 MB |

Descarga directa de cada archivo: `http://200.87.27.36:5173/descargas/<nombre>` · Checksum SHA-256 en `sha256sums.txt`.

**Paquetes fuentes por app:** `mobile/android/app/build/outputs/apk/release/app-release.apk` y `mobile-docente/...`; escritorio en `desktop/release/` (`SysLab Lock-1.0.0.AppImage`, `syslab-lock_1.0.0_amd64.deb`, `SysLab Lock-1.0.0-win.zip`).

**Detalles técnicos del build:**
- `android.package`: `com.uajms.syslab.estudiante` · `com.uajms.syslab.docente` (settings expuestas).
- URL de API por defecto en las apps cambiada a `http://200.87.27.36:5000` (antes `192.168.1.10:5000`).
- `AndroidManifest.xml` con `android:usesCleartextTraffic="true"` (necesario en Android 9+ para permitir tráfico HTTP hacia la IP pública en el piloto).
- **Cabeceras de seguridad HTTP en la API:**
  - `X-Content-Type-Options: nosniff` (previene ataques de MIME sniffing).
  - `X-Frame-Options: SAMEORIGIN` (protección contra clickjacking).
  - `X-XSS-Protection: 1; mode=block` (filtro XSS de navegadores heredados).
  - `Referrer-Policy: strict-origin-when-cross-origin` (limita fuga de rutas).
  - `Permissions-Policy: camera=*, microphone=(), geolocation=()` (permite cámara para escaneo de QR).
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (activo en conexiones seguras/proxy HTTPS).
  - `x-powered-by` deshabilitado para ocultar tecnología del servidor.
- **Tráfico HTTP vs HTTPS:**
  - Las aplicaciones móviles comunican por defecto con `http://200.87.27.36:5000` con cleartext traffic habilitado.
  - En entornos con dominio público, Nginx proxifica `https://sysfacultad.duckdns.org` y `https://registrocitren.duckdns.org` aplicando terminación TLS.
- Build local: Android SDK 36 + Gradle (`npx expo prebuild --platform android` + `gradlew assembleRelease`).
- Desktop: config `electron-builder.yml` recién añadida; `dist:linux` (AppImage + deb) OK; Windows con `installer.nsi` compilado vía `makensis` de Linux (**sin wine**): `SysLab-Lock-Setup-1.0.0.exe` (instalador por usuario + desinstalador) y `SysLab-Lock-1.0.0-win.zip` (portable).

## 3. Requisitos

- Teléfono **Android 8+** para instalar los APK (sección 2). Los usuarios instalan el APK directamente (permiso "orígenes desconocidos"), **ya no** requieren Expo Go.
- Para desarrollo (con hot reload): teléfono con **Expo Go** y conectado a una red que vea el servidor.
- Para la app de escritorio: PC de laboratorio con Linux (recomendado) o Windows.

Si el teléfono no ve la IP del servidor, usar la IP interna del equipo en lugar de la pública en la pantalla Configuración (ej. `http://<IP-LAN>:5000`).

## 4. App Estudiante (`mobile/`)

**Usuarios finales:** instalar `SysLab-Estudiante-1.0.0.apk` (sección 2). La URL del servidor ya viene configurada.

**Desarrollo / rebuild:**
```bash
cd /home/eliasdev/syslab2.0/mobile
npm install
npx expo start          # o: npx expo start --android
```
- Escanear el **QR** de la terminal **Expo Go** en el teléfono.
- Abrir la app → engranaje **Configuración** → escribir `http://200.87.27.36:5000` → **Guardar / Probar conexión**.
- Cerrar sesión e ingresar con el **RU** de un estudiante de DIC121 g1 y la contraseña `SysLab2026*`.
- Verificar pantallas: **Mi Horario** (debe mostrar Programación II · LAB-3), **Marcar Asistencia** (QR) y **Desbloquear** (código 2 dígitos).

> Rebuild del APK (hecho en este servidor): `npx expo prebuild --platform android` y `./gradlew assembleRelease` en `mobile/android/`. Antes de compilar verificar que el `AndroidManifest.xml` generado conserva `usesCleartextTraffic` (para HTTP). Firma: debug keystore (instalable en cualquier Android).

## 5. App Docente (`mobile-docente/`)

**Usuarios finales:** instalar `SysLab-Docente-1.1.0.apk` (sección 2, enlace compatible también como `SysLab-Docente-1.0.0.apk`).

**Desarrollo:**
```bash
cd /home/eliasdev/syslab2.0/mobile-docente
npm install
npx expo start
```
- Escanear el QR con Expo Go.
- Engranaje **Configuración** → `http://200.87.27.36:5000` → Guardar.
- Ingresar con un docente (ej. `jnarvaez`) / `SysLab2026*`.
- Verificar: **Mi Horario** (DIC121 g1 · LAB-3 · Vie/Sáb), **Iniciar sesión** (elige materia + laboratorio → genera el QR), **Sesiones** con detalle y nómina.

## 6. App de Escritorio / Bloqueo de equipos (`desktop/`)

**Desarrollo en la PC del laboratorio:**
```bash
cd /home/eliasdev/syslab2.0/desktop
npm install
npm run dev             # lanza la app con electron-vite
```

**Empaquetar instaladores (ya generados → sección 2):**
```bash
npm run dist:linux                       # release/SysLab Lock-1.0.0.AppImage + syslab-lock_1.0.0_amd64.deb
npx electron-builder --win zip           # release/SysLab Lock-1.0.0-win.zip (portable)
makensis installer.nsi                   # release/SysLab-Lock-Setup-1.0.0.exe (instalador, sin wine)
```
*La config de empaquetado está en `electron-builder.yml` (appId `com.uajms.syslab.lock`, targets linux AppImage/deb). El instalador Windows se compila con el `makensis` de Linux incluido en la caché de electron-builder (`~/.cache/electron-builder/nsis/nsis-3.0.4.1/linux/makensis`) usando `installer.nsi` — no requiere wine. El `.exe` es un Installer Nullsoft (PE32 UI), 64-bit en ejecución.*

**Configuración en la PC:**
1. Abrir la app → **Configuración** → URL de la API `http://200.87.27.36:5000`.
2. **Vincular equipo** con el código patrimonial de la PC (ej. `EQ-LAB3-01`) y el laboratorio (`LAB-3`).
   - La vinculación la hace alguien con rol **Jefe de Laboratorios / Admin** (`ecassal` / `admin`) — requiere permiso `equipos:crear`.
   - **Token de jefatura**: el campo no guarda el token; generar el JWT de `ecassal` con la clave piloto:
     ```bash
     curl -s -X POST http://200.87.27.36:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"username":"ecassal","password":"SysLab2026*"}'
     ```
     La respuesta JSON contiene el campo `token` (expira en ~8 h). Pegarlo en **SysLab Lock → Vincular → Token de administrador/jefatura**.
3. Cuando la PC debe bloquearse, la app llama a `bloquear`, muestra un **código de 2 dígitos** y en pantalla el estado **Bloqueada**.
4. El estudiante, desde su app, en **Desbloquear** introduce el código (o escanea el QR) → la PC se libera y la asistencia se registra como `DESBLOQUEO_PC`.

**Flujo validado vía API el 2026-09-21:** registrar `EQ-LAB3-01` → bloquear → código 69 → liberado por estudiante → asistencia `PRESENTE` (en sesión DIC121) → desafío pasa a `LIBERADO`.

## 7. Guion de la demostración (prueba piloto)

1. **Docente** abre la app docente, inicia sesión en **Programación II (DIC121)** lab **LAB-3** → aparece el **QR** de la sesión.
2. **Estudiante** (inscrito en DIC121 g1) abre la app estudiante → **Mi Horario** → escanea el QR en **Marcar Asistencia** → "Asistencia registrada".
3. (Opcional) La **app de escritorio** de la PC bloquea el equipo; el estudiante libera desde su app con el código de 2 dígitos.
4. **Docente** → **Sesiones** → nómina: el estudiante figura `PRESENTE` (o `ATRASO` si supera 15 min) → **Confirmar lista** → **Finalizar** la sesión.

## 8. Notas y solución de problemas

- **"Credenciales incorrectas"** en estudiantes: solo ocurría antes del rehash; si reaparece verificar que el usuario existe (`usuario = RU`) y la clave `SysLab2026*`.
- **Mi Horario vacío**: el estudiante debe estar inscrito en DIC121/DIC221/DIC226 con gestión 2026. Verificar: `SELECT codigo, grupo, COUNT(*) FROM inscripciones_materia ...`.
- **CORS**: la API permite orígenes `200.87.27.36:5000/5173`, `localhost`, `sysfacultad.duckdns.org` y cualquier `*.duckdns.org`. Para otra IP agregarla en `src/app.ts` (`allowedOrigins`) y reiniciar.
- **Datos de prueba**: la BD quedó limpia (0 bitácoras / 0 asistencias). El respaldo previo a la corrección está en `backups/syslab_db_pre-fix_20260921_092752.dump`.
- **Endpoints clave**: `POST /api/auth/login` · `GET /api/horarios/mi-horario` · `POST /api/bitacora/iniciar` · `GET /api/bitacora/sesion/:token` · `POST /api/bitacora/marcar-asistencia` · `GET /api/bitacora/:id/nomina` · `PATCH /api/bitacora/:id/finalizar` · `POST /api/desktop/registrar|bloquear|liberar`.