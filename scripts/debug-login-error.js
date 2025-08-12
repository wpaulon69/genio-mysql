// Script para diagnosticar el error de login
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function debugLoginError() {
  let connection;
  
  try {
    console.log('🔍 DIAGNOSTICANDO ERROR DE LOGIN...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Verificar que el usuario existe
    console.log('👤 PASO 1: Verificando usuario administrador...');
    const [users] = await connection.execute(`
      SELECT 
        u.*,
        ur.name as role_name,
        ur.display_name as role_display_name,
        ur.level as role_level
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.email = 'admin@shiftflow.com'
    `);
    
    if (users.length === 0) {
      console.log('  ❌ Usuario no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('  ✅ Usuario encontrado:');
    console.log(`     Email: ${user.email}`);
    console.log(`     Nombre: ${user.name}`);
    console.log(`     Rol: ${user.role_display_name}`);
    console.log(`     Activo: ${user.is_active ? 'Sí' : 'No'}`);
    console.log(`     Hash: ${user.hashed_password.substring(0, 20)}...`);
    
    // 2. Verificar el hash de la contraseña
    console.log('\n🔐 PASO 2: Verificando hash de contraseña...');
    const testPassword = 'ShiftFlow2025!';
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.hashed_password);
      console.log(`  ${isValid ? '✅' : '❌'} Contraseña ${isValid ? 'válida' : 'inválida'}`);
      
      if (!isValid) {
        console.log('  🔧 Generando nuevo hash para verificar...');
        const newHash = await bcrypt.hash(testPassword, 12);
        console.log(`     Nuevo hash: ${newHash}`);
        
        // Actualizar el hash en la base de datos
        await connection.execute(`
          UPDATE users 
          SET hashed_password = ? 
          WHERE email = 'admin@shiftflow.com'
        `, [newHash]);
        console.log('  ✅ Hash actualizado en la base de datos');
      }
    } catch (error) {
      console.log('  ❌ Error verificando contraseña:', error.message);
    }
    
    // 3. Verificar permisos del usuario
    console.log('\n🛡️ PASO 3: Verificando permisos del usuario...');
    const [permissions] = await connection.execute(`
      SELECT p.id, p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `, [user.role_id]);
    
    console.log(`  ✅ Permisos encontrados: ${permissions.length}`);
    permissions.forEach(perm => {
      console.log(`     - ${perm.name} (${perm.id})`);
    });
    
    // 4. Simular la consulta que hace NextAuth
    console.log('\n🔍 PASO 4: Simulando consulta de NextAuth...');
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
      WHERE u.email = ? AND u.is_active = 1
      GROUP BY u.id
    `, ['admin@shiftflow.com']);
    
    if (authQuery.length > 0) {
      const authUser = authQuery[0];
      console.log('  ✅ Consulta de autenticación exitosa');
      console.log(`     Permisos: ${authUser.permissions || 'ninguno'}`);
      console.log(`     Rol: ${authUser.role_name}`);
      
      // Verificar contraseña con el hash actualizado
      const finalCheck = await bcrypt.compare(testPassword, authUser.hashed_password);
      console.log(`  ${finalCheck ? '✅' : '❌'} Verificación final de contraseña: ${finalCheck ? 'exitosa' : 'falló'}`);
    } else {
      console.log('  ❌ Consulta de autenticación falló');
    }
    
    console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ ERROR EN EL DIAGNÓSTICO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugLoginError();