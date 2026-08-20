---
trigger: always_on
---

# SysLab 2.0 - Reglas de Workspace

## Contexto del Sistema
SysLab 2.0 es una plataforma web para la administración, gestión de laboratorios, asignación de materias y control de accesos de la Facultad de Ciencias de la Ingeniería (UAJMS).

## Estructura del Proyecto
- **Frontend (`/frontend`):** React + TypeScript + Vite + TailwindCSS.
- **Backend (`/backend`):** API RESTful.

## Reglas para el Frontend (`/frontend/src/`)
- **Interfaces (`/interfaces`):** Define interfaces explícitas en TypeScript para cada entidad (Laboratorios, Usuarios, Materias, Catálogos, Roles).
- **Vistas (`/views`):** Mantén las vistas modulares y delgadas. Traslada la lógica de peticiones HTTP a `/services` o `/hooks`.
- **Estilos:** Usa clases utilitarias de TailwindCSS siguiendo la paleta de colores oscura (`bg-slate-900`, `bg-slate-800`, etc.).
- **Idioma:** Muestra los textos de la interfaz gráfica, menús y mensajes de error estrictamente en **Español**.

## Reglas de Asistencia de IA
- Revisa las interfaces existentes en `frontend/src/interfaces/` antes de crear nuevos componentes.
- Incluye siempre manejo de errores e indicadores de carga (`loading`) en las peticiones asíncronas a la API.
- Preserva la estructura modular del proyecto sin modificar carpetas fuera del alcance de la tarea solicitada.