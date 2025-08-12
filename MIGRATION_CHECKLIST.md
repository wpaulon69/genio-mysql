# 📋 CHECKLIST DE MIGRACIÓN - Sistema de Autenticación ShiftFlow

## 🎯 CHECKPOINT ACTUAL
- **Fecha:** 8 de Enero 2025
- **Estado:** Desarrollo → Producción
- **Versión:** v1.0.0-auth

---

## 📊 ESTADO ACTUAL DE LA BASE DE DATOS

### ✅ Tablas Existentes (Confirmadas)
- [x] `servicios` - Servicios hospitalarios
- [x] `empleados` - Personal del hospital  
- [x] `turnos_fijos` - Preferencias de turnos
- [x] `asignaciones_empleado` - Licencias y asignaciones
- [x] `holidays` - Días feriados
- [x] `horarios` - Horarios mensuales
- [x] `horario_detalles` - Detalles de turnos
- [x] `problemashorarios` - Violaciones de horarios
- [x] `score_breakdowns` - Puntuaciones de horarios
- [x] `tipos_asignacion` - Tipos de asignaciones

### 🆕 Tablas a Crear (Sistema de Autenticación)
- [ ] `user_roles` - Roles del sistema
- [ ] `permissions` - Permisos disponibles
- [ ] `role_permissions` - Relación roles-permisos
- [ ] `users` - Usuarios del sistema
- [ ] `user_sessions` - Sesiones para auditoría

---

## 🔧 PASOS DE MIGRACIÓN

### PASO 1: Preparación del Entorno
- [ ] **Backup completo de la BD de producción**
  ```bash
  mysqldump -u root -p horarios_des > backup_pre_auth_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Verificar conexión a BD de producción**
  ```bash
  mysql -u root -p -h 10.175.6.16 horarios_des
  ```

- [ ] **Confirmar que las tablas existentes están intactas**
  ```sql
  SELECT COUNT(*) FROM servicios;
  SELECT COUNT(*) FROM empleados;
  SELECT COUNT(*) FROM horarios;
  ```

### PASO 2: Ejecutar Migración de Autenticación
- [ ] **Probar conexión y compatibilidad**
  ```bash
  node scripts/test-mysql55-connection.js
  ```

- [ ] **Ejecutar script de migración específico para MySQL 5.5**
  ```bash
  mysql -u root -p -h 10.175.6.16 horarios_des < database/migrations/001_auth_system_mysql55.sql
  ```

- [ ] **Verificar creación de tablas**
  ```sql
  SHOW TABLES LIKE '%user%';
  SHOW TABLES LIKE '%permission%';
  ```

- [ ] **Verificar datos maestros**
  ```sql
  SELECT * FROM user_roles ORDER BY level;
  SELECT COUNT(*) FROM permissions;
  SELECT COUNT(*) FROM role_permissions;
  ```

### PASO 3: Configuración de la Aplicación
- [ ] **Instalar dependencias de autenticación**
  ```bash
  npm install next-auth bcryptjs @types/bcryptjs
  ```

- [ ] **Configurar variables de entorno de producción**
  ```env
  NEXTAUTH_URL=https://tu-dominio-produccion.com
  NEXTAUTH_SECRET=clave-super-secreta-produccion-256-bits
  ```

- [ ] **Verificar configuración de MySQL en producción**
  ```env
  MYSQL_HOST=10.175.6.16
  MYSQL_USER=root
  MYSQL_PASSWORD=nokia3189
  MYSQL_DATABASE=horarios_des
  ```

### PASO 4: Pruebas de Funcionalidad
- [ ] **Probar login con usuario administrador**
  - Email: `admin@shiftflow.com`
  - Contraseña: `ShiftFlow2025!`

- [ ] **Verificar redirección de rutas protegidas**
  - Acceder a `/services` sin login → debe redirigir a `/auth/signin`
  - Login exitoso → debe redirigir al dashboard

- [ ] **Probar permisos por rol**
  - Super admin: acceso total
  - Roles inferiores: acceso limitado según permisos

### PASO 5: Creación de Usuarios Iniciales
- [ ] **Crear usuarios para cada rol (ejemplos)**
  ```sql
  -- Admin Hospital
  INSERT INTO users (email, name, hashed_password, role_id, is_active, must_change_password) 
  VALUES ('admin.hospital@hospital.com', 'Admin Hospital', '$2a$12$...', 'admin_hospital', TRUE, TRUE);
  
  -- Jefe de Servicio (ejemplo: Emergencias)
  INSERT INTO users (email, name, hashed_password, role_id, service_id, is_active, must_change_password) 
  VALUES ('jefe.emergencias@hospital.com', 'Dr. Jefe Emergencias', '$2a$12$...', 'jefe_servicio', 1, TRUE, TRUE);
  ```

---

## 🚨 PUNTOS CRÍTICOS DE VERIFICACIÓN

### Base de Datos
- [ ] **Integridad referencial:** Todas las foreign keys funcionan
- [ ] **Datos existentes:** Ningún dato previo se perdió
- [ ] **Índices:** Todos los índices se crearon correctamente
- [ ] **Charset:** Todas las tablas usan utf8mb4_unicode_ci

### Aplicación
- [ ] **Rutas protegidas:** Middleware funciona correctamente
- [ ] **Sesiones:** JWT se genera y valida correctamente
- [ ] **Permisos:** Sistema de permisos funciona por rol
- [ ] **UI:** Páginas de login y error se muestran correctamente

### Seguridad
- [ ] **Contraseñas:** Todas están hasheadas con bcrypt
- [ ] **Sesiones:** Tiempo de expiración configurado (8 horas)
- [ ] **HTTPS:** Configurado en producción
- [ ] **Secrets:** Variables de entorno seguras

---

## 🔄 PLAN DE ROLLBACK (Si algo falla)

### Rollback de Base de Datos
```sql
-- Eliminar tablas de autenticación (en orden)
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS user_roles;

