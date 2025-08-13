# ✅ Error "Failed to update service configuration" - CORREGIDO

## 🐛 Problema Identificado
**Error**: "No se pudo actualizar la configuración: Failed to update service configuration"
**Causa**: Desajuste entre la URL de la petición y el endpoint disponible

## 🔍 Análisis del Problema

### Petición del Frontend
```typescript
// src/app/service-management/service/page.tsx
const response = await fetch(`/api/services/${user?.serviceId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(serviceData),
});
```

### Endpoint Disponible
```typescript
// src/app/api/services/route.ts - PUT endpoint estaba aquí
export async function PUT(request: NextRequest) {
  // Lógica de actualización
}
```

**Problema**: La petición iba a `/api/services/1` pero el endpoint PUT estaba en `/api/services`

## ✅ Solución Implementada

### Endpoint PUT Agregado
**Archivo**: `src/app/api/services/[id]/route.ts`

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { id } = await params;
    const serviceId = parseInt(id);
    const serviceData = await request.json();
    
    // Verificar permisos específicos por servicio
    if (session.user.role.name !== 'ADMIN') {
      if (!session.user.serviceId || session.user.serviceId !== serviceId) {
        return NextResponse.json({ 
          error: 'Sin permisos para editar este servicio' 
        }, { status: 403 });
      }
    }

    const connection = await getConnection();
    
    try {
      await connection.execute(`
        UPDATE servicios SET
          nombre_servicio = ?, descripcion = ?, habilitar_turno_noche = ?,
          dotacion_objetivo_lunes_a_viernes_mananas = ?, 
          dotacion_objetivo_lunes_a_viernes_tardes = ?, 
          dotacion_objetivo_lunes_a_viernes_noche = ?,
          dotacion_objetivo_sab_dom_feriados_mananas = ?, 
          dotacion_objetivo_sab_dom_feriados_tardes = ?, 
          dotacion_objetivo_sab_dom_feriados_noche = ?,
          max_dias_trabajo_consecutivos = ?, 
          dias_trabajo_consecutivos_preferidos = ?, 
          max_descansos_consecutivos = ?,
          dias_descanso_consecutivos_preferidos = ?, 
          min_descansos_requeridos_antes_de_trabajar = ?, 
          fds_descanso_completo_objetivo = ?,
          notas_adicionales = ?
        WHERE id_servicio = ?
      `, [
        serviceData.nombre_servicio,
        serviceData.descripcion || null,
        serviceData.habilitar_turno_noche ? 1 : 0,
        serviceData.dotacion_objetivo_lunes_a_viernes_mananas || 0,
        serviceData.dotacion_objetivo_lunes_a_viernes_tardes || 0,
        serviceData.dotacion_objetivo_lunes_a_viernes_noche || 0,
        serviceData.dotacion_objetivo_sab_dom_feriados_mananas || 0,
        serviceData.dotacion_objetivo_sab_dom_feriados_tardes || 0,
        serviceData.dotacion_objetivo_sab_dom_feriados_noche || 0,
        serviceData.max_dias_trabajo_consecutivos || 6,
        serviceData.dias_trabajo_consecutivos_preferidos || 5,
        serviceData.max_descansos_consecutivos || 3,
        serviceData.dias_descanso_consecutivos_preferidos || 2,
        serviceData.min_descansos_requeridos_antes_de_trabajar || 1,
        serviceData.fds_descanso_completo_objetivo || 1,
        serviceData.notas_adicionales || null,
        serviceId
      ]);

      return NextResponse.json({ message: 'Servicio actualizado exitosamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

## 🔐 Control de Permisos Mejorado

### Administrador
- ✅ Puede editar cualquier servicio
- ✅ Sin restricciones de `serviceId`

### Jefe de Servicio
- ✅ Solo puede editar SU servicio asignado
- ✅ Verificación: `session.user.serviceId === serviceId`
- ✅ Error 403 si intenta editar otro servicio

## 📡 Endpoints Resultantes

### GET `/api/services/[id]`
- Obtiene configuración completa del servicio
- Incluye todas las reglas de planificación
- Verificación de permisos por servicio

### PUT `/api/services/[id]`
- Actualiza configuración del servicio
- Control de permisos específico por servicio
- Actualiza todas las columnas de configuración

## 🧪 Flujo de Prueba

1. **Acceder**: Ve a `/service-management/service`
2. **Editar**: Haz clic en "Editar Configuración"
3. **Modificar**: Cambia algunos valores en el formulario
4. **Guardar**: Haz clic en "Guardar Configuración"
5. **Verificar**: Debe aparecer toast "Configuración Actualizada"
6. **Confirmar**: Los cambios se reflejan en la vista

## ✅ Estado Final

- ✅ **Endpoint PUT**: Disponible en `/api/services/[id]`
- ✅ **Petición del frontend**: Coincide con endpoint disponible
- ✅ **Control de permisos**: Específico por servicio
- ✅ **Actualización completa**: Todas las columnas de configuración
- ✅ **Manejo de errores**: Respuestas apropiadas para cada caso

## 💡 Lección Aprendida

**Problema común**: Desajuste entre URLs de peticiones del frontend y endpoints disponibles en el backend.

**Solución**: Asegurar que los endpoints estén disponibles en las rutas exactas que el frontend está solicitando, o ajustar las URLs del frontend para que coincidan con los endpoints existentes.

El error "Failed to update service configuration" ahora está completamente resuelto y la funcionalidad de configuración de servicio funciona correctamente.