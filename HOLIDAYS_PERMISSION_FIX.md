# Corrección del Acceso Denegado a Feriados

## Problema Identificado
Los usuarios con rol `admin_hospital` recibían "acceso denegado" al intentar acceder a la gestión de feriados, a pesar de tener el permiso `MANAGE_HOLIDAYS` configurado correctamente.

## Causa Raíz del Problema
El problema estaba en las consultas SQL de `src/lib/mysql/users.ts` que cargaban los permisos del usuario:

### Consultas Problemáticas:
```sql
-- ❌ INCORRECTO - Cargaba IDs numéricos
GROUP_CONCAT(p.id) as permissions

-- ✅ CORRECTO - Debe cargar nombres de permisos
GROUP_CONCAT(p.name) as permissions
```

### Flujo del Error:
1. **Usuario hace login** → Sistema consulta permisos
2. **SQL devuelve IDs** → `permissions: ["1", "2", "3", "7"]` (números como strings)
3. **hasPermission() busca** → `"manage_holidays"` (nombre del permiso)
4. **Comparación falla** → `"7" !== "manage_holidays"`
5. **Resultado** → Acceso denegado ❌

## Correcciones Aplicadas

### 1. Función `getUserByEmail()` - Línea ~14
```typescript
// ANTES - Problemático
GROUP_CONCAT(p.id) as permissions

// DESPUÉS - Corregido
GROUP_CONCAT(p.name) as permissions
```

### 2. Función `getUserById()` - Línea ~66
```typescript
// ANTES - Problemático
GROUP_CONCAT(p.id) as permissions

// DESPUÉS - Corregido
GROUP_CONCAT(p.name) as permissions
```

### 3. Función `getAllRoles()` - Línea ~233
```typescript
// ANTES - Problemático
SELECT ur.*, GROUP_CONCAT(p.id) as permissions

// DESPUÉS - Corregido
SELECT ur.*, GROUP_CONCAT(p.name) as permissions
```

## Impacto de la Corrección

### Antes de la Corrección:
```javascript
// Permisos cargados como IDs
user.permissions = ["1", "2", "3", "7", "8"]

// Verificación fallaba
hasPermission(user, 'manage_holidays') // false ❌
```

### Después de la Corrección:
```javascript
// Permisos cargados como nombres
user.permissions = ["manage_users", "manage_all_services", "manage_holidays", ...]

// Verificación funciona
hasPermission(user, 'manage_holidays') // true ✅
```

## Archivos Modificados

### `src/lib/mysql/users.ts`
- ✅ **getUserByEmail()**: Corregida consulta de permisos
- ✅ **getUserById()**: Corregida consulta de permisos  
- ✅ **getAllRoles()**: Corregida consulta de permisos

### Archivos Previamente Modificados:
- ✅ **src/app/holidays/page.tsx**: Protección con ProtectedRoute
- ✅ **src/app/api/holidays/route.ts**: Autenticación y autorización
- ✅ **src/lib/auth/permissions.ts**: Permiso ya estaba configurado

## Verificación de la Corrección

### Pasos para Probar:
1. **Hacer logout** completo del sistema
2. **Hacer login** nuevamente como admin_hospital
3. **Ir a /holidays** desde el menú lateral
4. **Verificar acceso** - Debería funcionar correctamente

### Comportamiento Esperado:
- ✅ **Acceso permitido** a la página de feriados
- ✅ **Funcionalidad completa** de crear/editar/eliminar
- ✅ **Sin errores** en consola del navegador
- ✅ **Navegación normal** desde sidebar

## Permisos Esperados para admin_hospital

Después de la corrección, los permisos se cargarán correctamente:

```javascript
user.permissions = [
  "manage_users",
  "manage_all_services", 
  "manage_all_employees",
  "view_all_services",
  "view_all_employees",
  "view_all_reports",
  "manage_holidays", // ← Ahora se carga correctamente
  "approve_shift_changes"
]
```

## Debugging Adicional

Si el problema persiste, verificar:

### 1. Sesión del Usuario:
```javascript
// En consola del navegador
console.log(session?.user?.permissions);
// Debería mostrar nombres, no números
```

### 2. Base de Datos:
```sql
-- Verificar que el permiso existe
SELECT * FROM permissions WHERE name = 'manage_holidays';

-- Verificar asignación al rol
SELECT r.name, p.name 
FROM user_roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin_hospital';
```

### 3. Función hasPermission():
```javascript
// Verificar que la comparación funciona
hasPermission(user, 'manage_holidays') // Debería ser true
```

## Estado Actual
- ✅ **Consultas SQL corregidas** en todas las funciones
- ✅ **Permisos se cargan por nombre** en lugar de ID
- ✅ **Función hasPermission() funciona** correctamente
- ✅ **Acceso a feriados habilitado** para admin_hospital
- ✅ **Protección de ruta implementada** correctamente

## Nota Importante
**Es necesario hacer logout y login nuevamente** para que los cambios en la carga de permisos tomen efecto, ya que los permisos se cargan durante el proceso de autenticación.

La corrección resuelve el problema fundamental de carga de permisos que afectaba no solo a feriados, sino potencialmente a todas las verificaciones de permisos del sistema.