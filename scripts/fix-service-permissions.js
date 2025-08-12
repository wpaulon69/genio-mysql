const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixServicePermissions() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('🔧 ARREGLANDO PERMISOS DEL SISTEMA\n');

    // 1. Crear permisos faltantes para jefe de servicio
    console.log('📝 Creando permisos faltantes...');
    
    const servicePermissions = [
      {
        id: 'manage_service_employees',
        name: 'Gestionar Empleados del Servicio',
        resource: 'employees',
        action: 'manage_service',
        description: 'Gestionar empleados del propio servicio únicamente'
      },
      {
        id: 'manage_service_schedules',
        name: 'Gestionar Horarios del Servicio',
        resource: 'schedules',
        action: 'manage_service',
        description: 'Gestionar horarios del propio servicio únicamente'
      },
      {
        id: 'view_service_employees',
        name: 'Ver Empleados del Servicio',
        resource: 'employees',
        action: 'view_service',
        description: 'Ver empleados del propio servicio únicamente'
      },
      {
        id: 'view_service_schedules',
        name: 'Ver Horarios del Servicio',
        resource: 'schedules',
        action: 'view_service',
        description: 'Ver horarios del propio servicio únicamente'
      },
      {
        id: 'manage_own_service',
        name: 'Gestionar Propio Servicio',
        resource: 'services',
        action: 'manage_own',
        description: 'Gestionar solo el servicio asignado al usuario'
      },
      {
        id: 'view_own_service',
        name: 'Ver Propio Servicio',
        resource: 'services',
        action: 'view_own',
        description: 'Ver solo el servicio asignado al usuario'
      },
      {
        id: 'view_service_reports',
        name: 'Ver Reportes del Servicio',
        resource: 'reports',
        action: 'view_service',
        description: 'Ver reportes únicamente del propio servicio'
      },
      {
        id: 'approve_shift_changes',
        name: 'Aprobar Cambios de Turno',
        resource: 'shifts',
        action: 'approve',
        description: 'Aprobar o rechazar solicitudes de cambio de turno'
      }
    ];

    for (const permission of servicePermissions) {
      // Verificar si ya existe
      const [existing] = await connection.execute(`
        SELECT id FROM permissions WHERE id = ?
      `, [permission.id]);

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO permissions (id, name, resource, action, description)
          VALUES (?, ?, ?, ?, ?)
        `, [permission.id, permission.name, permission.resource, permission.action, permission.description]);
        
        console.log(`✅ Creado: ${permission.id}`);
      } else {
        console.log(`⚠️  Ya existe: ${permission.id}`);
      }
    }

    // 2. Asignar permisos al rol jefe_servicio
    console.log('\n🔐 Asignando permisos al rol jefe_servicio...');
    
    const jefeServicioPermissions = [
      'manage_service_employees',
      'manage_service_schedules', 
      'view_service_employees',
      'view_service_schedules',
      'manage_own_service',
      'view_own_service',
      'view_service_reports',
      'approve_shift_changes',
      'view_own_profile'
    ];

    for (const permissionId of jefeServicioPermissions) {
      // Verificar si ya está asignado
      const [existing] = await connection.execute(`
        SELECT role_id FROM role_permissions 
        WHERE role_id = 'jefe_servicio' AND permission_id = ?
      `, [permissionId]);

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ('jefe_servicio', ?)
        `, [permissionId]);
        
        console.log(`✅ Asignado a jefe_servicio: ${permissionId}`);
      } else {
        console.log(`⚠️  Ya asignado: ${permissionId}`);
      }
    }

    // 3. Asignar permisos básicos a otros roles
    console.log('\n👥 Asignando permisos a otros roles...');

    // Admin Hospital
    const adminHospitalPermissions = [
      'manage_all_services',
      'manage_all_employees', 
      'view_all_services',
      'view_all_employees',
      'manage_users',
      'view_all_reports',
      'manage_holidays',
      'approve_shift_changes'
    ];

    for (const permissionId of adminHospitalPermissions) {
      const [existing] = await connection.execute(`
        SELECT role_id FROM role_permissions 
        WHERE role_id = 'admin_hospital' AND permission_id = ?
      `, [permissionId]);

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ('admin_hospital', ?)
        `, [permissionId]);
        
        console.log(`✅ Asignado a admin_hospital: ${permissionId}`);
      }
    }

    // Supervisor
    const supervisorPermissions = [
      'view_service_employees',
      'view_service_schedules',
      'view_own_service',
      'view_own_profile'
    ];

    for (const permissionId of supervisorPermissions) {
      const [existing] = await connection.execute(`
        SELECT role_id FROM role_permissions 
        WHERE role_id = 'supervisor' AND permission_id = ?
      `, [permissionId]);

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ('supervisor', ?)
        `, [permissionId]);
        
        console.log(`✅ Asignado a supervisor: ${permissionId}`);
      }
    }

    // Empleado
    const empleadoPermissions = [
      'view_own_profile'
    ];

    for (const permissionId of empleadoPermissions) {
      const [existing] = await connection.execute(`
        SELECT role_id FROM role_permissions 
        WHERE role_id = 'empleado' AND permission_id = ?
      `, [permissionId]);

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ('empleado', ?)
        `, [permissionId]);
        
        console.log(`✅ Asignado a empleado: ${permissionId}`);
      }
    }

    // 4. Verificar resultado final
    console.log('\n📊 VERIFICACIÓN FINAL:');
    
    const [finalCheck] = await connection.execute(`
      SELECT 
        ur.display_name,
        COUNT(rp.permission_id) as permission_count
      FROM user_roles ur
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      GROUP BY ur.id, ur.display_name
      ORDER BY ur.level ASC
    `);

    finalCheck.forEach(role => {
      console.log(`  ${role.display_name}: ${role.permission_count} permisos`);
    });

    // 5. Verificar específicamente Alamo
    console.log('\n👤 VERIFICACIÓN ALAMO:');
    const [alamoCheck] = await connection.execute(`
      SELECT 
        p.id,
        p.name
      FROM users u
      JOIN role_permissions rp ON u.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = 'calamo@hospital.com'
      ORDER BY p.id
    `);

    console.log(`  📊 Permisos de Alamo: ${alamoCheck.length}`);
    alamoCheck.forEach(perm => {
      console.log(`    - ${perm.id}: ${perm.name}`);
    });

    const hasRequiredPermission = alamoCheck.some(p => p.id === 'manage_service_employees');
    console.log(`  ✅ Tiene manage_service_employees: ${hasRequiredPermission ? 'SÍ' : 'NO'}`);

    console.log('\n🎉 ¡Permisos arreglados exitosamente!');
    console.log('\n🎯 Ahora Alamo debería poder acceder a /service-management');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixServicePermissions();