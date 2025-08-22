
# ShiftFlow - Documentación del Proyecto

## 1. Introducción

ShiftFlow es una aplicación web diseñada para la planificación y gestión inteligente de turnos de personal en entornos hospitalarios. Su objetivo es optimizar la asignación de turnos, asegurar la cobertura adecuada de los servicios, respetar las preferencias y restricciones de los empleados, y facilitar la administración general del personal y los servicios del hospital. La aplicación utiliza inteligencia artificial para sugerir horarios y analizar informes.

## 2. Tecnologías Utilizadas

- **Frontend:**
    - **Next.js:** Framework de React para renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG), con App Router.
    - **React:** Biblioteca para construir interfaces de usuario.
    - **TypeScript:** Superset de JavaScript que añade tipado estático.
    - **Tailwind CSS:** Framework CSS "utility-first" para diseño rápido y responsivo.
    - **ShadCN UI:** Colección de componentes de UI reutilizables construidos sobre Tailwind CSS y Radix UI.
    - **Lucide Icons:** Biblioteca de iconos SVG.
    - **React Hook Form:** Para la gestión de formularios.
    - **Zod:** Para validación de esquemas.
    - **Recharts:** Para la visualización de gráficos en informes.
- **Backend & Base de Datos:**
    - **MySQL:** Base de datos relacional para almacenar toda la información de la aplicación (servicios, empleados, horarios, feriados, etc.).
    - **Next.js API Routes:** Como backend para interactuar con la base de datos MySQL.
- **Inteligencia Artificial:**
    - **Genkit (Firebase GenAI):** Framework para construir flujos de IA, conectándose a modelos de lenguaje grandes (LLMs) como Gemini para generación de texto y análisis.
- **Gestión de Estado del Servidor:**
    - **TanStack Query (React Query):** Para la obtención, cacheo, sincronización y actualización de datos del servidor.
- **Despliegue (Configuración por defecto):**
    - **Firebase App Hosting:** Para el despliegue de la aplicación Next.js.

## 3. Estructura del Proyecto

El proyecto sigue una estructura típica para aplicaciones Next.js con el App Router.

```
/
├── public/                 # Archivos estáticos públicos
├── src/
│   ├── ai/                 # Lógica relacionada con Inteligencia Artificial (Genkit)
│   │   ├── flows/          # Flujos de Genkit (ej. sugerir horarios, resumir informes)
│   │   ├── dev.ts          # Archivo para desarrollo local de Genkit
│   │   └── genkit.ts       # Configuración global de Genkit
│   ├── app/                # Rutas de la aplicación (App Router de Next.js)
│   │   ├── (nombre-ruta)/  # Carpetas de ruta
│   │   │   └── page.tsx    # Componente de página para la ruta
│   │   ├── globals.css     # Estilos globales y tema de ShadCN
│   │   └── layout.tsx      # Layout principal de la aplicación
│   ├── components/         # Componentes React reutilizables
│   │   ├── common/         # Componentes genéricos (ej. PageHeader)
│   │   ├── employees/      # Componentes específicos para la gestión de empleados
│   │   ├── holidays/       # Componentes específicos para la gestión de feriados
│   │   ├── layout/         # Componentes de estructura (ej. AppShell, SidebarNav)
│   │   ├── overview/       # Componentes para la vista de personal por servicio
│   │   ├── reports/        # Componentes para la sección de informes
│   │   ├── schedule/       # Componentes para la gestión de horarios
│   │   ├── services/       # Componentes específicos para la gestión de servicios
│   │   └── ui/             # Componentes de UI de ShadCN (botones, inputs, etc.)
│   ├── hooks/              # Hooks personalizados de React (ej. useToast, useMobile)
│   ├── lib/                # Utilidades, tipos, y lógica de negocio no-UI
│   │   ├── constants/      # Constantes de la aplicación (ej. opciones de turno)
│   │   ├── mysql/          # Lógica de interacción con la base de datos MySQL
│   │   ├── scheduler/      # Lógica del generador algorítmico de horarios
│   │   ├── types.ts        # Definiciones de TypeScript para tipos e interfaces
│   │   └── utils.ts        # Funciones de utilidad generales
│   ├── ...
├── .env                    # Variables de entorno (no versionado)
├── .gitignore
├── apphosting.yaml         # Configuración de Firebase App Hosting
├── components.json         # Configuración de ShadCN UI
├── next.config.ts          # Configuración de Next.js
├── package.json
├── tailwind.config.ts      # Configuración de Tailwind CSS
├── tsconfig.json           # Configuración de TypeScript
└── README.md
```

## 4. Módulos Principales y Funcionalidades

