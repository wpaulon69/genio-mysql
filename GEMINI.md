# Guía de Desarrollo del Proyecto Genio

Este documento sirve como guía para mantener un desarrollo consistente, limpio y de alta calidad en el proyecto, especialmente al colaborar con asistentes de IA como Gemini.

## 1. Sobre este Proyecto

- **Propósito Principal:** Aplicación web para la gestión de horarios y personal en un entorno hospitalario.
- **Objetivo:** Automatizar y simplificar la planificación de turnos, la gestión de permisos y las preferencias de los empleados, asegurando el cumplimiento de las reglas operativas.
- **Audiencia:** Administradores de hospital, jefes de servicio y empleados.

## 2. Stack Tecnológico

- **Framework:** Next.js (~15.2.3) con Turbopack
- **Lenguaje:** TypeScript
- **UI:** React (~18.3.1), Radix UI, shadcn/ui (inferido por `components.json` y dependencias)
- **Estilos:** Tailwind CSS
- **Gestión de Estado:** React Hooks (`useState`, `useContext`). Para datos de servidor, se utiliza `@tanstack/react-query`.
- **Formularios:** `react-hook-form` con `zod` para validación.
- **Autenticación:** `next-auth`
- **Base de Datos:** MySQL (`mysql2`)
- **Linting y Calidad de Código:** Next.js Lint (`next lint`) y TypeScript (`tsc --noEmit`).

## 3. Convenciones del Proyecto

### Idioma
- **Código:** Todo el código (variables, funciones, clases, etc.) debe estar en **inglés**.
- **Commits y Comentarios:** Los mensajes de commit y los comentarios que explican lógica de negocio compleja deben estar en **español** para mantener la consistencia con el dominio del problema.
- **Texto de UI:** Todo el texto visible para el usuario debe estar en **español**.

### Estilo de Código y Formateo
- **Formato:** Se asume el uso de Prettier. Formatea tu código antes de hacer un commit.
- **Linting:** Ejecuta `npm run lint` para detectar problemas de calidad y estilo.
- **Tipado:** El código debe ser fuertemente tipado con TypeScript. Evita el uso de `any` a menos que sea estrictamente necesario y justificado.

### Componentes de React
- **Estructura:** Crea los componentes en `src/components/`. Utiliza la sintaxis de `PascalCase` para los nombres de archivo y componentes (ej. `MiComponente.tsx`).
- **Funcionalidad:** Usa componentes funcionales con Hooks.
- **UI:** Prioriza el uso de los componentes de Radix/shadcn (`@radix-ui/*`) para construir la interfaz y mantener la consistencia visual.

### Lógica de Backend y API
- **Rutas API:** La lógica del servidor reside en las rutas API de Next.js (probablemente en `src/app/api/`).
- **Acceso a Datos:** Centraliza la lógica de acceso a la base de datos en funciones o módulos específicos para ser reutilizados. No escribas consultas SQL directamente en los endpoints de la API.
- **Validación:** Valida todos los datos de entrada de las API usando `zod`.

### Base de Datos
- **No hacer cambios manuales:** Nunca modifiques el esquema de la base de datos de producción directamente.
- **Migraciones:** Para cualquier cambio en el esquema, crea un nuevo script de migración en la carpeta `database/migrations/`.

### Pruebas
- **Verificación de Tipos:** Siempre ejecuta `npm run typecheck` para asegurar que no hay errores de TypeScript.
- **Nuevas Pruebas:** Aunque no se observa un framework de testing configurado, para nueva funcionalidad se recomienda usar Jest con React Testing Library. Los archivos de prueba deben ubicarse junto a los componentes que prueban (ej. `MiComponente.test.tsx`).

### Mensajes de Commit
Usa el estándar de Commits Convencionales en español. El formato es `<tipo>(<ámbito>): <descripción>`.

- **`feat`**: Para nuevas funcionalidades.
  - `feat(horarios): agregar generación de PDF del turno semanal`
- **`fix`**: Para correcciones de bugs.
  - `fix(auth): corregir redirección después del login`
- **`docs`**: Para cambios en la documentación.
- **`style`**: Para cambios de formato y estilo que no afectan la lógica.
- **`refactor`**: Para cambios en el código que no corrigen un bug ni añaden una funcionalidad.
- **`test`**: Para añadir o corregir pruebas.
- **`chore`**: Para tareas de mantenimiento, build, etc.
  - `chore(deps): actualizar dependencias de desarrollo`

## 4. Comandos Clave

- **`npm run dev`**: Inicia el servidor de desarrollo en `http://localhost:9002`.
- **`npm run build`**: Compila la aplicación para producción.
- **`npm run start`**: Inicia el servidor de producción.
- **`npm run lint`**: Ejecuta el linter para analizar el código.
- **`npm run typecheck`**: Verifica los tipos de TypeScript en todo el proyecto.

## 5. Flujo de Trabajo para Cambios

1.  **Sincronizar:** Asegúrate de tener la última versión de la rama principal.
2.  **Crear Rama:** Crea una nueva rama descriptiva desde la principal: `git checkout -b feat/nombre-funcionalidad` o `git checkout -b fix/descripcion-bug`.
3.  **Desarrollar:** Implementa los cambios siguiendo las convenciones de este documento.
4.  **Verificar:** Antes de hacer commit, ejecuta las verificaciones locales:
    - `npm run lint`
    - `npm run typecheck`
5.  **Commit:** Realiza commits atómicos y claros usando la convención de mensajes.
6.  **Push y Pull Request:** Sube tu rama al repositorio y crea un Pull Request hacia la rama principal, explicando los cambios realizados.
