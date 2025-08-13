const mysql = require('mysql2/promise');

async function debugHolidaysPermission() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'hospital_shifts'
    });

    console.log('=== DEBUGGING HOLIDAYS PERMISSION ===\n');

    // 1. Verificar usuarios admin_hospital
    console.log('1. Usuarios con rol admin_hospital:');
    const [adminUsers] = await connection.execute(`
      SELECT u.id, u.name, u.email, r.name as role_name, r.display_name
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      WHERE r.name = 'admin_hospital'
    `);
    
    if (adminUsers.length === 0) {
      console.log('❌ No hay usuarios con rol admin_hospital');
    } else {
      adminUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.display_name}`);
      });
    }

    // 2. Verificar permisos del rol admin_hospital
    console.log('\n2. Permisos del rol admin_hospital:');
    const [rolePermissions] = await connection.execute(`
      SELECT r.name as role_name, p.name as permission_name, p.description
      FROM user_roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'admin_hospital'
      ORDER BY p.name
    `);
    
    if (rolePermissions.length === 0) {
      console.log('❌ No hay permisos asignados al rol admin_hospital');
    } else {
      rolePermissions.forEach(perm => {
        const isHolidays = perm.permission_name === 'manage_holidays';
        console.log(`  ${isHolidays ? '✅' : '-'} ${perm.permission_name}: ${perm.description}`);
      });
    }

    // 3. Verificar si existe el permiso manage_holidays
    console.log('\n3. Verificando permiso manage_holidays:');
    const [holidaysPerm] = await connection.execute(`
      SELECT * FROM permissions WHERE name = 'manage_holidays'
    `);
    
    if (holidaysPerm.length === 0) {
      console.log('❌ El permiso manage_holidays NO existe en la base de datos');
      
      // Mostrar permisos disponibles
      const [allPerms] = await connection.execute(`
        SELECT name, description FROM permissions ORDER BY name
      `);
      console.log('\nPermisos disponibles en la base de datos:');
      allPerms.forEach(perm => {
        console.log(`  - ${perm.name}: ${perm.description}`);
      });
    } else {
      console.log('✅ El permiso manage_holidays existe:');
      holidaysPerm.forEach(perm => {
        console.log(`  ID: ${perm.id}, Name: ${perm.name}, Description: ${perm.description}`);
      });
    }

    // 4. Verificar roles disponibles
    console.log('\n4. Roles disponibles:');
    const [roles] = await connection.execute(`
      SELECT id, name, display_name, level FROM user_roles ORDER BY level
    `);
    roles.forEach(role => {
      console.log(`  - ${role.name} (${role.display_name}) - Level: ${role.level}`);
    });

    await connection.end();
    console.log('\n=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugHolidaysPermission();