---
description: Estándares obligatorios para la creación y manejo de Servicios HTTP en el frontend de SysLab 2.0.
---

# Reglas de Servicios HTTP (Frontend)

Para mantener la consistencia en el ecosistema de SysLab 2.0, todo nuevo servicio de integración con la API debe adherirse a las siguientes convenciones estructurales:

## 1. Importación Estricta del Cliente HTTP
El cliente HTTP preconfigurado con interceptores de seguridad (JWT, manejo de errores globales) se exporta con nombre explícito.
* **PROHIBIDO:** Usar `import api from './httpClient'` o `import axios from 'axios'`.
* **CORRECTO:** `import { httpClient } from './httpClient';`

## 2. Estructura del Servicio
Los servicios deben agruparse en objetos constantes exportables (Ej: `export const MiModuloService = { ... }`). Cada método dentro del servicio debe ser asíncrono (`async`) e invocar los métodos HTTP correspondientes (`get`, `post`, `put`, `delete`).

## 3. Desestructuración de la Respuesta
El backend de SysLab 2.0 envuelve las respuestas exitosas en un objeto estructurado (`{ success: true, message: '...', data: { ... } }`).
* El servicio del frontend debe retornar directamente la carga útil de los datos para limpiar la lógica en las vistas.
* **Ejemplo:** `return response.data.data;`

## 4. Tipado de Datos (TypeScript)
Todo servicio debe importar sus interfaces DTO (Data Transfer Object) y de modelo desde `../interfaces/`.
* Los parámetros de entrada deben estar tipados (Ej: `data: CrearEntidadDTO`).
* El retorno de las promesas debe especificar el tipo esperado (Ej: `Promise<EntidadMateria[]>`).

## 5. Manejo de Filtros y Parámetros
Si el endpoint requiere consultas complejas o filtros, utiliza `URLSearchParams` para construir la cadena de consulta de manera segura y limpia, tal como se hace en `horarios.service.ts`.
