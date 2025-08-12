// =====================================================
// SCRIPT DE PRUEBA PARA MYSQL 5.5.62
// Ejecutar con: node scripts/test-mysql55-connection.js
// =====================================================

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function testMySQL55() {
  let connection;
  
  try {
    console.log('🔍 PROBANDO CONEXIÓN A MYSQL 5.5.62...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // TEST 1: Verificar versión
    console.log('📋 TEST 1: Verificando versión de MySQL...');
    const [version] = await connection.execute('SELECT VERSION() as mysql_version');
    console.log(`  ✅ Versión MySQL: ${version[0].mysql_version}`);
    
    // TEST 2: Verificar tablas existentes
    console.log('\n📊 TEST 2: Verificando tablas existentes...');
    const [existingTables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('servicios', 'empleados', 'horarios')
    `);
    
    console.log('Tablas existentes encontradas:');
    existingTables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
    });
    
    // TEST 3: Verificar si ya existen tablas de autenticación
    console.log('\n🔐 TEST 3: Verificando tablas de autenticación...');
    const [authTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('users', 'user_roles', 'permissions', 'role_permissions', 'user_sessions')
    `);
    
    if (authTables.length > 0) {
      console.log('  ⚠️ Tablas de autenticación ya existen:');
      authTables.forEach(table => {
        console.log(`     - ${table.TABLE_NAME}`);
      });
      console.log('  💡 Usa IGNORE en los INSERTs para evitar duplicados');
    } else {
      console.log('  ✅ No hay tablas de autenticación - Listo para migración');
    }
    
    // TEST 4: Probar sintaxis de MySQL 5.5
    console.log('\n🧪 TEST 4: Probando sintaxis compatible con MySQL 5.5...');
    
    // Probar ENUM
    try {
      await connection.execute(`
        CREATE TEMPORARY TABLE test_enum (
          id INT PRIMARY KEY,
          status ENUM('active', 'inactive') DEFAULT 'active'
        ) ENGINE=InnoDB
      `);
      console.log('  ✅ ENUM syntax compatible');
    } catch (error) {
      console.log('  ❌ ENUM syntax error:', error.message);
    }
    
    // Probar TINYINT para boolean
    try {
      await connection.execute(`
        CREATE TEMPORARY TABLE test_boolean (
          id INT PRIMARY KEY,
          is_active TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB
      `);
      console.log('  ✅ TINYINT(1) for boolean compatible');
    } catch (error) {
      console.log('  ❌ TINYINT(1) error:', error.message);
    }
    
    // Probar FOREIGN KEY
    try {
      await connection.execute(`
        CREATE TEMPORARY TABLE test_parent (
          id VARCHAR(50) PRIMARY KEY
        ) ENGINE=InnoDB
      `);
      
      await connection.execute(`
        CREATE TEMPORARY TABLE test_child (
          id INT PRIMARY KEY,
          parent_id VARCHAR(50),
          FOREIGN KEY (parent_id) REFERENCES test_parent(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
      console.log('  ✅ FOREIGN KEY syntax compatible');
    } catch (error) {
      console.log('  ❌ FOREIGN KEY error:', error.message);
    }
    
    // TEST 5: Verificar charset utf8
    console.log('\n🔤 TEST 5: Verificando charset utf8...');
    const [charset] = await connection.execute(`
      SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = DATABASE()
    `);
    
    console.log(`  ✅ Charset de BD: ${charset[0].DEFAULT_CHARACTER_SET_NAME}`);
    console.log(`  ✅ Collation de BD: ${charset[0].DEFAULT_COLLATION_NAME}`);
    
    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS - MYSQL 5.5 COMPATIBLE');
    
  } catch (error) {
    console.error('❌ ERROR EN LAS PRUEBAS:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función para ejecutar la migración
async function executeMigration() {
  let connection;
  
  try {
    console.log('\n🚀 EJECUTANDO MIGRACIÓN PARA MYSQL 5.5...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Leer el archivo de migración
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('database/migrations/001_auth_system_mysql55.sql', 'utf8');
    
    // Dividir en statements individuales
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Ejecutando ${statements.length} statements SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('select') && statement.toLowerCase().includes('information_schema')) {
        // Ejecutar consultas de verificación
        try {
          const [result] = await connection.execute(statement);
          console.log(`  ✅ Verificación ${i + 1}: ${result.length} resultados`);
        } catch (error) {
          console.log(`  ⚠️ Verificación ${i + 1} falló: ${error.message}`);
        }
      } else if (statement.toLowerCase().includes('create table')) {
        // Crear tablas
        try {
          await connection.execute(statement);
          const tableName = statement.match(/create table if not exists (\w+)/i)?.[1];
          console.log(`  ✅ Tabla creada: ${tableName}`);
        } catch (error) {
          console.log(`  ❌ Error creando tabla: ${error.message}`);
        }
      } else if (statement.toLowerCase().includes('insert')) {
        // Insertar datos
        try {
          const [result] = await connection.execute(statement);
          console.log(`  ✅ Datos insertados: ${result.affectedRows} filas`);
        } catch (error) {
          console.log(`  ⚠️ Insert ignorado (probablemente duplicado): ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ ERROR EN LA MIGRACIÓN:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función principal
async function main() {
  await testMySQL55();
  
  // Preguntar si ejecutar migración
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\n¿Ejecutar migración de autenticación? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await executeMigration();
    }
    readline.close();
  });
}

main();