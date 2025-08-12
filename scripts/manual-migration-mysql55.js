// Script para ejecutar migración manual paso a paso en MySQL 5.5
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function manualMigration() {
  let connection;
  
  try {
    console.log('🔧 EJECUTANDO MIGRACIÓN MANUAL PARA MYSQL 5.5...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // PASO 1: Crear tabla user_roles
    console.log('📋 PASO 1: Creando tabla user_roles...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id VARCHAR(50) PRIMARY KEY,
          name ENUM('super_admin', 'admin_hospital', 'jefe_servicio', 'supervisor', 'empleado') NOT NULL UNIQUE,
          display_name VARCHAR(100) NOT NULL,
          level INT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_user_roles_level (level)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8
      `);
      console.log('  ✅ Tabla user_roles creada');
    } catch (error) {
      console.log('  ❌ Error creando user_roles:', error.message);
    }
    
    // PASO 2: Crear tabla permissions
    console.log('\n🛡️ PASO 2: Creando tabla permissions...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS permissions (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          resource VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          KEY idx_permissions_resource (resource),
          KEY idx_permissions_action (action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8
      `);
      console.log('  ✅ Tabla permissions creada');
    } catch (error) {
      console.log('  ❌ Error creando permissions:', error.message);
    }
    
    // PASO 3: Crear tabla role_permissions
    console.log('\n🔗 PASO 3: Creando tabla role_permissions...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id VARCHAR(50),
          permission_id VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (role_id, permission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8
      `);
      console.log('  ✅ Tabla role_permissions creada');
    } catch (error) {
      console.log('  ❌ Error creando role_permissions:', error.message);
    }
    
    // PASO 4: Crear tabla users
    console.log('\n👤 PASO 4: Creando tabla users...');
    try {
      await connection.execute(`
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
          KEY idx_users_email (email),
          KEY idx_users_role (role_id),
          KEY idx_users_service (service_id),
          KEY idx_users_employee (employee_id),
          KEY idx_users_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8
      `);
      console.log('  ✅ Tabla users creada');
    } catch (error) {
      console.log('  ❌ Error creando users:', error.message);
    }
    
    // PASO 5: Crear tabla user_sessions
    console.log('\n📊 PASO 5: Creando tabla user_sessions...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          logout_at TIMESTAMP NULL,
          is_active TINYINT(1) DEFAULT 1,
          KEY idx_sessions_user (user_id),
          KEY idx_sessions_active (is_active),
          KEY idx_sessions_login_date (login_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8
      `);
      console.log('  ✅ Tabla user_sessions creada');
    } catch (error) {
      console.log('  ❌ Error creando user_sessions:', error.message);
    }
    
    // PASO 6: Insertar roles
    console.log('\n👥 PASO 6: Insertando roles...');
    const roles = [
      ['super_admin', 'super_admin', 'Super Administrador', 1, 'Acceso total al sistema'],
      ['admin_hospital', 'admin_hospital', 'Administrador Hospital', 2, 'Gestión completa del hospital'],
      ['jefe_servicio', 'jefe_servicio', 'Jefe de Servicio', 3, 'Gestión de un servicio específico'],
      ['supervisor', 'supervisor', 'Supervisor', 4, 'Supervisión de equipo'],
      ['empleado', 'empleado', 'Empleado', 5, 'Acceso básico']
    ];
    
    for (const role of roles) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO user_roles (id, name, display_name, level, description) 
          VALUES (?, ?, ?, ?, ?)
        `, role);
        console.log(`  ✅ Rol insertado: ${role[2]}`);
      } catch (error) {
        console.log(`  ⚠️ Rol ya existe: ${role[2]}`);
      }
    }
    
    // PASO 7: Insertar permisos (solo algunos principales)
    console.log('\n🛡️ PASO 7: Insertando permisos principales...');
    const permissions = [
      ['manage_all_services', 'Gestionar Todos los Servicios', 'services', 'manage'],
      ['view_all_services', 'Ver Todos los Servicios', 'services', 'view_all'],
      ['manage_all_employees', 'Gestionar Todos los Empleados', 'employees', 'manage_all'],
      ['view_all_employees', 'Ver Todos los Empleados', 'employees', 'view_all'],
      ['view_own_profile', 'Ver Propio Perfil', 'employees', 'view_own'],
      ['manage_all_schedules', 'Gestionar Todos los Horarios', 'schedules', 'manage_all'],
      ['view_all_schedules', 'Ver Todos los Horarios', 'schedules', 'view_all'],
      ['view_own_schedule', 'Ver Propio Horario', 'schedules', 'view_own'],
      ['view_all_reports', 'Ver Todos los Reportes', 'reports', 'view_all'],
      ['manage_users', 'Gestionar Usuarios', 'users', 'manage']
    ];
    
    for (const perm of permissions) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO permissions (id, name, resource, action, description) 
          VALUES (?, ?, ?, ?, ?)
        `, [...perm, `Permiso para ${perm[1].toLowerCase()}`]);
        console.log(`  ✅ Permiso insertado: ${perm[1]}`);
      } catch (error) {
        console.log(`  ⚠️ Permiso ya existe: ${perm[1]}`);
      }
    }
    
    // PASO 8: Asignar permisos a super_admin
    console.log('\n🔐 PASO 8: Asignando permisos a super_admin...');
    try {
      await connection.execute(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT 'super_admin', id FROM permissions
      `);
      console.log('  ✅ Permisos asignados a super_admin');
    } catch (error) {
      console.log('  ❌ Error asignando permisos:', error.message);
    }
    
    // PASO 9: Crear usuario administrador
    console.log('\n👤 PASO 9: Creando usuario administrador...');
    try {
      await connection.execute(`
        INSERT IGNORE INTO users (
          id, email, name, hashed_password, role_id, is_active, must_change_password
        ) VALUES (
          'admin-001',
          'admin@shiftflow.com',
          'Administrador Sistema',
          '$2a$12$8K1p/a0drtOzwNuiD4.a4.BQ9QmjfVVdElHiGf5HiRvfi5wUBRWyG',
          'super_admin',
          1,
          1
        )
      `);
      console.log('  ✅ Usuario administrador creado');
      console.log('     Email: admin@shiftflow.com');
      console.log('     Contraseña: ShiftFlow2025!');
    } catch (error) {
      console.log('  ❌ Error creando usuario:', error.message);
    }
    
    console.log('\n🎉 MIGRACIÓN MANUAL COMPLETADA');
    
  } catch (error) {
    console.error('❌ ERROR EN LA MIGRACIÓN:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

manualMigration();