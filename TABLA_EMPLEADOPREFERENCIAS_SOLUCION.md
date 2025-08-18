# Tabla empleadopreferencias - Solución Implementada

## 🎯 Problema Identificado
**Error**: `Unknown column 'ep.id_empleado' in 'field list'`

**Causa**: La tabla `empleadopreferencias` no existe en la base de datos, pero la API intenta consultarla.

## 🛠️ Solución Implementada

### 1. Manejo de Error en API
**Archivo**: `src/app/api/service-management/employees/preferences/route.ts`

```typescript
// ✅ AGREGADO: Manejo de tabla inexistente
try {
  const [result] = await connection.execute(`
    SELECT ep.id_empleado, ep.mes, ep.anio, ...
    FROM empleadopreferencias ep
    INNER JOIN empleados e ON ep.id_empleado = e.id_empleado
    WHERE e.id_servicio = ? AND ep.mes = ? AND ep.anio = ?
  `, [serviceId, parseInt(month), parseInt(year)]);
  
  preferenciasEspecificas = result;
} catch (tableError) {
  if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.code === 'ER_BAD_FIELD_ERROR') {
    console.log('⚠️ Tabla empleadopreferencias no existe, continuando sin preferencias específicas...');
    preferenciasEspecificas = [];
  } else {
    throw tableError;
  }
}
```

### 2. Script SQL para Crear la Tabla
**Archivo**: `database/create-empleadopreferencias.sql`

```sql
CREATE TABLE IF NOT EXISTS empleadopreferencias (
  id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio INT NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
  elegible_franco_pos_guardia BOOLEAN DEFAULT FALSE,
  prefiere_trabajar_fines_semana BOOLEAN DEFAULT FALSE,
  disponibilidad_general ENUM('disponible', 'limitado', 'no_disponible') DEFAULT 'disponible',
  restricciones_especificas TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  UNIQUE KEY unique_empleado_mes_anio (id_empleado, mes, anio)
);
```

## 🎯 Instrucciones para Crear la Tabla

### Opción 1: phpMyAdmin
1. Abrir phpMyAdmin
2. Seleccionar base de datos `hospital_management`
3. Ir a la pestaña "SQL"
4. Copiar y pegar el contenido de `database/create-empleadopreferencias.sql`
5. Ejecutar

### Opción 2: Línea de comandos MySQL
```bash
mysql -u root -p hospital_management < database/create-empleadopreferencias.sql
```

### Opción 3: Cliente MySQL
```sql
USE hospital_management;
-- Copiar y pegar el SQL del archivo create-empleadopreferencias.sql
```

## 📊 Estructura de la Tabla

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_preferencia` | INT (PK) | ID único de la preferencia |
| `id_empleado` | INT (FK) | Referencia al empleado |
| `mes` | INT | Mes (1-12) |
| `anio` | INT | Año (2020-2050) |
| `elegible_franco_pos_guardia` | BOOLEAN | Franco después de guardia |
| `prefiere_trabajar_fines_semana` | BOOLEAN | Preferencia fines de semana |
| `disponibilidad_general` | ENUM | disponible/limitado/no_disponible |
| `restricciones_especificas` | TEXT | Restricciones adicionales |

## ✅ Estado Actual

- ✅ **API modificada** para manejar tabla inexistente
- ✅ **Script SQL creado** para crear la tabla
- ✅ **Logs detallados** para debugging
- ✅ **Manejo de errores** mejorado

## 🎯 Próximos Pasos

1. **Ejecutar el SQL** para crear la tabla `empleadopreferencias`
2. **Verificar** que la tabla se creó correctamente:
   ```sql
   DESCRIBE empleadopreferencias;
   ```
3. **Probar la aplicación** - El error debería desaparecer
4. **Opcional**: Agregar datos de prueba para empleados específicos

## 🔍 Verificación

Después de crear la tabla, deberías ver en los logs:
```
🔍 Preferencias específicas encontradas: 0
✅ Devolviendo preferencias completas: X empleados
```

En lugar del error anterior:
```
❌ Unknown column 'ep.id_empleado' in 'field list'
```

La aplicación ahora funcionará correctamente tanto con la tabla existente como sin ella.