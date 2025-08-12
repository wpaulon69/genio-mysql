require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkUserPermissions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando permisos de usuarios...');

    // Verificar usuarios con rol de jefe de servicio
    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role_id,
        u.service_id,
        s.nombre_servicio
      FROM users u
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      WHERE u.role_id = 2
    `);
    
    console.log('\n👨‍⚕️ Jefes de servicio encontrados:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Role ID: ${user.role_id}, Service ID: ${user.service_id}`);
      console.log(`  Servicio: ${user.nombre_servicio || 'Sin asignar'}`);
      console.log('');
    });

    // Verificar permisos del rol
    const [rolePermissions] = await connection.execute(`
      SELECT 
        rp.role_id,
        p.name as permission_name,
        p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = 2
    `);
    
    console.log('🔐 Permisos del rol Jefe de Servicio (role_id = 2):');
    rolePermissions.forEach(perm => {
      console.log(`- ${perm.permission_name}: ${perm.description}`);
    });

    // Verificar si existe el permiso MANAGE_SERVICE_EMPLOYEES
    const [manageServicePerm] = await connection.execute(`
      SELECT * FROM permissions WHERE name = 'MANAGE_SERVICE_EMPLOYEES'
    `);
    
    if (manageServicePerm.length > 0) {
      console.log('\n✅ Permiso MANAGE_SERVICE_EMPLOYEES existe');
      
      const [hasPermission] = await connection.execute(`
        SELECT * FROM role_permissions 
        WHERE role_id = 2 AND permission_id = ?
      `, [manageServicePerm[0].id]);
      
      if (hasPermission.length > 0) {
        console.log('✅ Jefe de servicio TIENE el permiso MANAGE_SERVICE_EMPLOYEES');
      } else {
        console.log('❌ Jefe de servicio NO TIENE el permiso MANAGE_SERVICE_EMPLOYEES');
      }
    } else {
      console.log('❌ Permiso MANAGE_SERVICE_EMPLOYEES NO EXISTE');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserPermissions();