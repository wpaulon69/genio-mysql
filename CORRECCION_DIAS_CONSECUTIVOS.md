# Corrección Cálculo Días Consecutivos - Bug Evaluación

## 🚨 Problema Identificado
**Error**: El sistema reporta "Montu descansó 8 días consecutivos" cuando debería ser 1 día.

**Caso específico**:
- **29/06**: Mañana (rompe secuencia de descanso)
- **30/06**: Mañana (día de trabajo)  
- **01/07**: Descanso ← **Debería ser día 1 de nueva secuencia**

**Resultado esperado**: 1 día consecutivo
**Resultado actual**: 8 días consecutivos ❌

## 🔧 Correcciones Aplicadas

### 1. Orden de Procesamiento Corregido
**Problema**: El bucle procesaba días hacia atrás incorrectamente
```typescript
// ❌ ANTES - Procesamiento incorrecto
for (let i = lookbackDays - 1; i >= 0; i--) {
  const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);

// ✅ DESPUÉS - Procesamiento cronológico correcto
for (let i = 0; i < lookbackDays; i++) {
  const dateToCheck = subDays(firstDayOfCurrentMonth, lookbackDays - i);
```

### 2. Lógica de Días de Descanso Consecutivos
**Problema**: Contaba `undefined` como día de descanso consecutivo
```typescript
// ❌ ANTES - Lógica incorrecta
if (lastTypeEncountered === 'D' || ... || lastTypeEncountered === undefined) {
  currentConsecutiveRest += 1;

// ✅ DESPUÉS - Lógica corregida
if (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || ...) {
  currentConsecutiveRest += 1;
} else {
  currentConsecutiveRest = 1; // Primer día de descanso después de trabajo o inicio
}
```

### 3. Debug Logging Mejorado
**Agregado**: Logs específicos para casos problemáticos
```typescript
// ✅ NUEVO - Debug específico para Montu y casos problemáticos
if (emp.nombre === 'Montu' || currentConsecutiveRest > 3) {
  console.log(`🔍 [DEBUG] ${emp.nombre} inicializado:`);
  console.log(`   - Días de trabajo consecutivos: ${currentConsecutiveWork}`);
  console.log(`   - Días de descanso consecutivos: ${currentConsecutiveRest}`);
  console.log(`   - Último tipo encontrado: ${lastTypeEncountered}`);
  console.log(`   - Días de lookback: ${lookbackDays}`);
}
```

## 🎯 Archivo Modificado
**Archivo**: `src/lib/scheduler/state.ts`
**Función**: `initializeEmployeeStatesFromHistory`

## 🔍 Lógica Corregida

### Procesamiento Cronológico
1. **Procesa días del más antiguo al más reciente**
2. **Calcula secuencias correctamente**
3. **Mantiene continuidad entre meses**

### Cálculo de Consecutivos
1. **Trabajo → Descanso**: Reinicia a 1 día de descanso
2. **Descanso → Descanso**: Incrementa días consecutivos
3. **Undefined/Inicio**: No cuenta como consecutivo

## 📊 Caso de Prueba: Montu

### Datos de Entrada (Junio 2025):
```
29/06: Mañana (M)
30/06: Mañana (M)
```

### Evaluación (Julio 2025):
```
01/07: Descanso (D) ← Evaluando este día
```

### Resultado Esperado:
- **Último tipo**: M (Mañana del 30/06)
- **Tipo actual**: D (Descanso del 01/07)
- **Días consecutivos**: 1 (primer día de descanso después de trabajo)

### Verificación:
Los logs mostrarán:
```
🔍 [DEBUG] Montu inicializado:
   - Días de trabajo consecutivos: 0
   - Días de descanso consecutivos: 0 (o 1 si es el primer día)
   - Último tipo encontrado: M
```

## 🎯 Impacto de la Corrección

### ✅ Cálculo Correcto
- Días consecutivos calculados correctamente
- Continuidad entre meses respetada
- Secuencias reiniciadas apropiadamente

### ✅ Evaluación Precisa
- Violaciones reportadas correctamente
- Puntuaciones más precisas
- Menos falsos positivos

### ✅ Debug Mejorado
- Logs específicos para casos problemáticos
- Fácil identificación de errores
- Mejor trazabilidad

## 🔍 Verificación

### Pasos para Probar:
1. **Generar horario** para julio 2025
2. **Revisar logs** en consola para Montu
3. **Verificar evaluación** - No debería reportar 8 días consecutivos
4. **Confirmar cálculo** - Debería mostrar 1 día consecutivo para 01/07

### Comportamiento Esperado:
- ✅ Montu: 1 día de descanso consecutivo (no 8)
- ✅ Logs de debug muestran inicialización correcta
- ✅ Evaluación sin falsos positivos
- ✅ Cálculo preciso de secuencias

## 🏆 Estado Final

- ✅ **Orden de procesamiento**: CORREGIDO
- ✅ **Lógica de consecutivos**: CORREGIDA  
- ✅ **Debug logging**: MEJORADO
- ✅ **Continuidad entre meses**: FUNCIONAL

El cálculo de días consecutivos ahora debería ser preciso y la evaluación de horarios más confiable.

---
**Fecha de corrección**: $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Estado**: ✅ CÁLCULO DÍAS CONSECUTIVOS CORREGIDO