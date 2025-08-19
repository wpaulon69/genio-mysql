// =====================================================
// SCRIPT DE PRUEBAS DE FUNCIONALIDAD DE AUTENTICACIÓN
// Ejecutar con: node scripts/test-auth-functionality.js
// =====================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function runTests() {
  let connection;
  
  try {
    console.log('🧪 INICIANDO PRUEBAS DE AUTENTICACIÓN...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // TEST 1: Verificar estructura de tablas
    console.log('📋 TEST 1: Verificando estructura de tablas...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('users', 'user_roles', 'permissions', 'role_permissions', 'user_sessions')
    `);
    
    console.log('Tablas encontradas:', tables.length);
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
    });
    
    // TEST 2: Verificar usuario administrador
    console.log('\n👤 TEST 2: Verificando usuario administrador...');
    const [adminUser] = await connection.execute(`
      SELECT u.*, ur.display_name as role_name
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.email = 'admin@shiftflow.com'
    `);
    
    if (adminUser.length > 0) {
      console.log('  ✅ Usuario administrador encontrado');
      console.log(`     Email: ${adminUser[0].email}`);
      console.log(`     Nombre: ${adminUser[0].name}`);
      console.log(`     Rol: ${adminUser[0].role_name}`);
      console.log(`     Activo: ${adminUser[0].is_active ? 'Sí' : 'No'}`);
    } else {
      console.log('  ❌ Usuario administrador NO encontrado');
    }
    
    // TEST 3: Verificar hash de contraseña
    console.log('\n🔐 TEST 3: Verificando hash de contraseña...');
    if (adminUser.length > 0) {
      const isValidPassword = await bcrypt.compare('ShiftFlow2025!', adminUser[0].hashed_password);
      console.log(`  ${isValidPassword ? '✅' : '❌'} Hash de contraseña ${isValidPassword ? 'válido' : 'inválido'}`);
    }
    
    // TEST 4: Verificar roles y permisos
    console.log('\n🛡️ TEST 4: Verificando roles y permisos...');
    const [rolePermissions] = await connection.execute(`
      SELECT 
        ur.display_name as role,
        COUNT(rp.permission_id) as permissions_count
      FROM user_roles ur
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      GROUP BY ur.id, ur.display_name
      ORDER BY ur.level
    `);
    
    rolePermissions.forEach(role => {
      console.log(`  ✅ ${role.role}: ${role.permissions_count} permisos`);
    });
    
    // TEST 5: Verificar foreign keys
    console.log('\n🔗 TEST 5: Verificando foreign keys...');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        REFERENCED_TABLE_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_NAME IN ('users', 'role_permissions', 'user_sessions')
    `);
    
    console.log(`  ✅ ${foreignKeys.length} foreign keys configuradas`);
    foreignKeys.forEach(fk => {
      console.log(`     ${fk.TABLE_NAME} → ${fk.REFERENCED_TABLE_NAME}`);
    });
    
    // TEST 6: Verificar integridad de datos existentes
    console.log('\n📊 TEST 6: Verificando integridad de datos existentes...');
    const existingTables = ['servicios', 'empleados', 'horarios', 'horario_detalles'];
    
    for (const tableName of existingTables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: ${count[0].total} registros`);
      } catch (error) {
        console.log(`  ❌ Error en ${tableName}: ${error.message}`);
      }
    }
    
    // TEST 7: Simular consulta de autenticación
    console.log('\n🔍 TEST 7: Simulando consulta de autenticación...');
    const [authQuery] = await connection.execute(`
      SELECT 
        u.*,
        ur.name as role_name,
        ur.display_name as role_display_name,
        ur.level as role_level,
        GROUP_CONCAT(p.id) as permissions
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = ? AND u.is_active = TRUE
      GROUP BY u.id
    `, ['admin@shiftflow.com']);
    
    if (authQuery.length > 0) {
      console.log('  ✅ Consulta de autenticación exitosa');
      console.log(`     Permisos encontrados: ${authQuery[0].permissions ? authQuery[0].permissions.split(',').length : 0}`);
    } else {
      console.log('  ❌ Consulta de autenticación falló');
    }
    
    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS');
    
  } catch (error) {
    console.error('❌ ERROR EN LAS PRUEBAS:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función para crear usuarios de prueba adicionales
async function createTestUsers() {
  let connection;
  
  try {
    console.log('\n👥 CREANDO USUARIOS DE PRUEBA...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const testUsers = [
      {
        email: 'admin.hospital@hospital.com',
        name: 'Admin Hospital Test',
        password: 'Hospital2025!',
        role: 'admin_hospital'
      },
      {
        email: 'jefe.emergencias@hospital.com',
        name: 'Dr. Jefe Emergencias',
        password: 'Emergencias2025!',
        role: 'jefe_servicio',
        serviceId: 1
      },
      
      {
        email: 'empleado.test@hospital.com',
        name: 'Empleado Test',
        password: 'Empleado2025!',
        role: 'empleado',
        serviceId: 1,
        employeeId: 1
      }
    ];
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      try {
        await connection.execute(`
          INSERT IGNORE INTO users (email, name, hashed_password, role_id, service_id, employee_id, is_active, must_change_password)
          VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE)
        `, [
          user.email,
          user.name,
          hashedPassword,
          user.role,
          user.serviceId || null,
          user.employeeId || null
        ]);
        
        console.log(`  ✅ Usuario creado: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`  ⚠️ Usuario ya existe: ${user.email}`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR CREANDO USUARIOS:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar pruebas
async function main() {
  await runTests();
  
  // Preguntar si crear usuarios de prueba
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\n¿Crear usuarios de prueba adicionales? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await createTestUsers();
    }
    readline.close();
  });
}

main();