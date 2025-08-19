// Script para corregir las tablas en MySQL 5.5 (limitación de TIMESTAMP)
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function fixMySQL55Tables() {
  let connection;
  
  try {
    console.log('🔧 CORRIGIENDO TABLAS PARA MYSQL 5.5...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Eliminar tablas problemáticas si existen
    console.log('🗑️ Eliminando tablas problemáticas...');
    await connection.execute('DROP TABLE IF EXISTS users');
    await connection.execute('DROP TABLE IF EXISTS user_roles');
    console.log('  ✅ Tablas eliminadas');
    
    // CREAR user_roles (sin updated_at automático)
    console.log('\n📋 Creando tabla user_roles (MySQL 5.5 compatible)...');
    await connection.execute(`
      CREATE TABLE user_roles (
        id VARCHAR(50) PRIMARY KEY,
        name ENUM('super_admin', 'admin_hospital', 'jefe_servicio', 'supervisor', 'empleado') NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        level INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        KEY idx_user_roles_level (level)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);
    console.log('  ✅ Tabla user_roles creada');
    
    // CREAR users (sin updated_at automático)
    console.log('\n👤 Creando tabla users (MySQL 5.5 compatible)...');
    await connection.execute(`
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role_id VARCHAR(50) NOT NULL,
        service_id INT NULL,
        employee_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        must_change_password TINYINT(1) DEFAULT 1,
        last_login DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        KEY idx_users_email (email),
        KEY idx_users_role (role_id),
        KEY idx_users_service (service_id),
        KEY idx_users_employee (employee_id),
        KEY idx_users_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);
    console.log('  ✅ Tabla users creada');
    
    // Insertar roles
    console.log('\n👥 Insertando roles...');
    const roles = [
      ['super_admin', 'super_admin', 'Super Administrador', 1, 'Acceso total al sistema'],
      ['admin_hospital', 'admin_hospital', 'Administrador Hospital', 2, 'Gestión completa del hospital'],
      ['jefe_servicio', 'jefe_servicio', 'Jefe de Servicio', 3, 'Gestión de un servicio específico'],
      ['empleado', 'empleado', 'Empleado', 4, 'Acceso básico']
    ];
    
    for (const role of roles) {
      await connection.execute(`
        INSERT INTO user_roles (id, name, display_name, level, description, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, role);
      console.log(`  ✅ Rol insertado: ${role[2]}`);
    }
    
    // Crear usuario administrador
    console.log('\n👤 Creando usuario administrador...');
    await connection.execute(`
      INSERT INTO users (
        id, email, name, hashed_password, role_id, is_active, must_change_password, updated_at
      ) VALUES (
        'admin-001',
        'admin@shiftflow.com',
        'Administrador Sistema',
        '$2a$12$8K1p/a0drtOzwNuiD4.a4.BQ9QmjfVVdElHiGf5HiRvfi5wUBRWyG',
        'super_admin',
        1,
        1,
        NOW()
      )
    `);
    console.log('  ✅ Usuario administrador creado');
    console.log('     Email: admin@shiftflow.com');
    console.log('     Contraseña: ShiftFlow2025!');
    
    // Verificar todo
    console.log('\n🔍 Verificando migración...');
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('users', 'user_roles', 'permissions', 'role_permissions', 'user_sessions')
      ORDER BY TABLE_NAME
    `);
    
    console.log('Tablas creadas:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
    });
    
    // Verificar usuario admin
    const [admin] = await connection.execute(`
      SELECT u.email, u.name, ur.display_name as role
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.email = 'admin@shiftflow.com'
    `);
    
    if (admin.length > 0) {
      console.log('\n👤 Usuario administrador verificado:');
      console.log(`  ✅ Email: ${admin[0].email}`);
      console.log(`  ✅ Nombre: ${admin[0].name}`);
      console.log(`  ✅ Rol: ${admin[0].role}`);
    }
    
    console.log('\n🎉 MIGRACIÓN CORREGIDA Y COMPLETADA PARA MYSQL 5.5');
    console.log('\n📝 CREDENCIALES DE ACCESO:');
    console.log('   Email: admin@shiftflow.com');
    console.log('   Contraseña: ShiftFlow2025!');
    console.log('   (Debe cambiar contraseña en primer login)');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMySQL55Tables();