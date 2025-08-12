-- =====================================================
-- SCRIPT DE VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar después de aplicar las migraciones
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA DE TABLAS
SELECT 
    'TABLAS CREADAS' as verificacion,
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('users', 'user_roles', 'permissions', 'role_permissions', 'user_sessions')
ORDER BY TABLE_NAME;

-- 2. VERIFICAR DATOS MAESTROS
SELECT 'ROLES CREADOS' as verificacion, COUNT(*) as total FROM user_roles;
SELECT 'PERMISOS CREADOS' as verificacion, COUNT(*) as total FROM permissions;
SELECT 'ASIGNACIONES ROLES-PERMISOS' as verificacion, COUNT(*) as total FROM role_permissions;
SELECT 'USUARIOS CREADOS' as verificacion, COUNT(*) as total FROM users;

-- 3. VERIFICAR INTEGRIDAD REFERENCIAL
SELECT 
    'FOREIGN KEYS' as verificacion,
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_NAME IN ('users', 'role_permissions', 'user_sessions')
ORDER BY TABLE_NAME;

-- 4. VERIFICAR USUARIO ADMINISTRADOR
SELECT 
    'USUARIO ADMIN' as verificacion,
    u.email,
    u.name,
    ur.display_name as role,
    u.is_active,
    u.must_change_password,
    u.created_at
FROM users u
JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email = 'admin@shiftflow.com';

-- 5. VERIFICAR PERMISOS POR ROL
SELECT 
    'PERMISOS POR ROL' as verificacion,
    ur.display_name as role,
    COUNT(rp.permission_id) as permissions_count
FROM user_roles ur
LEFT JOIN role_permissions rp ON ur.id = rp.role_id
GROUP BY ur.id, ur.display_name
ORDER BY ur.level;

-- 6. VERIFICAR TABLAS EXISTENTES (NO DEBEN HABERSE AFECTADO)
SELECT 
    'TABLAS EXISTENTES' as verificacion,
    TABLE_NAME,
    TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('servicios', 'empleados', 'horarios', 'horario_detalles')
ORDER BY TABLE_NAME;

-- 7. VERIFICAR ÍNDICES CREADOS
SELECT 
    'ÍNDICES CREADOS' as verificacion,
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('users', 'user_roles', 'permissions', 'role_permissions', 'user_sessions')
AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_NAME, INDEX_NAME;

-- =====================================================
-- RESULTADOS ESPERADOS:
-- =====================================================
/*
TABLAS CREADAS: 5 tablas (users, user_roles, permissions, role_permissions, user_sessions)
ROLES CREADOS: 5 roles
PERMISOS CREADOS: 21 permisos
ASIGNACIONES ROLES-PERMISOS: Múltiples asignaciones
USUARIOS CREADOS: 1 usuario (admin)
FOREIGN KEYS: 5 foreign keys
USUARIO ADMIN: 1 registro activo
PERMISOS POR ROL: Todos los roles con permisos asignados
TABLAS EXISTENTES: Todas las tablas originales intactas
ÍNDICES CREADOS: Múltiples índices para performance
*/