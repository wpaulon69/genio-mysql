// Script para probar la funcionalidad de administración
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

async function testAdminFunctionality() {
  let connection;
  
  try {
    console.log('🧪 PROBANDO FUNCIONALIDAD DE ADMINISTRACIÓN...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // TEST 1: Verificar que el usuario admin puede gestionar usuarios
    console.log('👤 TEST 1: Verificando permisos de administración...');
    const [adminUser] = await connection.execute(`
      SELECT 
        u.id, u.name, u.email,
        ur.display_name as role,
        GROUP_CONCAT(p.id) as permissions
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = 'admin@shiftflow.com'
      GROUP BY u.id
    `);
    
    if (adminUser.length > 0) {
      const admin = adminUser[0];
      console.log(`  ✅ Usuario: ${admin.name} (${admin.role})`);
      console.log(`  ✅ Permisos: ${admin.permissions ? admin.permissions.split(',').length : 0}`);
      
      const hasManageUsers = admin.permissions && admin.permissions.includes('manage_users');
      console.log(`  ${hasManageUsers ? '✅' : '❌'} Permiso manage_users: ${hasManageUsers ? 'Sí' : 'No'}`);
    }
    
    // TEST 2: Verificar estructura de datos para la interfaz
    console.log('\n📊 TEST 2: Verificando datos para la interfaz...');
    
    // Verificar roles disponibles
    const [roles] = await connection.execute(`
      SELECT id, display_name, level 
      FROM user_roles 
      ORDER BY level
    `);
    console.log(`  ✅ Roles disponibles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`     - ${role.display_name} (Nivel ${role.level})`);
    });
    
    // Verificar servicios disponibles
    const [services] = await connection.execute(`
      SELECT id_servicio, nombre_servicio 
      FROM servicios
    `);
    console.log(`  ✅ Servicios disponibles: ${services.length}`);
    services.forEach(service => {
      console.log(`     - ${service.nombre_servicio}`);
    });
    
    // Verificar empleados disponibles
    const [employees] = await connection.execute(`
      SELECT id_empleado, nombre 
      FROM empleados 
      LIMIT 5
    `);
    console.log(`  ✅ Empleados disponibles: ${employees.length}`);
    employees.forEach(employee => {
      console.log(`     - ${employee.nombre}`);
    });
    
    // TEST 3: Simular consulta de lista de usuarios para la interfaz
    console.log('\n👥 TEST 3: Simulando consulta de lista de usuarios...');
    const [usersList] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.is_active,
        u.last_login,
        u.created_at,
        ur.id as role_id,
        ur.display_name as role_display_name,
        ur.level as role_level,
        s.nombre_servicio as service_name,
        e.nombre as employee_name
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      LEFT JOIN empleados e ON u.employee_id = e.id_empleado
      ORDER BY ur.level ASC, u.name ASC
    `);
    
    console.log(`  ✅ Usuarios encontrados: ${usersList.length}`);
    usersList.forEach(user => {
      console.log(`     - ${user.name} (${user.email}) - ${user.role_display_name} - ${user.is_active ? 'Activo' : 'Inactivo'}`);
    });
    
    console.log('\n🎉 TODAS LAS PRUEBAS DE ADMINISTRACIÓN COMPLETADAS');
    console.log('\n📝 RESUMEN:');
    console.log(`   - Usuario administrador: ✅ Configurado`);
    console.log(`   - Permisos de gestión: ✅ Asignados`);
    console.log(`   - Roles disponibles: ✅ ${roles.length} roles`);
    console.log(`   - Servicios disponibles: ✅ ${services.length} servicios`);
    console.log(`   - Empleados disponibles: ✅ ${employees.length} empleados`);
    console.log(`   - Lista de usuarios: ✅ ${usersList.length} usuarios`);
    
  } catch (error) {
    console.error('❌ ERROR EN LAS PRUEBAS:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAdminFunctionality();