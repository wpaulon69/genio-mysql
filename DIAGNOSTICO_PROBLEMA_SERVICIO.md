# Diagnóstico: Problema con Carga de Servicio

## Situación Actual
- ✅ Usuario puede seleccionar servicio "mucamas"
- ✅ `selectedServiceIdView: 1` se actualiza correctamente
- ✅ `targetServiceId: 1` se calcula correctamente
- ❌ `serviceInfo: null` - La API no devuelve datos

## Debug Implementado

### 1. Logs de Consola
El componente ahora muestra logs detallados:
```javascript
console.log('🔍 Debug UnifiedScheduleManager:', {
  isJefeServicio,
  canManageAllServices,
  userServiceId: user?.serviceId,
  selectedServiceIdView,
  targetServiceId,
  servicesCount: services.length,
  serviceInfo: serviceInfo ? 'loaded' : 'null',
  isLoadingService,
  serviceError: serviceError?.message
});
```

### 2. Logs de API
La query de serviceInfo ahora incluye logs detallados:
```javascript
console.log('🔍 Fetching service info for ID:', targetServiceId);
console.log('🔍 Service API response status:', response.status);
console.log('🔍 Service data received:', data);
```

### 3. Interfaz de Error
- Estado de carga visible
- Mensajes de error específicos
- Información de debug en desarrollo

## Pasos para Diagnosticar

### 1. Abrir Consola del Navegador
1. Ir a la página de horarios
2. Abrir DevTools (F12)
3. Ir a la pestaña Console
4. Seleccionar servicio "mucamas"
5. Observar los logs que aparecen

### 2. Verificar Network Tab
1. Ir a la pestaña Network en DevTools
2. Seleccionar servicio "mucamas"
3. Buscar la petición a `/api/services/1`
4. Verificar:
   - Status code (200, 401, 403, 500, etc.)
   - Response body
   - Request headers

### 3. Posibles Errores y Soluciones

#### Error 401 (No autorizado)
- **Causa**: Sesión no válida o expirada
- **Solución**: Cerrar sesión y volver a iniciar

#### Error 403 (Sin permisos)
- **Causa**: Usuario no tiene permisos `manage_all_services`
- **Solución**: Verificar permisos del usuario en la base de datos

#### Error 404 (No encontrado)
- **Causa**: Servicio con ID 1 no existe en la base de datos
- **Solución**: Verificar tabla `servicios` en la base de datos

#### Error 500 (Error del servidor)
- **Causa**: Error en la base de datos o en el código
- **Solución**: Verificar logs del servidor y conexión a BD

#### Sin respuesta
- **Causa**: Base de datos no conectada
- **Solución**: Verificar configuración de base de datos

## Información Esperada

### Logs de Consola Exitosos
```
🔍 Fetching service info for ID: 1
🔍 Service API response status: 200
🔍 Service data received: { id_servicio: 1, nombre_servicio: "mucamas", ... }
```

### Response de API Exitosa
```json
{
  "id_servicio": 1,
  "nombre_servicio": "mucamas",
  "descripcion": "Servicio de mucamas",
  "habilitar_turno_noche": 1,
  "dotacion_objetivo_lunes_a_viernes_mananas": 2,
  ...
}
```

## Próximos Pasos
1. **Probar en navegador** y revisar logs
2. **Identificar error específico** en Network/Console
3. **Aplicar solución** según el tipo de error encontrado
4. **Remover debug** una vez solucionado el problema

## Archivos con Debug
- `src/components/schedule/UnifiedScheduleManager.tsx` - Logs y UI de error
- `src/app/api/services/[id]/route.ts` - Permisos corregidos

Una vez identificado el problema específico, podremos aplicar la solución correcta.