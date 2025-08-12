# ✅ Bug de Evaluación de Horarios - SOLUCIONADO

## 🐛 Problema
La evaluación de horarios mostraba violaciones falsas como "Descansó 8 días consecutivos" cuando el límite configurado era 3 días.

## 🔧 Correcciones Aplicadas

### 1. Endpoint de Servicios Corregido
**Archivo**: `src/app/api/services/[id]/route.ts`
- ✅ Agregadas columnas de configuración de horarios al SELECT
- ✅ Ahora devuelve `max_descansos_consecutivos` y otras configuraciones

### 2. Algoritmo de Inicialización Corregido  
**Archivo**: `src/lib/scheduler/state.ts`
- ✅ Días sin datos ahora se resetean a máximo 1 día de descanso
- ✅ Evita acumulación falsa de días consecutivos por datos incompletos

## 📊 Resultado
- ✅ `service.max_descansos_consecutivos` ya no es `undefined`
- ✅ `rulesConfig.maxConsecutiveDaysOff` ahora es 3 (no 4)
- ✅ `consecutiveRestDays` ahora es 1 (no 7)
- ✅ Violaciones falsas eliminadas

## 🎯 Estado Final
**La violación "Descansó 8 días consecutivos" ya no aparece** al generar horarios de junio.

---
*Corrección completada y código de debug eliminado*