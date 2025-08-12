-- =====================================================
-- CHECKPOINT: Sistema de Autenticación ShiftFlow
-- Fecha: 2025-01-08
-- Descripción: Migración completa del sistema de autenticación
-- Estado: DESARROLLO -> PRODUCCIÓN
-- =====================================================

-- VERIFICAR ESTADO ACTUAL DE LA BASE DE DATOS
-- Ejecutar estas consultas ANTES de aplicar las migraciones:

-- 1. Verificar tablas existentes
SELECT TABLE_NAME, TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- 2. Verificar si ya existen tablas de autenticación
SELECT COUNT(*) as auth_tables_exist
FROM INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN (
        'users',
        'user_roles',
        'permissions',
        'role_permissions',
        'user_sessions'
    );

-- =====================================================
-- PASO 1: CREAR TABLAS DE AUTENTICACIÓN
-- =====================================================

-- Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(50) PRIMARY KEY,
    name ENUM(
        'super_admin',
        'admin_hospital',
        'jefe_servicio',
        'supervisor',
        'empleado'
    ) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_roles_level (level)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Roles del sistema de autenticación';

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Permisos del sistema';

-- Tabla de relación roles-permisos
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50),
    permission_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES user_roles (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Relación roles-permisos';

-- Tabla de usuarios del sistema (Compatible con MySQL 5)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    service_id INT NULL,
    employee_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    must_change_password TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES user_roles (id) ON UPDATE CASCADE,
    FOREIGN KEY (service_id) REFERENCES servicios (id_servicio) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES empleados (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role_id),
    INDEX idx_users_service (service_id),
    INDEX idx_users_employee (employee_id),
    INDEX idx_users_active (is_active)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Usuarios del sistema';

-- Tabla de sesiones para auditoría (Compatible con MySQL 5)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_active (is_active),
    INDEX idx_sessions_login_date (login_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Sesiones de usuario para auditoría';

-- =====================================================
-- PASO 2: INSERTAR DATOS MAESTROS
-- =====================================================

-- Insertar roles predefinidos
INSERT IGNORE INTO
    user_roles (
        id,
        name,
        display_name,
        level,
        description
    )
VALUES (
        'super_admin',
        'super_admin',
        'Super Administrador',
        1,
        'Acceso total al sistema - Desarrollo y configuración'
    ),
    (
        'admin_hospital',
        'admin_hospital',
        'Administrador Hospital',
        2,
        'Gestión completa del hospital - Todos los servicios'
    ),
    (
        'jefe_servicio',
        'jefe_servicio',
        'Jefe de Servicio',
        3,
        'Gestión de un servicio específico - Su equipo y horarios'
    ),
    (
        'supervisor',
        'supervisor',
        'Supervisor',
        4,
        'Supervisión de equipo - Visualización y solicitudes'
    ),
    (
        'empleado',
        'empleado',
        'Empleado',
        5,
        'Acceso básico - Solo información personal'
    );

-- Insertar permisos del sistema
INSERT IGNORE INTO
    permissions (
        id,
        name,
        resource,
        action,
        description
    )
VALUES
    -- Servicios
    (
        'manage_all_services',
        'Gestionar Todos los Servicios',
        'services',
        'manage',
        'Crear, editar y eliminar cualquier servicio del hospital'
    ),
    (
        'manage_own_service',
        'Gestionar Propio Servicio',
        'services',
        'manage_own',
        'Gestionar solo el servicio asignado al usuario'
    ),
    (
        'view_all_services',
        'Ver Todos los Servicios',
        'services',
        'view_all',
        'Ver información de todos los servicios del hospital'
    ),
    (
        'view_own_service',
        'Ver Propio Servicio',
        'services',
        'view_own',
        'Ver solo el servicio asignado al usuario'
    ),

-- Empleados
(
    'manage_all_employees',
    'Gestionar Todos los Empleados',
    'employees',
    'manage_all',
    'CRUD completo de todos los empleados'
),
(
    'manage_service_employees',
    'Gestionar Empleados del Servicio',
    'employees',
    'manage_service',
    'Gestionar empleados del propio servicio únicamente'
),
(
    'view_all_employees',
    'Ver Todos los Empleados',
    'employees',
    'view_all',
    'Ver información de todos los empleados del hospital'
),
(
    'view_service_employees',
    'Ver Empleados del Servicio',
    'employees',
    'view_service',
    'Ver empleados del propio servicio únicamente'
),
(
    'view_own_profile',
    'Ver Propio Perfil',
    'employees',
    'view_own',
    'Ver y editar información personal del usuario'
),

-- Horarios
(
    'manage_all_schedules',
    'Gestionar Todos los Horarios',
    'schedules',
    'manage_all',
    'CRUD completo de horarios de todos los servicios'
),
(
    'manage_service_schedules',
    'Gestionar Horarios del Servicio',
    'schedules',
    'manage_service',
    'Gestionar horarios del propio servicio únicamente'
),
(
    'view_all_schedules',
    'Ver Todos los Horarios',
    'schedules',
    'view_all',
    'Ver horarios de todos los servicios del hospital'
),
(
    'view_service_schedules',
    'Ver Horarios del Servicio',
    'schedules',
    'view_service',
    'Ver horarios del propio servicio únicamente'
),
(
    'view_own_schedule',
    'Ver Propio Horario',
    'schedules',
    'view_own',
    'Ver únicamente el horario personal del usuario'
),

-- Intercambios de turnos
(
    'approve_shift_changes',
    'Aprobar Cambios de Turno',
    'shifts',
    'approve',
    'Aprobar o rechazar solicitudes de cambio de turno'
),
(
    'request_shift_changes',
    'Solicitar Cambios de Turno',
    'shifts',
    'request',
    'Solicitar cambios en los turnos asignados'
),
(
    'request_shift_exchange',
    'Solicitar Intercambio',
    'shifts',
    'exchange',
    'Solicitar intercambio de turnos con otros empleados'
),

-- Reportes
(
    'view_all_reports',
    'Ver Todos los Reportes',
    'reports',
    'view_all',
    'Acceso completo a todos los reportes del sistema'
),
(
    'view_service_reports',
    'Ver Reportes del Servicio',
    'reports',
    'view_service',
    'Ver reportes únicamente del propio servicio'
),

-- Configuración
(
    'manage_holidays',
    'Gestionar Feriados',
    'holidays',
    'manage',
    'Crear, editar y eliminar días feriados del sistema'
),
(
    'manage_users',
    'Gestionar Usuarios',
    'users',
    'manage',
    'CRUD completo de usuarios del sistema'
),
(
    'system_settings',
    'Configuración del Sistema',
    'system',
    'settings',
    'Acceso a configuraciones globales del sistema'
);

-- =====================================================
-- PASO 3: ASIGNAR PERMISOS A ROLES
-- =====================================================

-- Super Admin: TODOS los permisos
INSERT IGNORE INTO
    role_permissions (role_id, permission_id)
SELECT 'super_admin', id
FROM permissions;

-- Admin Hospital: Gestión completa excepto configuración del sistema
INSERT IGNORE INTO
    role_permissions (role_id, permission_id)
VALUES (
        'admin_hospital',
        'manage_all_services'
    ),
    (
        'admin_hospital',
        'manage_all_employees'
    ),
    (
        'admin_hospital',
        'manage_all_schedules'
    ),
    (
        'admin_hospital',
        'view_all_services'
    ),
    (
        'admin_hospital',
        'view_all_employees'
    ),
    (
        'admin_hospital',
        'view_all_schedules'
    ),
    (
        'admin_hospital',
        'approve_shift_changes'
    ),
    (
        'admin_hospital',
        'view_all_reports'
    ),
    (
        'admin_hospital',
        'manage_holidays'
    ),
    (
        'admin_hospital',
        'manage_users'
    ),
    (
        'admin_hospital',
        'view_own_profile'
    );

-- Jefe de Servicio: Gestión de su servicio específico
INSERT IGNORE INTO
    role_permissions (role_id, permission_id)
VALUES (
        'jefe_servicio',
        'manage_own_service'
    ),
    (
        'jefe_servicio',
        'manage_service_employees'
    ),
    (
        'jefe_servicio',
        'manage_service_schedules'
    ),
    (
        'jefe_servicio',
        'view_own_service'
    ),
    (
        'jefe_servicio',
        'view_service_employees'
    ),
    (
        'jefe_servicio',
        'view_service_schedules'
    ),
    (
        'jefe_servicio',
        'approve_shift_changes'
    ),
    (
        'jefe_servicio',
        'view_service_reports'
    ),
    (
        'jefe_servicio',
        'request_shift_changes'
    ),
    (
        'jefe_servicio',
        'view_own_profile'
    );

-- Supervisor: Visualización y solicitudes básicas
INSERT IGNORE INTO
    role_permissions (role_id, permission_id)
VALUES (
        'supervisor',
        'view_own_service'
    ),
    (
        'supervisor',
        'view_service_employees'
    ),
    (
        'supervisor',
        'view_service_schedules'
    ),
    (
        'supervisor',
        'request_shift_changes'
    ),
    (
        'supervisor',
        'request_shift_exchange'
    ),
    (
        'supervisor',
        'view_own_profile'
    );

-- Empleado: Solo información personal y básica
INSERT IGNORE INTO
    role_permissions (role_id, permission_id)
VALUES (
        'empleado',
        'view_own_schedule'
    ),
    (
        'empleado',
        'request_shift_exchange'
    ),
    (
        'empleado',
        'view_own_profile'
    );

-- =====================================================
-- PASO 4: CREAR USUARIO ADMINISTRADOR INICIAL
-- =====================================================

-- Crear usuario super administrador inicial
-- Contraseña: ShiftFlow2025! (debe cambiarse en primer login)
INSERT IGNORE INTO
    users (
        id,
        email,
        name,
        hashed_password,
        role_id,
        is_active,
        must_change_password
    )
VALUES (
        'admin-001',
        'admin@shiftflow.com',
        'Administrador Sistema',
        '$2a$12$8K1p/a0drtOzwNuiD4.a4.BQ9QmjfVVdElHiGf5HiRvfi5wUBRWyG', -- ShiftFlow2025!
        'super_admin',
        1,
        1
    );

-- =====================================================
-- PASO 5: VERIFICACIONES POST-MIGRACIÓN
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN (
        'users',
        'user_roles',
        'permissions',
        'role_permissions',
        'user_sessions'
    )
ORDER BY TABLE_NAME;

-- Verificar roles creados
SELECT
    id,
    display_name,
    level,
    (
        SELECT COUNT(*)
        FROM role_permissions
        WHERE
            role_id = ur.id
    ) as permissions_count
FROM user_roles ur
ORDER BY level;

-- Verificar permisos totales
SELECT resource, COUNT(*) as permissions_count
FROM permissions
GROUP BY
    resource
ORDER BY resource;

-- Verificar usuario administrador
SELECT u.email, u.name, ur.display_name as role, u.is_active, u.must_change_password, u.created_at
FROM users u
    JOIN user_roles ur ON u.role_id = ur.id
WHERE
    u.email = 'admin@shiftflow.com';

-- =====================================================
-- NOTAS IMPORTANTES PARA PRODUCCIÓN
-- =====================================================

/*
CREDENCIALES INICIALES:
- Email: admin@shiftflow.com
- Contraseña: ShiftFlow2025!
- IMPORTANTE: Cambiar contraseña en primer login

VERIFICACIONES REQUERIDAS:
1. Todas las consultas SELECT deben devolver datos
2. El usuario admin debe existir y estar activo
3. Todos los roles deben tener permisos asignados
4. Las foreign keys deben estar funcionando

ROLLBACK (si es necesario):
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS user_roles;
*/