### 4.1. Gestión de Servicios
- Permite definir y administrar los diferentes servicios del hospital (ej. Emergencias, Cardiología).
- Cada servicio tiene reglas de dotación de personal (cuántos empleados por turno en días de semana y fines de semana/feriados), si habilita turno noche, reglas de consecutividad de trabajo/descanso, y un objetivo de fines de semana completos de descanso al mes.
- **Componentes Clave:** `src/app/services/page.tsx`, `src/components/services/service-form.tsx`, `src/components/services/service-list.tsx`.
- **Datos MySQL:** Tabla `servicios`. Ver `src/lib/mysql/services.ts` para detalles de la interacción.
- **Campos del Servicio:**
    - `name`: Nombre del servicio.
    - `description`: Descripción.
    - `enableNightShift`: Booleano que indica si se habilita el turno noche (N).
    - `staffingNeeds`: Objeto con la dotación requerida para turnos Mañana/Tarde/Noche en días de semana y fines de semana/feriados.
    - `consecutivenessRules`: Objeto con reglas sobre máximos/preferidos días de trabajo/descanso consecutivos y mínimo de descansos antes de volver a trabajar.
    - `targetCompleteWeekendsOff`: Número objetivo de fines de semana completos (Sábado + Domingo) de descanso que se busca dar a los empleados de este servicio por mes. El algoritmo de generación de horarios evalúa el cumplimiento de este objetivo (ver `evaluateGeneratedSchedule`) y lo refleja en la puntuación y violaciones. También intenta suavemente favorecer este objetivo durante la asignación de turnos de fin de semana.
    - `additionalNotes`: Notas adicionales o reglas específicas del servicio.

### 4.2. Gestión de Empleados
- Mantiene un directorio del personal del hospital.
- Cada empleado tiene información de contacto, roles, servicios a los que puede ser asignado.
- **Preferencias del Empleado (Sistema Unificado):**
    - **Turnos Fijos:** La configuración principal del horario de un empleado se gestiona a través de una grilla semanal explícita (Lunes a Domingo) donde se define si trabaja (Mañana, Tarde, Noche) o descansa. Esta es la única fuente de verdad para los patrones de trabajo.
    - **Plantillas de Horario:** Para facilitar la configuración, la interfaz permite aplicar plantillas (ej. "Lunes a Viernes (Mañana)") que rellenan la grilla semanal, la cual sigue siendo 100% editable.
    - **Preferencia de Feriados (`trabaja_feriados`):** Un booleano que indica si el empleado debe trabajar en días feriados que caen dentro de su jornada laboral. Si es `false` (por defecto), se le asignará un día libre.
    - **Preferencia de Fines de Semana (`prefiere_trabajar_fines_semana`):** Un booleano que se usa como criterio de desempate suave. Si se necesita personal en fin de semana, el algoritmo priorizará a los empleados flexibles que tengan esta opción marcada.
- **Asignaciones Especiales:** Permite registrar periodos de licencias (anuales, médicas, etc.) que tienen prioridad sobre cualquier otra regla de horario.
- **Componentes Clave:** `src/app/employees/page.tsx`, `src/components/employees/employee-form.tsx`, `src/components/employees/employee-preferences-form.tsx`.
- **Datos MySQL:** Tabla `empleados`. Ver `src/lib/mysql/employees.ts` para detalles de la interacción.

### 4.3. Gestión de Feriados
- Permite definir y organizar los días feriados, que son tenidos en cuenta por el planificador de horarios.
- **Componentes Clave:** `src/app/holidays/page.tsx`, `src/components/holidays/holiday-form.tsx`, `src/components/holidays/holiday-list.tsx`.
- **Datos MySQL:** Tabla `holidays`. Ver `src/lib/mysql/holidays.ts` para detalles de la interacción. Los feriados se almacenan con fechas en formato YYYY-MM-DD.

### 4.4. Generación y Gestión de Horarios
- **Núcleo de la aplicación.** Permite generar, visualizar y editar horarios de turnos.
- **Flujo Borrador-Publicado-Archivado:**
    - Los horarios se pueden trabajar como **borradores** (`draft`).
    - Un borrador puede ser **publicado** (`published`), convirtiéndose en el horario activo para un servicio/mes/año. Solo puede haber un horario publicado.
    - Al publicar un nuevo horario, la versión publicada anterior (si existía) se **archiva** (`archived`). Los borradores también se archivan si se publican o se sobrescriben por un nuevo borrador.
