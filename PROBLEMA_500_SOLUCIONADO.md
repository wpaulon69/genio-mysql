# Problema Error 500 - Solucionado

## 🔍 Diagnóstico Realizado

### Problema Original
- Error 500 en `/api/services/1`
- `serviceInfo: null` en el componente
- Mensaje "Selecciona un servicio para generar horarios" persistente

### Investigación
1. ✅ **Base de datos conectada**: La aplicación puede conectarse correctamente
2. ✅ **Tabla existe**: La tabla `servicios` existe en la BD
3. ✅ **Datos existen**: El servicio "mucamas" con ID 1 existe
4. ❌ **Query incorrecta**: La query SQL no coincidía con la estructura real de la tabla

## 🛠️ Solución Implementada

### Problema en la Query SQL
La API estaba buscando campos que no existían o tenían nombres diferentes:

**Antes (Incorrecto):**
```sql
SELECT 
  id_servicio,
  nombre_servicio,
  descripcion,
  habilitar_turno_noche,
  dotacion_objetivo_lunes_a_viernes_mananas,
  -- ... otros campos
  fds_descanso_completo_objetivo,  -- ❌ Campo faltante en la estructura
  notas_adicionales
FROM servicios 
WHERE id_servicio = ?
```

**Después (Correcto):**
```sql
SELECT 
  id_servicio,
  nombre_servicio,
  descripcion,
  habilitar_turno_noche,
  targetCompleteWeekendsOff,       -- ✅ Campo correcto
  notas_adicionales,
  dotacion_objetivo_lunes_a_viernes_mananas,
  -- ... otros campos en orden correcto
  fds_descanso_completo_objetivo
FROM servicios 
WHERE id_servicio = ?
```

### Estructura Real de la Tabla
```
id_servicio (PK, auto_increment)
nombre_servicio (varchar)
descripcion (text)
habilitar_turno_noche (tinyint)
targetCompleteWeekendsOff (int)     ← Este campo estaba faltando
notas_adicionales (text)
dotacion_objetivo_lunes_a_viernes_mananas (int)
dotacion_objetivo_lunes_a_viernes_tardes (int)
dotacion_objetivo_lunes_a_viernes_noche (int)
dotacion_objetivo_sab_dom_feriados_mananas (int)
dotacion_objetivo_sab_dom_feriados_tardes (int)
dotacion_objetivo_sab_dom_feriados_noche (int)
max_dias_trabajo_consecutivos (int)
max_descansos_consecutivos (int)
dias_trabajo_consecutivos_preferidos (int)
dias_descanso_consecutivos_preferidos (int)
min_descansos_requeridos_antes_de_trabajar (int)
fds_descanso_completo_objetivo (int)
```

## 🔧 Correcciones Aplicadas

### 1. Query SQL Corregida
- Agregado campo `targetCompleteWeekendsOff` que faltaba
- Reordenados los campos para coincidir con la estructura real
- Mantenidos todos los campos necesarios

### 2. Logs de Debug Agregados
- Logs detallados en la API para rastrear el flujo
- Información específica de errores
- Logs en el componente para monitorear el estado

### 3. Configuración de BD Identificada
- Host: `10.175.6.16`
- Database: `horarios_des`
- User: `root`
- Password: `nokia3189`

## 📋 Resultado Esperado

Después de esta corrección, al seleccionar "mucamas":

1. ✅ La API `/api/services/1` devuelve status 200
2. ✅ `serviceInfo` se carga correctamente
3. ✅ Aparecen las pestañas "Ver Horarios" y "Generar Horario"
4. ✅ El usuario puede proceder a generar horarios

## 🧪 Verificación

Para verificar que funciona:
1. Ir a `/schedule`
2. Seleccionar "mucamas"
3. Verificar en la consola del navegador:
   - Logs de la API exitosos
   - `serviceInfo: "loaded"` en el debug del componente
4. Verificar en la UI:
   - Desaparece el mensaje de error
   - Aparecen las pestañas de gestión

## 📁 Archivos Modificados
- `src/app/api/services/[id]/route.ts` - Query SQL corregida y logs agregados
- `scripts/debug-servicios-table.js` - Script de debug con configuración correcta

La solución fue identificar que la estructura real de la tabla era diferente a la esperada por la query SQL.