-- Restaurar backup si es necesario
-- mysql -u root -p horarios_des < backup_pre_auth_YYYYMMDD_HHMMSS.sql
```

### Rollback de Aplicación
```bash
# Revertir dependencias
npm uninstall next-auth bcryptjs @types/bcryptjs

# Eliminar archivos de autenticación
rm -rf src/lib/auth/
rm -rf src/components/auth/
rm -rf src/app/auth/
rm src/middleware.ts
rm src/app/api/auth/
```

---

## 📈 MÉTRICAS DE ÉXITO

### Funcionalidad
- [ ] ✅ Login exitoso con credenciales válidas
- [ ] ✅ Rechazo de credenciales inválidas
- [ ] ✅ Redirección correcta según permisos
- [ ] ✅ Logout funcional
- [ ] ✅ Sesiones expiran correctamente

### Performance
- [ ] ✅ Tiempo de login < 2 segundos
- [ ] ✅ Verificación de permisos < 100ms
- [ ] ✅ Carga de páginas protegidas < 1 segundo

### Seguridad
- [ ] ✅ No hay acceso sin autenticación
- [ ] ✅ Permisos se respetan estrictamente
- [ ] ✅ Contraseñas no se almacenan en texto plano
- [ ] ✅ Sesiones se invalidan al cerrar

---

## 📞 CONTACTOS DE EMERGENCIA

**En caso de problemas críticos:**
- Desarrollador Principal: [Tu contacto]
- DBA: [Contacto del administrador de BD]
- DevOps: [Contacto de infraestructura]

**Horarios de soporte:**
- Lunes a Viernes: 8:00 - 18:00
- Emergencias: 24/7 (solo críticas)

---

## 📝 NOTAS ADICIONALES

### Usuarios de Prueba Sugeridos
1. **Super Admin:** admin@shiftflow.com
2. **Admin Hospital:** admin.hospital@hospital.com  
3. **Jefe Emergencias:** jefe.emergencias@hospital.com
4. **Supervisor:** supervisor.turno@hospital.com
5. **Empleado:** empleado.test@hospital.com

### Próximas Funcionalidades (Post-Autenticación)
- [ ] Cambio de contraseña obligatorio
- [ ] Recuperación de contraseña por email
- [ ] Auditoría de acciones de usuario
- [ ] Notificaciones de seguridad
- [ ] Integración con Active Directory (futuro)

---

**✅ CHECKPOINT COMPLETADO CUANDO TODOS LOS ITEMS ESTÉN MARCADOS**