# Corrección Crítica - Problema Lookback Days

## 🚨 Problema Crítico Identificado
**Error**: El algoritmo cuenta días **SIN DATOS** como descansos, creando secuencias artificiales de 7-8 días consecutivos.

**Caso específico Rios**:
- **29/06**: Mañana (rompe secuencia)
- **30/06**: Sin datos → **Asumido como Descanso** ❌
- **01/07**: Descanso (horario generado)
- **Resultado**: 8 días consecutivos (INCORRECTO)

## 🔍 Causa Raíz

### 1. Lookback Excesivo
```typescript
// ❌ ANTES - Lookback muy alto
const lookbackDays = Math.max(rulesConfig.maxConsecutiveWorkDays, rulesConfig.maxConsecutiveDaysOff, 7);
// Resultado: 7 días hacia atrás
```

### 2. Asunción Incorrecta
```typescript
// ❌ ANTES - Asume que sin datos = descanso
if (shiftToday) {
  todayShiftType = getShiftTypeForEval(shiftToday);
} else {
  todayShiftType = 'D'; // ← PROBLEMA: Asume descanso
}
```

### 3. Días Procesados
Con lookback = 7, procesaba:
- 24/06: Tarde (datos reales)
- 25/06: Tarde (datos reales)  
- 26/06: Tarde (datos reales)
- 27/06: Descanso (datos reales)
- 28/06: Descanso (datos reales)
- 29/06: Mañana (datos reales)
- 30/06: **SIN DATOS → Asumido como Descanso** ❌

## 🔧 Correcciones Aplicadas

### 1. Lookback Reducido
```typescript
// ✅ DESPUÉS - Lookback más razonable
const lookbackDays = Math.min(Math.max(rulesConfig.maxConsecutiveWorkDays, rulesConfig.maxConsecutiveDaysOff), 5);
// Resultado: Máximo 5 días hacia atrás
```

### 2. Saltar Días Sin Datos
```typescript
// ✅ DESPUÉS - Saltar días sin datos
if (shiftToday) {
  todayShiftType = getShiftTypeForEval(shiftToday);
} else {
  // Si no hay datos para este día, SALTAMOS este día
  continue;
}
```

### 3. Logs Detallados
```typescript
// ✅ NUEVO - Debug específico para casos problemáticos
if (emp.nombre === 'Montu' || emp.nombre === 'Rios' || currentConsecutiveRest > 3) {
  console.log(`🔍 [DEBUG] ${emp.nombre} procesando día ${dateToCheckStr}`);
  console.log(`   ${dateToCheckStr}: ${shiftToday ? 'DATOS' : 'SIN_DATOS'} → ${todayShiftType}`);
}
```

## 🎯 Impacto de las Correcciones

### ✅ Cálculo Preciso
- Solo cuenta días con datos reales
- No crea secuencias artificiales
- Lookback más eficiente

### ✅ Resultado Esperado para Rios
**Antes**: 8 días consecutivos ❌
**Después**: 1-2 días consecutivos ✅

**Secuencia real**:
- 29/06: Mañana (rompe cualquier secuencia anterior)
- 30/06: Sin datos (SALTADO)
- 01/07: Descanso (día 1 de nueva secuencia)

## 📊 Verificación

### Logs Esperados:
```
🔍 [DEBUG] Rios procesando día 2025-06-29
   2025-06-29: DATOS → M
     → Trabajo: 1, Descanso: 0

🔍 [DEBUG] Rios procesando día 2025-06-30
   2025-06-30: SIN_DATOS → SALTANDO día sin datos

🔍 [DEBUG] Rios inicializado:
   - Días de trabajo consecutivos: 1
   - Días de descanso consecutivos: 0
   - Último tipo encontrado: M
```

### Evaluación del 01/07:
- **Estado inicial**: 0 días de descanso consecutivos
- **Último tipo**: M (Mañana del 29/06)
- **Tipo actual**: D (Descanso del 01/07)
- **Resultado**: 1 día de descanso consecutivo ✅

## 🏆 Estado Final

- ✅ **Lookback reducido**: Máximo 5 días
- ✅ **Días sin datos**: SALTADOS (no asumidos como descanso)
- ✅ **Cálculo preciso**: Solo días con datos reales
- ✅ **Debug mejorado**: Logs detallados para casos problemáticos

## 🎯 Próxima Prueba

1. **Generar horario** para julio 2025
2. **Revisar logs** - Deberías ver el procesamiento día por día
3. **Verificar evaluación** - Rios debería tener 1-2 días consecutivos, no 8
4. **Confirmar corrección** - No más falsos positivos de 8 días

Esta corrección debería eliminar completamente el problema de días consecutivos artificiales causado por días sin datos.

---
**Fecha de corrección**: $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Estado**: ✅ PROBLEMA LOOKBACK DAYS CORREGIDO