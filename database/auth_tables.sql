-- Tablas para el sistema de autenticación
-- Ejecutar en MySQL para crear las tablas necesarias

-- Tabla de roles
CREATE TABLE user_roles (
    id VARCHAR(50) PRIMARY KEY,
    name ENUM('super_admin', 'admin_hospital', 'jefe_servicio', 'supervisor', 'empleado') NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de permisos
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos por rol
CREATE TABLE role_permissions (
    role_id VARCHAR(50),
    permission_id VARCHAR(100),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Tabla de usuarios
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    service_id INT NULL,
    employee_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES user_roles(id),
    FOREIGN KEY (service_id) REFERENCES servicios(id_servicio),
    FOREIGN KEY (employee_id) REFERENCES empleados(id_empleado),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role_id),
    INDEX idx_users_service (service_id)
);

-- Tabla de sesiones (para auditoría)
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_active (is_active)
);

-- Insertar roles predefinidos
INSERT INTO user_roles (id, name, display_name, level, description) VALUES
('super_admin', 'super_admin', 'Super Administrador', 1, 'Acceso total al sistema'),
('admin_hospital', 'admin_hospital', 'Administrador Hospital', 2, 'Gestión completa del hospital'),
('jefe_servicio', 'jefe_servicio', 'Jefe de Servicio', 3, 'Gestión de un servicio específico'),
('supervisor', 'supervisor', 'Supervisor', 4, 'Supervisión de equipo'),
('empleado', 'empleado', 'Empleado', 5, 'Acceso básico a información personal');

-- Insertar permisos
INSERT INTO permissions (id, name, resource, action, description) VALUES
-- Servicios
('manage_all_services', 'Gestionar Todos los Servicios', 'services', 'manage', 'Crear, editar y eliminar servicios'),
('manage_own_service', 'Gestionar Propio Servicio', 'services', 'manage_own', 'Gestionar solo el servicio asignado'),
('view_all_services', 'Ver Todos los Servicios', 'services', 'view_all', 'Ver información de todos los servicios'),
('view_own_service', 'Ver Propio Servicio', 'services', 'view_own', 'Ver solo el servicio asignado'),

-- Empleados
('manage_all_employees', 'Gestionar Todos los Empleados', 'employees', 'manage_all', 'CRUD completo de empleados'),
('manage_service_employees', 'Gestionar Empleados del Servicio', 'employees', 'manage_service', 'Gestionar empleados del propio servicio'),
('view_all_employees', 'Ver Todos los Empleados', 'employees', 'view_all', 'Ver información de todos los empleados'),
('view_service_employees', 'Ver Empleados del Servicio', 'employees', 'view_service', 'Ver empleados del propio servicio'),
('view_own_profile', 'Ver Propio Perfil', 'employees', 'view_own', 'Ver y editar información personal'),

-- Horarios
('manage_all_schedules', 'Gestionar Todos los Horarios', 'schedules', 'manage_all', 'CRUD completo de horarios'),
('manage_service_schedules', 'Gestionar Horarios del Servicio', 'schedules', 'manage_service', 'Gestionar horarios del propio servicio'),
('view_all_schedules', 'Ver Todos los Horarios', 'schedules', 'view_all', 'Ver todos los horarios'),
('view_service_schedules', 'Ver Horarios del Servicio', 'schedules', 'view_service', 'Ver horarios del propio servicio'),
('view_own_schedule', 'Ver Propio Horario', 'schedules', 'view_own', 'Ver horario personal'),

-- Intercambios de turnos
('approve_shift_changes', 'Aprobar Cambios de Turno', 'shifts', 'approve', 'Aprobar solicitudes de cambio'),
('request_shift_changes', 'Solicitar Cambios de Turno', 'shifts', 'request', 'Solicitar cambios de turno'),
('request_shift_exchange', 'Solicitar Intercambio', 'shifts', 'exchange', 'Solicitar intercambio con otros empleados'),

-- Reportes
('view_all_reports', 'Ver Todos los Reportes', 'reports', 'view_all', 'Acceso a todos los reportes'),
('view_service_reports', 'Ver Reportes del Servicio', 'reports', 'view_service', 'Reportes del propio servicio'),

-- Configuración
('manage_holidays', 'Gestionar Feriados', 'holidays', 'manage', 'Crear y editar feriados'),
('manage_users', 'Gestionar Usuarios', 'users', 'manage', 'CRUD de usuarios del sistema'),
('system_settings', 'Configuración del Sistema', 'system', 'settings', 'Configuraciones globales');

-- Asignar permisos a roles
-- Super Admin: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM permissions;

-- Admin Hospital: casi todos excepto system_settings
INSERT INTO role_permissions (role_id, permission_id) VALUES
('admin_hospital', 'manage_all_services'),
('admin_hospital', 'manage_all_employees'),
('admin_hospital', 'manage_all_schedules'),
('admin_hospital', 'view_all_services'),
('admin_hospital', 'view_all_employees'),
('admin_hospital', 'view_all_schedules'),
('admin_hospital', 'approve_shift_changes'),
('admin_hospital', 'view_all_reports'),
('admin_hospital', 'manage_holidays'),
('admin_hospital', 'manage_users');

-- Jefe de Servicio: gestión de su servicio
INSERT INTO role_permissions (role_id, permission_id) VALUES
('jefe_servicio', 'manage_own_service'),
('jefe_servicio', 'manage_service_employees'),
('jefe_servicio', 'manage_service_schedules'),
('jefe_servicio', 'view_own_service'),
('jefe_servicio', 'view_service_employees'),
('jefe_servicio', 'view_service_schedules'),
('jefe_servicio', 'approve_shift_changes'),
('jefe_servicio', 'view_service_reports'),
('jefe_servicio', 'view_own_profile');

-- Supervisor: visualización y solicitudes
INSERT INTO role_permissions (role_id, permission_id) VALUES
('supervisor', 'view_own_service'),
('supervisor', 'view_service_employees'),
('supervisor', 'view_service_schedules'),
('supervisor', 'request_shift_changes'),
('supervisor', 'request_shift_exchange'),
('supervisor', 'view_own_profile');

-- Empleado: solo información personal
INSERT INTO role_permissions (role_id, permission_id) VALUES
('empleado', 'view_own_schedule'),
('empleado', 'request_shift_exchange'),
('empleado', 'view_own_profile');