- **Generación Algorítmica:** El núcleo de la generación se encuentra en `src/lib/scheduler/generation.ts`, principalmente en la función `generateAlgorithmicSchedule`. Este algoritmo no solo crea un horario, sino que lo hace a través de un proceso iterativo, intentando múltiples veces (hasta 15 intentos por defecto) generar un horario que supere una puntuación objetivo. El proceso diario sigue un orden de prioridad estricto:
    1.  **Asignaciones Especiales:** Primero se procesan las licencias (LAO, LM) que tienen prioridad absoluta.
    2.  **Turnos Fijos:** Luego, se asignan los turnos de trabajo o descanso fijos definidos en las preferencias semanales de cada empleado. Si un empleado no debe trabajar en un feriado, se le asigna un día libre.
    3.  **Cobertura de Dotación (Empleados Flexibles):** Se utiliza un grupo de empleados "flexibles" (aquellos sin un turno fijo para ese día) para cubrir las necesidades de personal restantes para cada turno (Mañana, Tarde, Noche). Los empleados se seleccionan y ordenan mediante una lógica de clasificación compleja que considera:
        - El cumplimiento de los descansos mínimos requeridos y preferidos.
        - La continuación de bloques de trabajo preferidos.
        - La preferencia explícita de trabajar fines de semana (como criterio de desempate).
        - La equidad en el número total de turnos asignados en el mes.
    4.  **Asignación de Descanso:** Finalmente, a todos los empleados flexibles que no fueron necesarios para cubrir la dotación se les asigna un día de descanso.
- **Evaluación de Horarios:** Una vez que se genera un horario completo, la función `evaluateScheduleMetrics` (de `src/lib/scheduler/evaluation.ts`) lo analiza. Calcula una puntuación detallada (dividida en cumplimiento de reglas del servicio y bienestar del empleado) y genera una lista de violaciones de reglas (errores y advertencias). El generador selecciona el mejor horario de todos los intentos basándose en esta puntuación.
- **Edición Manual:** Los horarios (ya sean borradores o copias de uno publicado) se pueden modificar manualmente a través de una grilla interactiva, permitiendo ajustes finos.
- **Componentes Clave:** `src/app/schedule/page.tsx`, `src/components/schedule/shift-generator-form.tsx`, `src/components/schedule/InteractiveScheduleGrid.tsx`, `src/components/schedule/schedule-evaluation-display.tsx`.
- **Datos MySQL:** Tabla `horarios`. Ver `src/lib/mysql/monthlySchedules.ts` para la lógica de guardado, recuperación y estados de los horarios.

### 4.5. Informes y Analíticas
- Proporciona información sobre la utilización del personal y las operaciones.
- **Resumen de Informe con IA:** Utiliza Genkit para resumir texto de informes de turno proporcionado por el usuario.
- **Análisis Comparativo de Empleados:** Muestra métricas de trabajo y descanso para empleados en un rango de fechas y servicio, basándose en horarios publicados.
- **Análisis de Calidad de Horario:** Muestra la puntuación y violaciones de un horario publicado específico.
- **Componentes Clave:** `src/app/reports/page.tsx`, `src/components/reports/report-filters.tsx`, `src/components/reports/report-display.tsx`.
- **Flujos AI:** `src/ai/flows/summarize-shift-report.ts`.

### 4.6. Personal por Servicio
- Una vista simple para seleccionar un servicio y ver los empleados asignados a él.
- **Componentes Clave:** `src/app/service-overview/page.tsx`, `src/components/overview/ServiceEmployeeViewer.tsx`.

## 5. Interfaz de Usuario (UI) y Estilos

- La UI se construye con componentes **ShadCN UI**, que son personalizables y accesibles.
- Los estilos se manejan principalmente con **Tailwind CSS**.
- El tema de colores base (claro y oscuro) se define en `src/app/globals.css` usando variables HSL CSS.
- Los iconos son de **Lucide React**.

### 5.1. Componentes de Layout
- **`AppShell` (`src/components/layout/app-shell.tsx`):** Es el componente principal que define la estructura general de la aplicación. Incluye el `Sidebar` y el área de contenido principal. Utiliza el `SidebarProvider` y los componentes `Sidebar`, `SidebarRail`, `SidebarHeader`, `SidebarContent`, `SidebarFooter` y `SidebarInset` de ShadCN UI para lograr una navegación lateral colapsable y responsiva. También incluye un encabezado superior con un menú desplegable para el usuario.
- **`SidebarNav` (`src/components/layout/sidebar-nav.tsx`):** Contiene la lógica para renderizar los elementos de navegación dentro del `Sidebar`. Utiliza `SidebarMenu`, `SidebarMenuItem` y `SidebarMenuButton` de ShadCN UI. Resalta el ítem activo basándose en la ruta actual.

