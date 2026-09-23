# Directiva de Implementación: Módulo de Fallas/Incidencias Docente (SysLab 2.0)

## 1. Contexto y Objetivos
Implementar dentro de la interfaz móvil para docentes (`mobile-docente`) un sistema integral para el **reporte de incidencias y fallas técnicas** en aulas y laboratorios, junto con una vista de **seguimiento en tiempo real** de la resolución del ticket. 

El resultado visual y de experiencia de usuario debe regirse bajo los estándares más altos de diseño institucional (Clean Institutional Luxury / Modern EdTech), manteniendo consistencia con la identidad visual de CITREN y la UAJMS.

---

## 2. Requerimientos Funcionales

### A. Registro Rápido de Incidencias (Mobile-First)
- **Selector de Ubicación:** Laboratorio o ambiente (detectado automáticamente si tiene reserva activa o seleccionable desde lista).
- **Identificador de Activo/Equipo:** Selector numérico de PC o categoría general (Proyector, Aire Acondicionado, Red/Internet, Periférico, Software).
- **Clasificación y Severidad:** 
  - Tipo: Hardware, Software, Red, Infraestructura.
  - Prioridad/Impacto: Leve (no interrumpe clase), Moderada, Crítica (impide continuar la sesión).
- **Descripción y Evidencia:** Campo de texto claro con placeholder guiado y opción de adjuntar captura o foto del error.
- **Feedback Inmediato:** Modal de confirmación con folio de seguimiento generado.

### B. Seguimiento y Trazabilidad de Tickets
- **Listado de Mis Reportes:** Pestaña con filtros por estado (`Pendiente`, `En Revisión`, `En Mantenimiento`, `Resuelto`).
- **Vista de Detalle con Stepper:** Línea de tiempo visual interactiva mostrando la progresión:
  1. Ticket Recibido.
  2. Asignado a Técnico / Auxiliar de Laboratorio.
  3. Diagnóstico en proceso.
  4. Solucionado y Verificado.
- **Historial de Notas:** Sección colapsable con observaciones o retroalimentación enviada por el encargado del laboratorio.

---

## 3. Criterios de Diseño UI/UX ("High Taste" Institucional)

Aplica el skill de diseño institucional más refinado disponible:
- **Paleta Institucional:** 
  - Primarios: Azul medianoche / marino profundo (`#0F172A`, `#1E293B`) y acentos corporativos CITREN (`#1D4ED8` o zafiro profundo).
  - Acentos de Estado: Indicadores refinados de severidad usando tonos esmeralda, ámbar cálido y carmesí no saturado con fondos traslúcidos (`bg-emerald-500/10 text-emerald-600`).
- **Componentes Táctiles (Touch-first Ergonomics):**
  - Botones y campos con tap-target mínimo de 44px.
  - Modales deslizables desde abajo (*Bottom Sheets*) para selección en pantallas móviles.
  - Efectos de microinteracción suaves (`active:scale-[0.98]`, transiciones de 150ms-200ms).
- **Estados de Carga y Vacíos:**
  - Sustituir spinners genéricos por **Skeletons** animados con shimmer effect.
  - Empty states ilustrados con íconos vectoriales sobrios cuando no haya tickets pendientes.
- **Tipografía y Legibilidad:**
  - Jerarquía clara con contraste WCAG AAA. Códigos de tickets en fuente monoespaciada (`font-mono text-xs`).

---

## 4. Requerimientos Técnicos y Arquitectura

1. **Backend & Base de Datos (Prisma + PostgreSQL):**
   - Verificar o crear el modelo `Incidencia` con relaciones a `Usuario` (docente reportante), `Laboratorio` y `Equipo`.
   - Enumerar estados: `PENDIENTE`, `EN_REVISION`, `EN_PROCESO`, `RESUELTO`, `DESCARTADO`.
   - Controladores y rutas con validación de tokens JWT:
     - `POST /api/incidencias`
     - `GET /api/incidencias/mis-reportes`
     - `GET /api/incidencias/:id`
2. **Frontend (React + Tailwind CSS + Lucide Icons):**
   - Vistas modulares en `frontend/src/views/docente/`:
     - `ReportarIncidenciaModal.tsx` o vista móvil dedicada.
     - `MisIncidenciasView.tsx`
     - `DetalleIncidenciaSheet.tsx`
   - Integración al menú de navegación inferior/drawer del docente.

---

## 5. Plan de Ejecución Solicitado

1. **Fase 1:** Inspeccionar schema de Prisma existente y controladores actuales. Añadir/migrar modelos si es necesario.
2. **Fase 2:** Construir endpoints REST con validación y tipado estricto en TypeScript.
3. **Fase 3:** Desarrollar componentes UI móviles con Tailwind aplicando las reglas de diseño institucional.
4. **Fase 4:** Realizar pruebas de compilación (`npm run build` en backend y frontend) y validar que no existan errores de tipos.
