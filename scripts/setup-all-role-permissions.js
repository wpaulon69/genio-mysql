const mysql = require('mysql2/promise');

async function setupAllRolePermissions() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'hospital_shifts'
    });

    console.log('=== CONFIGURANDO PERMISOS PARA TODOS LOS ROLES ===\n');

    // Definir todos los permisos necesarios
    const allPermissions = [
      { name: 'manage_users', resource: 'users', action: 'manage', description: 'Gestionar usuarios del sistema' },
      { name: 'manage_all_services', resource: 'services', action: 'manage_all', description: 'Gestionar todos los servicios' },
      { name: 'manage_all_employees', resource: 'employees', action: 'manage_all', description: 'Gestionar todos los empleados' },
      { name: 'manage_all_schedules', resource: 'schedules', action: 'manage_all', description: 'Gestionar todos los horarios' },
      { name: 'view_all_reports', resource: 'reports', action: 'view_all', description: 'Ver todos los informes' },
      { name: 'system_settings', resource: 'system', action: 'settings', description: 'Configurar sistema' },
      { name: 'manage_holidays', resource: 'holidays', action: 'manage', description: 'Gestionar feriados' },
      { name: 'approve_shift_changes', resource: 'shifts', action: 'approve_changes', description: 'Aprobar cambios de turno' },
      { name: 'view_all_services', resource: 'services', action: 'view_all', description: 'Ver todos los servicios' },
      { name: 'view_all_employees', resource: 'employees', action: 'view_all', description: 'Ver todos los empleados' },
      { name: 'manage_service_employees', resource: 'employees', action: 'manage_service', description: 'Gestionar empleados del servicio' },
      { name: 'manage_service_schedules', resource: 'schedules', action: 'manage_service', description: 'Gestionar horarios del servicio' },
      { name: 'view_service_employees', resource: 'employees', action: 'view_service', description: 'Ver empleados del servicio' },
      { name: 'view_service_schedules', resource: 'schedules', action: 'view_service', description: 'Ver horarios del servicio' },
      { name: 'manage_own_service', resource: 'services', action: 'manage_own', description: 'Gestionar servicio propio' },
      { name: 'view_own_service', resource: 'services', action: 'view_own', description: 'Ver servicio propio' },
      { name: 'view_service_reports', resource: 'reports', action: 'view_service', description: 'Ver informes del servicio' },
      { name: 'view_own_profile', resource: 'profile', action: 'view_own', description: 'Ver perfil propio' }
    ];

    // Definir permisos por rol
    const rolePermissionsMap = {
      super_admin: [
        'manage_users', 'manage_all_services', 'manage_all_employees', 'manage_all_schedules',
        'view_all_reports', 'system_settings', 'manage_holidays', 'approve_shift_changes',
        'view_all_services', 'view_all_employees'
      ],
      admin_hospital: [
        'manage_users', 'manage_all_services', 'manage_all_employees', 'view_all_services',
        'view_all_employees', 'view_all_reports', 'manage_holidays', 'approve_shift_changes'
      ],
      jefe_servicio: [
        'manage_service_employees', 'manage_service_schedules', 'view_service_employees',
        'view_service_schedules', 'manage_own_service', 'view_own_service',
        'view_service_reports', 'approve_shift_changes', 'view_own_profile'
      ],
      
      empleado: [
        'view_own_profile'
      ]
    };

    // 1. Crear todos los permisos si no existen
    console.log('1. Creando permisos necesarios...');
    for (const perm of allPermissions) {
      const [existing] = await connection.execute(
        'SELECT id FROM permissions WHERE name = ?', 
        [perm.name]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO permissions (name, resource, action, description) VALUES (?, ?, ?, ?)',
          [perm.name, perm.resource, perm.action, perm.description]
        );
        console.log(`  ✅ Creado: ${perm.name}`);
      } else {
        console.log(`  ⏭️  Ya existe: ${perm.name}`);
      }
    }

    // 2. Obtener todos los roles
    console.log('\n2. Obteniendo roles...');
    const [roles] = await connection.execute('SELECT id, name, display_name FROM user_roles');
    console.log(`Encontrados ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`  - ${role.name} (${role.display_name})`);
    });

    // 3. Asignar permisos a cada rol
    console.log('\n3. Asignando permisos a roles...');
    for (const role of roles) {
      const roleName = role.name;
      const permissionsForRole = rolePermissionsMap[roleName] || [];
      
      console.log(`\n  Configurando rol: ${role.display_name} (${roleName})`);
      
      if (permissionsForRole.length === 0) {
        console.log('    ⚠️  No hay permisos definidos para este rol');
        continue;
      }

      // Limpiar permisos existentes del rol
      await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [role.id]);
      
      // Asignar nuevos permisos
      for (const permName of permissionsForRole) {
        const [permResult] = await connection.execute(
          'SELECT id FROM permissions WHERE name = ?', 
          [permName]
        );
        
        if (permResult.length > 0) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [role.id, permResult[0].id]
          );
          console.log(`    ✅ ${permName}`);
        } else {
          console.log(`    ❌ Permiso no encontrado: ${permName}`);
        }
      }
    }

    // 4. Verificar configuración final
    console.log('\n4. Verificación final...');
    for (const role of roles) {
      const [rolePerms] = await connection.execute(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
        ORDER BY p.name
      `, [role.id]);
      
      console.log(`\n  ${role.display_name} (${rolePerms.length} permisos):`);
      rolePerms.forEach(perm => {
        console.log(`    - ${perm.name}`);
      });
    }

    await connection.end();
    console.log('\n=== CONFIGURACIÓN COMPLETA ===');
    console.log('\n⚠️  IMPORTANTE: Todos los usuarios deben hacer logout y login para que los cambios tomen efecto');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

setupAllRolePermissions();