### 5.2. Componentes de UI Genéricos (ShadCN)
La aplicación utiliza una variedad de componentes de `src/components/ui/` que son en su mayoría componentes estilizados de ShadCN UI. Algunos de los más utilizados son:
- **`Button`**: Para acciones del usuario. (Ver documentación en `src/components/ui/button.tsx`)
- **`Card`**: Para agrupar contenido relacionado. (Ver documentación en `src/components/ui/card.tsx`)
- **`Dialog`**: Para modales y formularios emergentes. (Ver documentación en `src/components/ui/dialog.tsx`)
- **`Select`**: Para menús desplegables. (Ver documentación en `src/components/ui/select.tsx`)
- **`Table`**: Para mostrar datos tabulares. (Ver documentación en `src/components/ui/table.tsx`)
- **`Input`**, **`Textarea`**, **`Checkbox`**: Para formularios.
- **`Alert`**: Para mostrar mensajes importantes.
- **`Toast`**: Para notificaciones no intrusivas.
- La documentación detallada de cada uno de estos componentes se encuentra en la [documentación oficial de ShadCN UI](https://ui.shadcn.com/docs) y en los comentarios JSDoc dentro de cada archivo de componente en `src/components/ui/`.

### 5.3. Componentes Específicos de la Aplicación
Los componentes específicos de cada módulo (ej. `service-form.tsx`, `employee-list.tsx`, `InteractiveScheduleGrid.tsx`) se encuentran en sus respectivas carpetas dentro de `src/components/`. Estos combinan componentes de ShadCN UI y lógica de React para implementar las funcionalidades requeridas. Los comentarios JSDoc en cada archivo proporcionan más detalles.

## 6. Base de Datos MySQL
- **MySQL:** Utilizado como base de datos principal. Las tablas principales son:
    - `servicios`: Para los servicios del hospital. Ver `src/lib/mysql/services.ts`.
    - `empleados`: Para la información del personal. Ver `src/lib/mysql/employees.ts`.
    - `turnos_fijos`: Almacena las preferencias de turnos semanales de cada empleado.
    - `asignaciones_empleado`: Para licencias y otras asignaciones especiales.
    - `holidays`: Para los días feriados. Ver `src/lib/mysql/holidays.ts`.
    - `horarios`: Para los horarios generados (con sus estados `draft`, `published`, `archived`). Ver `src/lib/mysql/monthlySchedules.ts`.
- La configuración de la conexión a la base de datos se gestiona a través de variables de entorno.
- Las funciones CRUD para cada tabla están en `src/lib/mysql/`.

## 7. Genkit (Inteligencia Artificial)

- Genkit se utiliza para integrar funcionalidades de IA.
- La configuración se encuentra en `src/ai/genkit.ts`.
- Los flujos de IA (que definen prompts y lógica de interacción con LLMs) están en `src/ai/flows/`.
    - **`summarizeShiftReport`**: Resume texto de informes de turno. Ver `src/ai/flows/summarize-shift-report.ts`.
    - **`suggestShiftSchedule`**: Sugiere un horario de turnos basado en un prompt detallado. Ver `src/ai/flows/suggest-shift-schedule.ts`. Este flujo es más complejo, manejando la transformación de la salida de la IA a un formato estructurado y asegurando que los campos obligatorios estén presentes.
- Los flujos se llaman desde componentes de React (Server Components o a través de Server Actions implícitas en el patrón de Next.js).

## 8. Gestión de Estado

- **Estado del Servidor:** Se maneja con **TanStack Query (React Query)**. Esto incluye la obtención de datos, cacheo, y re-sincronización con Firestore.
- **Estado Local de UI:** Se maneja con hooks de React (`useState`, `useMemo`, etc.) dentro de los componentes.

## 9. Próximos Pasos y Mejoras Potenciales (Ejemplos)

- Implementación de autenticación de usuarios y roles.
- Interfaz de usuario para listar, previsualizar y gestionar borradores de horarios.
- Notificaciones (ej. cuando un horario está por vencer, o cuando se publica uno nuevo).
- Más tipos de informes y analíticas avanzadas.
- Integración con calendarios externos.
- Mejora del algoritmo de generación de horarios para considerar más preferencias de forma explícita (ej. `eligibleForDayOffAfterDuty`).
- Mejorar el algoritmo para que intente *activamente* cumplir con el objetivo `targetCompleteWeekendsOff` durante la asignación de turnos, no solo evaluarlo (esto ya se ha empezado a favorecer suavemente en la asignación actual).

---

_Este documento se actualizará a medida que la aplicación evolucione._
