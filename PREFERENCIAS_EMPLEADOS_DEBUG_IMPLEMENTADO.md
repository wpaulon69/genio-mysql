# Preferencias Empleados - Debug Implementado

## 🎯 Problema Identificado
- **Error**: "Error al cargar las preferencias de empleados" en la sección de Jefes
- **Componente**: `EmployeePreferencesDisplay`
- **API**: `/api/service-management/employees/preferences`
- **Usuario**: Jefe Servicio (servicio mucamas)

## 🛠️ Correcciones Implementadas

### 1. Logs Detallados en API
**Archivo**: `src/app/api/service-management/employees/preferences/route.ts`

```typescript
// ✅ AGREGADO: Logs detallados para debugging
console.log('🔍 [PREFERENCES API] Iniciando petición...');
console.log('👤 [PREFERENCES API] Usuario:', {
  id: session.user.id,
  username: session.user.username,
  role: session.user.role?.name,
  serviceId: session.user.serviceId
});
console.log('📅 [PREFERENCES API] Parámetros:', { month, year, serviceId });
```

### 2. Logs Detallados en Frontend
**Archivo**: `src/components/service-management/EmployeePreferencesDisplay.tsx`

```typescript
// ✅ AGREGADO: Logs en frontend para debugging
console.log('🔍 [FRONTEND] Haciendo petición a preferencias:', { month, year });
console.log('📡 [FRONTEND] Respuesta de API:', {
  status: response.status,
  statusText: response.statusText,
  ok: response.ok
});
```

### 3. Manejo de Errores Mejorado
**Archivo**: `src/components/service-management/EmployeePreferencesDisplay.tsx`

```typescript
// ✅ MEJORADO: Manejo de errores con detalles
if (error || !preferences) {
  return (
    <Card>
      <CardContent>
        <div className="space-y-2">
          <p className="text-red-600">Error al cargar las preferencias de empleados</p>
          {error && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Ver detalles del error</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="text-sm text-blue-600">
            <p>💡 Posibles soluciones:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verificar que tienes permisos para gestionar empleados</li>
              <li>Verificar que tienes un servicio asignado</li>
              <li>Revisar los logs del servidor (F12 → Console)</li>
              <li>Contactar al administrador si el problema persiste</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔍 Verificaciones Realizadas

### ✅ Permisos Correctos
- Rol `jefe_servicio` tiene permiso `MANAGE_SERVICE_EMPLOYEES`
- Función `hasPermission` funciona correctamente

### ✅ Parámetros Correctos
- `selectedMonth` y `selectedYear` se pasan correctamente desde `ServiceScheduleGenerator`
- URL de API se construye correctamente

### ✅ Estructura de API
- API maneja correctamente los parámetros `month` y `year`
- Consultas SQL están bien estructuradas
- Manejo de errores implementado

## 🎯 Próximos Pasos para Debugging

### 1. Verificar Logs del Servidor
```bash
# Iniciar servidor y revisar logs
npm run dev
# Buscar logs que empiecen con [PREFERENCES API]
```

### 2. Verificar en DevTools
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Recargar página de generación de horarios
4. Buscar petición a `/api/service-management/employees/preferences`
5. Verificar status code y respuesta

### 3. Verificar Configuración de Usuario
```sql
-- Verificar usuario Jefe Servicio
SELECT u.id, u.username, u.role, u.serviceId, s.nombre_servicio 
FROM users u 
LEFT JOIN servicios s ON u.serviceId = s.id_servicio 
WHERE u.role = 'jefe_servicio';

-- Verificar empleados en servicio mucamas
SELECT e.* FROM empleados e 
INNER JOIN servicios s ON e.id_servicio = s.id_servicio 
WHERE s.nombre_servicio = 'mucamas';
```

## 🔧 Posibles Causas del Error

1. **Usuario sin serviceId**: El usuario Jefe Servicio no tiene `serviceId` asignado
2. **Servicio inexistente**: El servicio "mucamas" no existe en la base de datos
3. **Sin empleados**: No hay empleados asignados al servicio mucamas
4. **Error de sesión**: Problema con la autenticación o sesión del usuario
5. **Error de base de datos**: Problema de conexión o consulta SQL

## 📊 Estado Actual

- ✅ Logs implementados en API y frontend
- ✅ Manejo de errores mejorado
- ✅ Verificaciones de permisos confirmadas
- ⏳ Pendiente: Identificar causa específica del error

## 🎯 Instrucciones para el Usuario

1. **Revisar logs del servidor** cuando hagas la petición
2. **Verificar Network tab** en DevTools para ver la respuesta de la API
3. **Verificar que tu usuario tiene serviceId asignado**
4. **Contactar si el problema persiste** con los logs específicos

Los logs detallados ahora te mostrarán exactamente dónde está fallando la petición.