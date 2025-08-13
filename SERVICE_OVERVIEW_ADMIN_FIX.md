# Corrección del Módulo "Personal por Servicio" para Administradores

## Problema Identificado
El administrador no podía ver empleados por servicio porque:
1. El API `/api/employees` no devolvía el campo `id_servicio` necesario
2. El componente intentaba acceder a `tipo_patron_trabajo` que no existe
3. Faltaba funcionalidad para asignar/desasignar empleados

## Cambios Realizados

### 1. API de Empleados (`src/app/api/employees/route.ts`)
**Antes:**
```sql
SELECT 
  e.id_empleado,
  e.nombre,
  e.email_empleado as email,
  s.nombre_servicio,
  e.trabaja_feriados
```

**Después:**
```sql
SELECT 
  e.id_empleado,
  e.id_servicio,
  e.nombre,
  e.email_empleado,
  e.trabaja_feriados,
  e.elegible_franco_pos_guardia,
  e.prefiere_trabajar_fines_semana,
  e.disponibilidad_general,
  e.restricciones_especificas,
  s.nombre_servicio
```

### 2. Componente ServiceEmployeeViewer (`src/components/overview/ServiceEmployeeViewer.tsx`)

#### Cambios principales:
- ✅ Removido acceso a `tipo_patron_trabajo` inexistente
- ✅ Agregado manejo correcto de empleados asignados/sin asignar
- ✅ Agregada funcionalidad para asignar empleados (solo administradores)
- ✅ Agregada funcionalidad para desasignar empleados (solo administradores)
- ✅ Mejorada visualización con badges de preferencias
- ✅ Agregados permisos y autenticación

#### Nuevas funcionalidades:
- **Empleados Asignados**: Lista empleados del servicio seleccionado
- **Empleados Sin Asignar**: Lista empleados disponibles para asignar (solo admins)
- **Botones de Acción**: Asignar/Desasignar empleados (solo admins)

### 3. Nuevas APIs de Administración

#### `/api/admin/employees/assign/route.ts`
- Permite asignar empleados a servicios
- Solo usuarios con permiso `MANAGE_ALL_EMPLOYEES`
- Valida que el empleado no esté ya asignado

#### `/api/admin/employees/unassign/route.ts`
- Permite desasignar empleados de servicios
- Solo usuarios con permiso `MANAGE_ALL_EMPLOYEES`
- Establece `id_servicio = NULL`

### 4. Página Service Overview (`src/app/service-overview/page.tsx`)
- ✅ Agregada protección de ruta con `ProtectedRoute`
- ✅ Requiere permiso `VIEW_ALL_EMPLOYEES`
- ✅ Agregado botón de logout
- ✅ Mejorado layout

## Permisos Requeridos

### Para Ver Empleados por Servicio:
- `VIEW_ALL_EMPLOYEES` (admin_hospital, super_admin)

### Para Asignar/Desasignar Empleados:
- `MANAGE_ALL_EMPLOYEES` (admin_hospital, super_admin)

## Flujo de Uso

### Para Administradores:
1. Acceder a "Personal por Servicio" desde el menú
2. Seleccionar un servicio del dropdown
3. Ver empleados asignados al servicio
4. Ver empleados sin asignar (sección adicional)
5. Usar botones "Asignar" para agregar empleados al servicio
6. Usar botones "Remover" para quitar empleados del servicio

### Para Otros Usuarios:
- Solo pueden ver empleados asignados (sin funcionalidad de asignación)

## Características de la Interfaz

### Empleados Asignados:
- Avatar con iniciales
- Nombre y email
- Badges de preferencias (Trabaja Feriados, Prefiere Fines de Semana, Franco Post-Guardia)
- Botón "Remover" (solo admins)

### Empleados Sin Asignar:
- Fondo amarillo claro para distinguir
- Badge "Sin Asignar"
- Botón "Asignar" (solo admins)
- Solo visible para administradores

## Validaciones Implementadas

### Asignación:
- ✅ Empleado debe existir
- ✅ Empleado no debe estar ya asignado a otro servicio
- ✅ Servicio debe existir
- ✅ Usuario debe tener permisos

### Desasignación:
- ✅ Empleado debe existir
- ✅ Usuario debe tener permisos

## Estado Actual
- ✅ APIs corregidas y funcionando
- ✅ Componente actualizado con nueva funcionalidad
- ✅ Permisos implementados correctamente
- ✅ Interfaz mejorada y funcional
- ✅ Validaciones implementadas

El módulo "Personal por Servicio" ahora funciona correctamente para administradores, permitiendo tanto visualizar como gestionar la asignación de empleados a servicios.