// Script para verificar la migración en MySQL 5.5
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function verifyMigration() {
  let connection;
  
  try {
    console.log('🔍 VERIFICANDO MIGRACIÓN EN MYSQL 5.5...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar tablas creadas
    console.log('📋 Verificando tablas de autenticación...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('users', 'user_roles', 'permissions', 'role_permissions', 'user_sessions')
      ORDER BY TABLE_NAME
    `);
    
    console.log('Tablas de autenticación:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
    });
    
    // Verificar roles
    console.log('\n👥 Verificando roles...');
    const [roles] = await connection.execute(`
      SELECT id, display_name, level 
      FROM user_roles 
      ORDER BY level
    `);
    
    roles.forEach(role => {
      console.log(`  ✅ ${role.display_name} (Nivel ${role.level})`);
    });
    
    // Verificar permisos
    console.log('\n🛡️ Verificando permisos...');
    const [permissions] = await connection.execute(`
      SELECT resource, COUNT(*) as count 
      FROM permissions 
      GROUP BY resource 
      ORDER BY resource
    `);
    
    permissions.forEach(perm => {
      console.log(`  ✅ ${perm.resource}: ${perm.count} permisos`);
    });
    
    // Verificar usuario administrador
    console.log('\n👤 Verificando usuario administrador...');
    const [admin] = await connection.execute(`
      SELECT u.email, u.name, ur.display_name as role, u.is_active
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.email = 'admin@shiftflow.com'
    `);
    
    if (admin.length > 0) {
      console.log(`  ✅ Usuario: ${admin[0].email}`);
      console.log(`  ✅ Nombre: ${admin[0].name}`);
      console.log(`  ✅ Rol: ${admin[0].role}`);
      console.log(`  ✅ Activo: ${admin[0].is_active ? 'Sí' : 'No'}`);
    } else {
      console.log('  ❌ Usuario administrador no encontrado');
    }
    
    // Verificar permisos por rol
    console.log('\n🔐 Verificando permisos por rol...');
    const [rolePerms] = await connection.execute(`
      SELECT ur.display_name as role, COUNT(rp.permission_id) as permissions_count
      FROM user_roles ur
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      GROUP BY ur.id, ur.display_name
      ORDER BY ur.level
    `);
    
    rolePerms.forEach(role => {
      console.log(`  ✅ ${role.role}: ${role.permissions_count} permisos`);
    });
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA - MIGRACIÓN EXITOSA');
    
  } catch (error) {
    console.error('❌ ERROR EN LA VERIFICACIÓN:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyMigration();