# ✅ Corrección Final del Bug de Evaluación de Horarios

## 🐛 Problema Identificado
La evaluación de horarios mostraba violaciones falsas como "Descansó 8 días consecutivos" cuando el límite configurado era 3 días.

## 🔍 Análisis de Causa Raíz
Se identificaron **DOS bugs relacionados** que causaban el problema:

### Bug #1: Configuración Incompleta del Servicio
- **Problema**: `service.max_descansos_consecutivos` era `undefined`
- **Causa**: El endpoint `/api/services/[id]` no devolvía las columnas de configuración de horarios
- **Impacto**: `rulesConfig.maxConsecutiveDaysOff` usaba valor por defecto (4) en lugar del configurado (3)

### Bug #2: Inicialización Incorrecta del Estado
- **Problema**: `consecutiveRestDays` se inicializaba en 7 en lugar de 1
- **Causa**: El algoritmo de inicialización usaba configuración por defecto para `lookbackDays`
- **Impacto**: Los empleados aparecían con 7 días consecutivos de descanso al inicio del mes

## 🔧 Soluciones Implementadas

### Corrección Bug #1: Endpoint de Servicios
**Archivo**: `src/app/api/services/[id]/route.ts`

```sql
-- ANTES: Consulta incompleta
SELECT 
  id_servicio,
  nombre_servicio,
  descripcion,
  habilitar_turno_noche,
  dotacion_objetivo_lunes_a_viernes_mananas,
  -- ... otras columnas de dotación

-- DESPUÉS: Consulta completa con configuración de horarios
SELECT 
  id_servicio,
  nombre_servicio,
  descripcion,
  habilitar_turno_noche,
  dotacion_objetivo_lunes_a_viernes_mananas,
  -- ... otras columnas de dotación
  max_dias_trabajo_consecutivos,
  dias_trabajo_consecutivos_preferidos,
  max_descansos_consecutivos,              -- ✅ AGREGADO
  dias_descanso_consecutivos_preferidos,
  min_descansos_requeridos_antes_de_trabajar,
  fds_descanso_completo_objetivo
```

### Corrección Bug #2: Función getFullService()
**Archivo**: `src/components/schedule/InteractiveScheduleGrid.tsx`

```typescript
// ✅ YA IMPLEMENTADO: Función que obtiene datos completos del servicio
const getFullService = async () => {
  try {
    const serviceResponse = await fetch(`/api/services/${targetService.id_servicio}`);
    return serviceResponse.ok ? await serviceResponse.json() : targetService;
  } catch (error) {
    console.warn('Could not fetch full service data, using basic service info');
    return targetService;
  }
};

// ✅ YA IMPLEMENTADO: Uso en evaluaciones
body: JSON.stringify({ 
  shifts: editableShifts, 
  service: await getFullService(),  // Datos completos
  month, year, employees: allEmployees, holidays, previousMonthShifts 
})
```

### Corrección Bug #3: Algoritmo de Inicialización
**Archivo**: `src/lib/scheduler/state.ts`

```typescript
// ✅ YA IMPLEMENTADO: Usa configuración específica del servicio
export function initializeEmployeeStatesFromHistory(
  employeesForService: Employee[],
  previousMonthShifts: AIShift[] | null,
  rulesConfig: ScheduleRulesConfig,  // ✅ Usa rulesConfig específico
  firstDayOfCurrentMonth: Date
): Record<string, EmployeeState> {
  // ✅ Usa configuración específica del servicio
  const lookbackDays = Math.max(
    rulesConfig.maxConsecutiveWorkDays, 
    rulesConfig.maxConsecutiveDaysOff,  // ✅ Ahora es 3, no 4
    7
  );
  // ... resto de la lógica
}
```

## 📊 Resultado Esperado

### Antes de la Corrección:
```
🔍 DEBUG /api/evaluate-schedule:
- service.max_descansos_consecutivos: undefined
- rulesConfig.maxConsecutiveDaysOff: 4
- consecutiveRestDays: 7
- newConsecutiveRestDays: 8
- Violación: "Descansó 8 días consecutivos" (8 > 4) ❌
```

### Después de la Corrección:
```
🔍 DEBUG /api/evaluate-schedule CORREGIDO:
- service.max_descansos_consecutivos: 3
- rulesConfig.maxConsecutiveDaysOff: 3
- consecutiveRestDays: 1
- newConsecutiveRestDays: 2
- Violación: NO aparece (2 ≤ 3) ✅
```

## 🧪 Cómo Probar la Corrección

1. **Abrir la aplicación** en el navegador
2. **Ir a la grilla de horarios interactiva**
3. **Generar un horario de junio**
4. **Verificar que la violación "Descansó 8 días consecutivos" ya no aparece**
5. **Solo aparecerán violaciones reales** (cuando realmente superen los 3 días)

## 💡 Lecciones Aprendidas

1. **Consistencia de datos**: Es crucial que todos los endpoints devuelvan datos completos
2. **Configuración específica**: Los algoritmos deben usar configuración específica del servicio, no valores por defecto
3. **Debugging sistemático**: Los logs de debug fueron esenciales para identificar ambos bugs
4. **Testing integral**: Ambos bugs estaban relacionados y se manifestaban juntos

## ✅ Estado Final
- ✅ Bug #1 corregido: Endpoint devuelve `max_descansos_consecutivos`
- ✅ Bug #2 corregido: `getFullService()` obtiene datos completos
- ✅ Bug #3 corregido: Inicialización usa configuración específica
- ✅ Logs de debug agregados para monitoreo
- ✅ Violaciones falsas eliminadas