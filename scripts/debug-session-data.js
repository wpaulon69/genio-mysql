const mysql = require('mysql2/promise');

async function debugSessionData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_schedule'
  });

  try {
    console.log('=== DEBUG: Datos de Sesión ===\n');

    // 1. Verificar usuarios en la base de datos
    console.log('1. Usuarios en la base de datos:');
    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.serviceId,
        u.employeeId,
        u.isActive,
        r.name as role_name,
        r.displayName as role_display,
        r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.roleId = r.id
      WHERE u.isActive = 1
      ORDER BY u.email
    `);
    
    console.table(users);

    // 2. Verificar permisos de roles
    console.log('\n2. Permisos por rol:');
    const [rolePermissions] = await connection.execute(`
      SELECT 
        r.name as role_name,
        r.displayName,
        GROUP_CONCAT(rp.permission SEPARATOR ', ') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.roleId
      GROUP BY r.id, r.name, r.displayName
      ORDER BY r.level
    `);
    
    console.table(rolePermissions);

    // 3. Verificar servicios
    console.log('\n3. Servicios disponibles:');
    const [services] = await connection.execute(`
      SELECT 
        id_servicio,
        nombre_servicio,
        dotacion_objetivo,
        habilitar_turno_manana,
        habilitar_turno_tarde,
        habilitar_turno_noche
      FROM servicios
      ORDER BY nombre_servicio
    `);
    
    console.table(services);

    // 4. Verificar empleados por servicio
    console.log('\n4. Empleados por servicio:');
    const [employees] = await connection.execute(`
      SELECT 
        e.id_empleado,
        e.nombre,
        e.apellido,
        e.id_servicio,
        s.nombre_servicio,
        e.activo
      FROM empleados e
      LEFT JOIN servicios s ON e.id_servicio = s.id_servicio
      WHERE e.activo = 1
      ORDER BY s.nombre_servicio, e.nombre
    `);
    
    console.table(employees);

    // 5. Verificar usuario específico (admin hospital)
    console.log('\n5. Usuario Admin Hospital específico:');
    const [adminUser] = await connection.execute(`
      SELECT 
        u.*,
        r.name as role_name,
        r.displayName as role_display,
        r.level as role_level,
        GROUP_CONCAT(rp.permission SEPARATOR ', ') as permissions
      FROM users u
      LEFT JOIN roles r ON u.roleId = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.roleId
      WHERE u.email = 'admin@hospital.com'
      GROUP BY u.id
    `);
    
    if (adminUser.length > 0) {
      console.log('Admin user encontrado:');
      console.log(JSON.stringify(adminUser[0], null, 2));
    } else {
      console.log('❌ No se encontró usuario admin@hospital.com');
    }

    console.log('\n=== Fin del Debug ===');

  } catch (error) {
    console.error('Error en debug:', error);
  } finally {
    await connection.end();
  }
}

debugSessionData();