# Genio - Sistema de Gestión de Horarios Hospitalarios

## 1. Propósito del Proyecto

**Genio** es una aplicación web diseñada para la gestión avanzada de horarios y personal en un entorno hospitalario. Su objetivo principal es automatizar y simplificar la planificación de turnos, la gestión de permisos y las preferencias de los empleados, asegurando al mismo tiempo el cumplimiento de las complejas reglas operativas del hospital.

La aplicación está dirigida a:
-   **Administradores de hospital:** Para una visión y gestión global.
-   **Jefes de servicio:** Para la planificación y administración de sus equipos.
-   **Empleados:** Para consultar sus horarios y gestionar sus preferencias y permisos.

## 2. Stack Tecnológico

-   **Framework:** Next.js (~15.2.3)
-   **Lenguaje:** TypeScript
-   **UI:** React (~18.3.1) con Radix UI y shadcn/ui
-   **Estilos:** Tailwind CSS
-   **Gestión de Estado:** React Hooks y TanStack React Query para datos de servidor.
-   **Formularios:** React Hook Form con Zod para validación.
-   **Autenticación:** Next-Auth
-   **Base de Datos:** MySQL

## 3. Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:
-   [Node.js](https://nodejs.org/) (versión 18.x o superior recomendada)
-   [npm](https://www.npmjs.com/) (generalmente viene con Node.js)
-   Una instancia de base de datos **MySQL** en ejecución.

## 4. Instalación y Ejecución

1.  **Clonar el repositorio (si es necesario):**
    ```bash
    git clone <url-del-repositorio>
    cd genio-master
    ```

2.  **Instalar dependencias:**
    Ejecuta el siguiente comando para instalar todas las dependencias del proyecto.
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y añade las credenciales de conexión a tu base de datos MySQL.
    ```env
    DATABASE_HOST=tu_host
    DATABASE_USER=tu_usuario
    DATABASE_PASSWORD=tu_contraseña
    DATABASE_NAME=tu_base_de_datos
    NEXTAUTH_SECRET=tu_secreto_nextauth
    NEXTAUTH_URL=http://localhost:9002
    ```

4.  **Ejecutar la aplicación en modo desarrollo:**
    Este comando inicia el servidor de desarrollo.
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en **http://localhost:9002**.

## 5. Comandos Útiles

-   **Compilar para producción:**
    ```bash
    npm run build
    ```

-   **Iniciar el servidor de producción:**
    ```bash
    npm run start
    ```

-   **Análisis de código (Linting):**
    Ejecuta el linter para detectar problemas de calidad y estilo en el código.
    ```bash
    npm run lint
    ```

-   **Verificación de tipos de TypeScript:**
    Asegura que no hay errores de tipado en el proyecto.
    ```bash
    npm run typecheck
    ```