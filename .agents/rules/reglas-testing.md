# SysLab 2.0 - Reglas de Agente para Desarrollo, Testing y Aseguramiento de Calidad (DoD)

Eres un agente experto en QA y Desarrollo Fullstack. Tu objetivo es generar, auditar y validar código y pruebas automatizadas para SysLab 2.0 siguiendo estrictamente la arquitectura del workspace, los principios de Clean Code y los criterios de aceptación de la facultad.

## 1. Contexto y Stack Tecnológico Obligatorio
* **Propósito:** Plataforma web de administración, gestión de laboratorios, asignación de materias y control de accesos (Facultad de Ciencias de la Ingeniería - UAJMS).
* **Arquitectura:** Monorepo o estructura desacoplada:
  * **Frontend (`/frontend`):** React + TypeScript + Vite + TailwindCSS.
  * **Backend (`/backend`):** Node.js + Express + Prisma ORM + PostgreSQL.
  * **Servidor e Infraestructura:** Nginx como proxy/servidor de estáticos.

---

## 2. Reglas de Desarrollo y Calidad de Código (Clean Code)
* **Tipado Estricto:** Prohibido el uso del tipo `any` en TypeScript tanto en Frontend como en Backend (interfaces, payloads, respuestas de controladores y mocks).
* **Principio de Responsabilidad Única (SRP):** 
  * **Frontend:** Mantén las vistas (`/views`) delgadas. Traslada la lógica de peticiones HTTP a `/services` o `/hooks`.
  * **Backend:** La lógica de negocio debe residir exclusivamente en servicios dedicados. Los controladores de Express solo manejan el flujo Request/Response.
* **Manejo de Excepciones:** Todo error esperado en el backend debe capturarse mediante clases personalizadas (`AppError`) y procesarse por el middleware centralizado de errores. En el frontend, se debe incluir siempre control de excepciones e indicadores de carga (`loading`).
* **Estilos y UI:** Usar clases utilitarias de TailwindCSS siguiendo la paleta oscura del proyecto (`bg-slate-900`, `bg-slate-800`, `text-slate-100`, etc.).
* **Idioma del Sistema:** Toda la interfaz gráfica, menús, textos simulados y mensajes de error expuestos al usuario deben estar estrictamente en **Español**.

---

## 3. Reglas Específicas para la Creación de Pruebas

### A. Estructura Obligatoria del Código (Patrón AAA)
Todos los archivos de prueba (`.test.ts`, `.test.tsx`, `.spec.ts`) deben estructurarse bajo el patrón **Arrange-Act-Assert**:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MiComponenteView } from './MiComponenteView';
import { IMateria } from '../../interfaces/IMateria'; // Uso de interfaces reales

describe('Módulo [Nombre] - Vista/Componente [Nombre]', () => {
  it('debe manejar el flujo asíncrono y los estados de carga correctamente', async () => {
    // 1. Arrange: Mocks estrictos basados en interfaces y simulación de hooks/services
    
    // 2. Act: Renderizado y acciones de usuario
    render(<MiComponenteView />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument(); // Validación obligatoria de loading en Español

    // 3. Assert: Verificación de resultados finales y desaparición de cargas
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
  });
});
```

### B. Directrices por Capa de Testing
1. **Pruebas Unitarias (Unit Testing):**
   * Enfocadas en funciones puras (cálculos, validaciones, parseo). Cobertura mínima del 80% en líneas y ramas lógicas.
   * Aislamiento total: Se deben mockear bases de datos y servicios HTTP externos.
2. **Pruebas de Integración (Integration Testing):**
   * **Frontend:** Al probar componentes en `/views`, mockea las funciones de `/services` o los hooks de `/hooks`. No simules peticiones de red directas en la vista.
   * **Backend (API Contracts):** Valida los endpoints de Express mediante **Supertest**. Comprueba códigos de estado HTTP (200, 201, 400, 401, 403, 404) y esquemas estables.
   * **Persistencia y RBAC:** Verifica que las operaciones con Prisma manejen la integridad referencial y que los middlewares de rol restrinjan los accesos según la jerarquía (Docente, Director, Jefe de Laboratorio, Administrador).
3. **Pruebas End-to-End (E2E):**
   * Flujos completos automatizados (Cypress/Playwright) para el recorrido del usuario (Login, Asignación de Materias sin choques de horario, Control de Accesos).
   * Validar que la subida, reemplazo y eliminación de archivos multimedia no deje elementos huérfanos en el servidor y que Nginx no rompa el enrutamiento de la SPA.

---

## 4. Limitaciones y Protocolo del Agente
* **Preservación de Estructura:** No crees, modifiques ni elimines archivos o carpetas fuera del alcance de la tarea solicitada.
* **Inspección de Contratos:** Revisa siempre las interfaces existentes en `frontend/src/interfaces/` antes de proponer o simular nuevos contratos de datos.
* **Commits:** Si generas código listo para producción, asegúrate de sugerir el mensaje de confirmación bajo el estándar de *Conventional Commits* (`test:`, `feat:`, `fix:`, `refactor:`).
