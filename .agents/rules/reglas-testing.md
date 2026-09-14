# SysLab 2.0 - Reglas de Agente para Testing de Módulos

Eres un agente experto en QA y Desarrollo Frontend enfocado en React, TypeScript y Vite. Tu objetivo es generar y auditar pruebas automatizadas para los módulos de SysLab 2.0 siguiendo estrictamente la arquitectura del workspace.

## 1. Contexto Obligatorio del Sistema
* **Propósito:** Plataforma web de administración, gestión de laboratorios, asignación de materias y control de accesos (Facultad de Ciencias de la Ingeniería - UAJMS).
* **Stack Frontend:** React + TypeScript + Vite + TailwindCSS.
* **Stack Backend:** API RESTful.

## 2. Reglas de Arquitectura y Tipado en Pruebas
* **Prohibido el uso de `any`:** Cada vez que generes mocks de datos (Laboratorios, Usuarios, Materias, Catálogos, Roles), debes buscar e importar la interfaz explícita correspondiente desde `frontend/src/interfaces/`.
* **Vistas Delgadas (`/views`):** Al escribir pruebas para componentes en `/views`, no simules peticiones de red directamente en el componente. Mockea las funciones de `/services` o los hooks personalizados de `/hooks`.
* **Estilos Visuales:** Si el test verifica clases o visibilidad, asegúrate de utilizar la paleta de colores oscura de TailwindCSS del proyecto (`bg-slate-900`, `bg-slate-800`, `text-slate-100`, etc.).

## 3. Restricciones de Idioma y UX
* **Idioma Estricto:** Toda la interfaz gráfica está en **Español**. Las consultas de Testing Library (`screen.getByText`, `screen.getByRole`, etc.) y las aserciones de mensajes de error deben buscar cadenas de texto estrictamente en español.
* **Estados Asíncronos Obligatorios:** Cada prueba de componente que realice carga de datos debe validar explícitamente:
  1. El estado inicial de indicador de carga (`loading` / "Cargando...").
  2. El renderizado exitoso de los datos simulados.
  3. El manejo de errores en caso de fallo de la API (mensajes de error legibles en español).

## 4. Estructura del Código de Prueba (Patrón AAA)
Escribe siempre los archivos de prueba (`.test.tsx` o `.spec.tsx`) utilizando Vitest y React Testing Library bajo la estructura **Arrange-Act-Assert**:

```typescript
// Ejemplo de estructura requerida:
import { render, screen, waitFor } from '@testing-library/react';
import { MiComponenteView } from './MiComponenteView';
import { IMateria } from '../../interfaces/IMateria'; // Importación obligatoria

describe('Módulo [Nombre] - Vista [Nombre]', () => {
  it('debe manejar el flujo asíncrono y los estados de carga correctamente', async () => {
    // 1. Arrange (Mocks basados en interfaces y simulación de hooks/services)
    
    // 2. Act (Render y verificación de estado Loading)
    render(<MiComponenteView />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();

    // 3. Assert (Verificación de resultados finales en Español)
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
  });
});
```

## 5. Limitaciones del Agente
* Preserva la estructura modular. No crees, modifiques ni elimines archivos o carpetas fuera del alcance de la tarea de testing solicitada.
* Revisa siempre los archivos existentes en `frontend/src/interfaces/` antes de proponer nuevos contratos de datos.

# Protocolo de Pruebas y Aseguramiento de Calidad por Módulo (DoD)

Este documento define las reglas obligatorias de ingeniería de software que deben cumplirse antes de declarar un módulo como "completado" y fusionarlo a producción (`main`).

## 1. Fase de Pruebas Unitarias (Unit Testing)
* **Aislamiento de Lógica:** Toda función de negocio pura (cálculos, validaciones de formato, parseo de datos) debe contar con pruebas unitarias utilizando Vitest o Jest.
* **Cobertura Mínima:** El código crítico del módulo debe alcanzar al menos un 80% de cobertura en líneas y ramas lógicas.
* **Mocks Estrictos:** Las dependencias externas (bases de datos, servicios HTTP de terceros) deben ser mockeadas obligatoriamente para aislar la unidad bajo prueba.

## 2. Fase de Pruebas de Integración (Integration Testing)
* **Contratos de API:** Los endpoints expuestos en Express deben validarse mediante Supertest, comprobando códigos de estado HTTP correctos (200, 201, 400, 401, 403, 404) y esquemas de respuesta estables.
* **Persistencia Transaccional:** Verificar que las operaciones con Prisma ORM manejen correctamente las transacciones y relaciones de integridad referencial en PostgreSQL.
* **Control de Acceso (RBAC):** Comprobar que los middlewares de rol restrinjan de manera efectiva el acceso a los recursos según la jerarquía institucional (Docente, Director, Jefe de Laboratorio, Administrador).

## 3. Fase de Pruebas End-to-End (E2E) y de Flujo Real
* **Recorrido del Usuario:** Validar el flujo completo desde la interfaz de usuario (React) hasta el backend, asegurando la correcta manipulación de estados y retroalimentación visual ante errores.
* **Gestión de Archivos y Recursos:** Comprobar que la subida, previsualización, reemplazo y eliminación física de archivos multimedia (comprobantes, avatares, respaldos) opere sin dejar elementos huérfanos en el servidor.
* **Enrutamiento y Proxy:** Verificar que los accesos a recursos estáticos o protegidos a través de Nginx no sufran redirecciones erróneas hacia el enrutador de la SPA.

## 4. Criterios de Clean Code y Revisiones de Calidad
* **Tipado Estricto:** Prohibido el uso del tipo `any` en TypeScript para interfaces de datos, payloads y respuestas de controladores.
* **Principio de Responsabilidad Única (SRP):** La lógica de negocio debe residir exclusivamente en servicios dedicados, manteniendo los controladores de Express y componentes de React limpios y desacoplados.
* **Manejo de Excepciones:** Todo error esperado debe ser capturado mediante clases personalizadas (`AppError`) y procesado por el middleware centralizado de errores.
* **Commits Atómicos:** El historial de cambios debe estructurarse bajo el estándar de *Conventional Commits* (`feat:`, `fix:`, `refactor:`, `test:`).