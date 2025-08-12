# 📋 GUÍA: CÓMO ASIGNAR SERVICIOS A JEFES DE SERVICIO

## 🎯 Objetivo
Explicar paso a paso cómo asignar un servicio específico a un usuario con rol "Jefe de Servicio" para que pueda administrar ese servicio.

## 🔍 Ubicación de la Funcionalidad

### ✅ **Ya está implementado en:**
- **Formulario de usuarios**: `/admin/users`
- **Campo específico**: "Servicio (Opcional)"
- **Base de datos**: Columna `service_id` en tabla `users`

## 📝 Proceso Paso a Paso

### 1. **Acceder a la Gestión de Usuarios**
```
1. Login como Admin Hospital o Super Admin
2. Ir a: http://localhost:9002/admin/users
3. Buscar el usuario que será Jefe de Servicio
```

### 2. **Crear o Editar Usuario Jefe de Servicio**

#### Para Crear Nuevo Usuario:
```
1. Clic en "Crear Usuario"
2. Llenar información básica:
   - Nombre: "Dr. Carlos Martínez"
   - Email: "jefe.mucamas@hospital.com"
   - Contraseña: "Mucamas2025!"
3. Seleccionar rol: "👨‍⚕️ Jefe de Servicio"
4. ⭐ IMPORTANTE: Seleccionar servicio: "mucamas"
5. Guardar usuario
```

#### Para Editar Usuario Existente:
```
1. Buscar usuario en la lista
2. Clic en "Editar" (icono lápiz)
3. Cambiar rol a: "👨‍⚕️ Jefe de Servicio"
4. ⭐ IMPORTANTE: Seleccionar servicio: "mucamas"
5. Guardar cambios
```

### 3. **Verificar Asignación**
```
1. El usuario aparece en la lista con:
   - Rol: "Jefe de Servicio"
   - Servicio asignado visible
2. Usuario puede hacer login
3. Ve opción "Mi Servicio" en el sidebar
4. Puede acceder a /service-management
```

## 🏥 Servicios Disponibles

### Servicios Actuales en el Sistema:
- **mucamas** - Servicio de limpieza
- **Cocina** - Servicio de alimentación

### Para Ver Todos los Servicios:
```sql
SELECT id_servicio, nombre_servicio, descripcion 
FROM servicios 
ORDER BY nombre_servicio;
```

## 🎨 Interfaz del Formulario

### Campo de Servicio en el Formulario:
```
┌─────────────────────────────────────────────────┐
│ Servicio (Opcional)                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Sin servicio asignado        ▼]            │ │
│ │ • Sin servicio asignado                     │ │
│ │ • mucamas                                   │ │
│ │ • Cocina                                    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🔧 Validación Técnica

### En la Base de Datos:
```sql
-- Verificar usuario con servicio asignado
SELECT 
    u.name,
    u.email,
    ur.display_name as role,
    s.nombre_servicio as service
FROM users u
JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN servicios s ON u.service_id = s.id_servicio
WHERE ur.name = 'jefe_servicio';
```

### Resultado Esperado:
```
| name              | email                    | role           | service |
|-------------------|--------------------------|----------------|---------|
| Dr. Carlos Martínez| jefe.mucamas@hospital.com| Jefe de Servicio| mucamas |
```

## ⚠️ Puntos Importantes

### 1. **Rol + Servicio = Funcionalidad Completa**
- ✅ **Solo rol "Jefe de Servicio"**: Puede ver la opción pero sin servicio asignado
- ✅ **Rol + Servicio asignado**: Funcionalidad completa de gestión

### 2. **Un Jefe por Servicio (Recomendado)**
- Cada servicio debería tener un jefe principal
- Múltiples jefes por servicio es técnicamente posible
- Pero puede crear confusión en la gestión

### 3. **Servicios Sin Jefe**
- Servicios pueden existir sin jefe asignado
- Empleados pueden estar asignados al servicio
- Solo no habrá gestión específica desde el rol jefe

## 🎯 Casos de Uso Comunes

### Caso 1: Hospital con 2 Servicios
```
Servicios:
- mucamas (15 empleados)
- Cocina (10 empleados)

Jefes de Servicio:
- Dr. Carlos Martínez → mucamas
- Enf. Ana López → Cocina

Resultado:
- Carlos solo ve/gestiona empleados de mucamas
- Ana solo ve/gestiona empleados de Cocina
```

### Caso 2: Servicio Sin Jefe Asignado
```
Servicios:
- mucamas (15 empleados) → Sin jefe
- Cocina (10 empleados) → Enf. Ana López

Resultado:
- Empleados de mucamas existen pero sin gestión específica
- Ana gestiona completamente Cocina
- Admin Hospital puede gestionar ambos servicios
```

## 🚀 Flujo Completo de Asignación

### Escenario: Asignar Jefe a Servicio "mucamas"
```
1. 🔐 Login como Admin Hospital
2. 📋 Ir a /admin/users
3. ➕ Crear usuario o ✏️ editar existente:
   - Nombre: "Dr. Carlos Martínez"
   - Email: "jefe.mucamas@hospital.com"
   - Rol: "Jefe de Servicio"
   - Servicio: "mucamas" ⭐
4. 💾 Guardar usuario
5. 🔐 Login como el nuevo jefe
6. 🏠 Ve dashboard de "Servicio: mucamas"
7. 👥 Puede gestionar empleados de mucamas
8. ✅ Funcionalidad completa disponible
```

## 🔍 Troubleshooting

### Problema: "Usuario sin servicio asignado"
**Causa**: Usuario tiene rol "Jefe de Servicio" pero no tiene servicio asignado
**Solución**: 
1. Editar usuario en /admin/users
2. Seleccionar servicio en el dropdown
3. Guardar cambios

### Problema: "No ve empleados en su servicio"
**Causa**: Empleados no están asignados al servicio
**Solución**:
1. Verificar que empleados tengan `id_servicio` correcto
2. O usar la funcionalidad "Asignar empleados disponibles"

### Problema: "No puede acceder a /service-management"
**Causa**: Usuario no tiene permisos o servicio
**Solución**:
1. Verificar rol = "Jefe de Servicio"
2. Verificar servicio asignado
3. Verificar permisos en la base de datos

## 📊 Verificación Final

### Checklist de Asignación Exitosa:
- ✅ Usuario tiene rol "Jefe de Servicio"
- ✅ Usuario tiene servicio asignado (no NULL)
- ✅ Servicio existe en tabla `servicios`
- ✅ Usuario puede hacer login
- ✅ Ve "Mi Servicio" en sidebar
- ✅ Puede acceder a /service-management
- ✅ Ve estadísticas de su servicio
- ✅ Puede gestionar empleados

**¡Con estos pasos el Jefe de Servicio tendrá acceso completo a la gestión de su servicio!** 🎊