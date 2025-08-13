const mysql = require('mysql2/promise');

async function fixHolidaysPermissionDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'hospital_shifts'
    });

    console.log('=== FIXING HOLIDAYS PERMISSION IN DATABASE ===\n');

    // 1. Verificar si existe el permiso manage_holidays
    console.log('1. Verificando permiso manage_holidays...');
    const [holidaysPermCheck] = await connection.execute(`
      SELECT * FROM permissions WHERE name = 'manage_holidays'
    `);
    
    let holidaysPermId;
    if (holidaysPermCheck.length === 0) {
      console.log('❌ Permiso manage_holidays NO existe. Creándolo...');
      
      const [insertResult] = await connection.execute(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES ('manage_holidays', 'holidays', 'manage', 'Gestionar feriados del sistema')
      `);
      
      holidaysPermId = insertResult.insertId;
      console.log('✅ Permiso manage_holidays creado con ID:', holidaysPermId);
    } else {
      holidaysPermId = holidaysPermCheck[0].id;
      console.log('✅ Permiso manage_holidays existe con ID:', holidaysPermId);
    }

    // 2. Verificar rol admin_hospital
    console.log('\n2. Verificando rol admin_hospital...');
    const [adminRole] = await connection.execute(`
      SELECT * FROM user_roles WHERE name = 'admin_hospital'
    `);
    
    if (adminRole.length === 0) {
      console.log('❌ Rol admin_hospital NO existe');
      await connection.end();
      return;
    }
    
    const adminRoleId = adminRole[0].id;
    console.log('✅ Rol admin_hospital existe con ID:', adminRoleId);

    // 3. Verificar si el permiso está asignado al rol
    console.log('\n3. Verificando asignación del permiso...');
    const [rolePermCheck] = await connection.execute(`
      SELECT * FROM role_permissions 
      WHERE role_id = ? AND permission_id = ?
    `, [adminRoleId, holidaysPermId]);
    
    if (rolePermCheck.length === 0) {
      console.log('❌ Permiso NO asignado al rol. Asignándolo...');
      
      await connection.execute(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
      `, [adminRoleId, holidaysPermId]);
      
      console.log('✅ Permiso manage_holidays asignado a admin_hospital');
    } else {
      console.log('✅ Permiso ya está asignado al rol');
    }

    // 4. Verificar todos los permisos del rol admin_hospital
    console.log('\n4. Permisos actuales del rol admin_hospital:');
    const [allPerms] = await connection.execute(`
      SELECT p.name, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.name
    `, [adminRoleId]);
    
    allPerms.forEach(perm => {
      const isHolidays = perm.name === 'manage_holidays';
      console.log(`  ${isHolidays ? '🎯' : '  '} ${perm.name}: ${perm.description}`);
    });

    // 5. Verificar usuarios con rol admin_hospital
    console.log('\n5. Usuarios con rol admin_hospital:');
    const [adminUsers] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.is_active
      FROM users u
      WHERE u.role_id = ?
    `, [adminRoleId]);
    
    if (adminUsers.length === 0) {
      console.log('❌ No hay usuarios con rol admin_hospital');
    } else {
      adminUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Activo: ${user.is_active ? 'Sí' : 'No'}`);
      });
    }

    await connection.end();
    console.log('\n=== FIX COMPLETE ===');
    console.log('\n⚠️  IMPORTANTE: Haz logout y login nuevamente para que los cambios tomen efecto');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixHolidaysPermissionDB();