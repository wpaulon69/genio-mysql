require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function fixPermissions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔧 Corrigiendo permisos...');

    // Obtener ID del permiso
    const [perm] = await connection.execute(`
      SELECT id FROM permissions WHERE name = 'MANAGE_SERVICE_EMPLOYEES'
    `);
    
    if (perm.length === 0) {
      console.log('❌ Permiso no encontrado');
      return;
    }
    
    const permissionId = perm[0].id;
    console.log('📋 Permission ID:', permissionId);
    
    // Verificar si ya existe la asignación
    const [existing] = await connection.execute(`
      SELECT * FROM role_permissions WHERE role_id = 2 AND permission_id = ?
    `, [permissionId]);
    
    if (existing.length === 0) {
      // Insertar la asignación
      await connection.execute(`
        INSERT INTO role_permissions (role_id, permission_id) VALUES (2, ?)
      `, [permissionId]);
      console.log('✅ Permiso asignado al rol 2');
    } else {
      console.log('✅ Permiso ya estaba asignado');
    }
    
    // Verificar resultado final
    const [final] = await connection.execute(`
      SELECT 
        rp.role_id,
        p.name as permission_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = 2 AND p.name = 'MANAGE_SERVICE_EMPLOYEES'
    `);
    
    if (final.length > 0) {
      console.log('🎉 Verificación exitosa: Rol 2 tiene permiso MANAGE_SERVICE_EMPLOYEES');
    } else {
      console.log('❌ Algo salió mal');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixPermissions();