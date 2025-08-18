# Estructura Real de Base de Datos - Correcciones Aplicadas

## 🎯 Problema Resuelto
**Error**: `Unknown column 'ep.id_empleado' in 'field list'`
**Causa**: La API esperaba una estructura diferente a la real de la base de datos

## 📊 Estructura Real Identificada

### Tabla `empleados`
```sql
CREATE TABLE `empleados` (
  `id_empleado` int(11) NOT NULL AUTO_INCREMENT,
  `id_servicio` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `email_empleado` varchar(50) NOT NULL,
  `elegible_franco_pos_guardia` tinyint(1) DEFAULT '0',
  `prefiere_trabajar_fines_semana` tinyint(1) DEFAULT '0',
  `disponibilidad_general` text,
  `restricciones_especificas` text,
  `trabaja_feriados` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_empleado`)
)
```

### Tabla `empleadopreferencias`
```sql
CREATE TABLE `empleadopreferencias` (
  `employeeId` int(11) NOT NULL,
  `eligibleForDayOffAfterDuty` tinyint(1) DEFAULT NULL,
  `prefersWeekendWork` tinyint(1) DEFAULT NULL,
  `fixedWeeklyShiftTiming` varchar(255) DEFAULT NULL,
  `workPattern` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`employeeId`)
)
```

### Tabla `users` (Sistema de autenticación)
```sql
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role_id` varchar(50) NOT NULL,
  `service_id` int(11) DEFAULT NULL,  -- ¡Importante!
  `employee_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
)
```

## 🛠️ Correcciones Aplicadas

### 1. Consulta Principal Corregida
**Antes:**
```sql
SELECT e.id_empleado, e.nombre, e.trabaja_feriados
FROM empleados e
WHERE e.id_servicio = ?
```

**Después:**
```sql
SELECT 
  e.id_empleado,
  e.nombre,
  e.email_empleado,
  COALESCE(e.trabaja_feriados, 0) as trabaja_feriados,
  COALESCE(e.elegible_franco_pos_guardia, 0) as elegible_franco_pos_guardia,
  COALESCE(e.prefiere_trabajar_fines_semana, 0) as prefiere_trabajar_fines_semana,
  e.disponibilidad_general,
  e.restricciones_especificas
FROM empleados e
WHERE e.id_servicio = ?
```

### 2. Consulta de Preferencias Adicionales
```sql
SELECT 
  ep.employeeId as id_empleado,
  ep.eligibleForDayOffAfterDuty as elegible_franco_pos_guardia_adicional,
  ep.prefersWeekendWork as prefiere_trabajar_fines_semana_adicional,
  ep.fixedWeeklyShiftTiming,
  ep.workPattern
FROM empleadopreferencias ep
INNER JOIN empleados e ON ep.employeeId = e.id_empleado
WHERE e.id_servicio = ?
```

### 3. ServiceId Flexible
```typescript
// Maneja tanto serviceId como service_id
const serviceId = session.user.serviceId || session.user.service_id;
```

### 4. Combinación de Preferencias
```typescript
// Usa empleados como fuente principal, empleadopreferencias como override
elegible_franco_pos_guardia: preferenciaAdicional?.elegible_franco_pos_guardia_adicional ?? Boolean(emp.elegible_franco_pos_guardia),
prefiere_trabajar_fines_semana: preferenciaAdicional?.prefiere_trabajar_fines_semana_adicional ?? Boolean(emp.prefiere_trabajar_fines_semana),
```

## 📋 Tablas Utilizadas Correctamente

### ✅ Tablas Principales
- `empleados` - Datos básicos y preferencias principales
- `servicios` - Información de servicios
- `turnos_fijos` - Turnos fijos de empleados
- `asignaciones_empleado` - Asignaciones temporales
- `tipos_asignacion` - Tipos de asignaciones
- `users` - Sistema de autenticación

### ✅ Tablas Opcionales
- `empleadopreferencias` - Preferencias adicionales (override)

## 🎯 Resultado Esperado

La API ahora debería devolver:
```json
[
  {
    "id_empleado": 1,
    "nombre": "Juan Pérez",
    "email_empleado": "juan@hospital.com",
    "trabaja_feriados": true,
    "elegible_franco_pos_guardia": false,
    "prefiere_trabajar_fines_semana": true,
    "disponibilidad_general": "disponible",
    "restricciones_especificas": "",
    "fixedWeeklyShiftTiming": null,
    "workPattern": null,
    "mes": 8,
    "anio": 2025,
    "turnos_fijos": [...],
    "asignaciones": [...]
  }
]
```

## 🔍 Logs Esperados

```
🔍 [PREFERENCES API] Iniciando petición...
👤 [PREFERENCES API] Usuario: {...}
📅 [PREFERENCES API] Parámetros: { month: '8', year: '2025', serviceId: 1 }
🔍 Buscando empleados para serviceId: 1
🔍 Empleados encontrados: 8
🔍 Buscando turnos fijos...
🔍 Turnos fijos encontrados: 15
🔍 Buscando asignaciones...
🔍 Asignaciones encontradas: 1
🔍 Buscando preferencias adicionales...
🔍 Preferencias adicionales encontradas: 0
✅ Devolviendo preferencias completas: 8 empleados
```

## ✅ Estado Actual

- ✅ **Estructura de DB identificada** correctamente
- ✅ **API corregida** para usar nombres de campos reales
- ✅ **Consultas optimizadas** para la estructura existente
- ✅ **Manejo de errores** mejorado
- ✅ **Logs detallados** para debugging

La API ahora debería funcionar correctamente con tu estructura real de base de datos.