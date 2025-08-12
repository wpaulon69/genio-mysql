const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function debugAlamoPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('🔍 DIAGNOSTICANDO PERMISOS DE ALAMO\n');

    // 1. Verificar información de Alamo
    console.log('👤 INFORMACIÓN DE USUARIO:');
    const [alamoInfo] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role_id,
        u.service_id,
        u.is_active,
        ur.name as role_name,
        ur.display_name as role_display,
        s.nombre_servicio
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      WHERE u.email = 'calamo@hospital.com'
    `);

    if (alamoInfo.length === 0) {
      console.log('❌ Usuario Alamo no encontrado');
      return;
    }

    const alamo = alamoInfo[0];
    console.log(`  📧 Email: ${alamo.email}`);
    console.log(`  👤 Nombre: ${alamo.name}`);
    console.log(`  🔐 Rol ID: ${alamo.role_id}`);
    console.log(`  🏷️  Rol Nombre: ${alamo.role_name}`);
    console.log(`  🎭 Rol Display: ${alamo.role_display}`);
    console.log(`  🏥 Servicio ID: ${alamo.service_id}`);
    console.log(`  🏥 Servicio Nombre: ${alamo.nombre_servicio || 'N/A'}`);
    console.log(`  ✅ Activo: ${alamo.is_active ? 'Sí' : 'No'}`);

    // 2. Verificar permisos del rol
    console.log('\n🔐 PERMISOS DEL ROL:');
    const [rolePermissions] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.resource,
        p.action,
        p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `, [alamo.role_id]);

    if (rolePermissions.length === 0) {
      console.log('❌ El rol no tiene permisos asignados');
    } else {
      console.log(`  📊 Total permisos: ${rolePermissions.length}`);
      rolePermissions.forEach(perm => {
        console.log(`  - ${perm.id} (${perm.resource}/${perm.action}): ${perm.name}`);
      });
    }

    // 3. Verificar si tiene el permiso específico
    console.log('\n🎯 PERMISO ESPECÍFICO REQUERIDO:');
    const requiredPermission = 'manage_service_employees';
    const hasPermission = rolePermissions.some(p => p.id === requiredPermission);
    
    console.log(`  🔍 Buscando: ${requiredPermission}`);
    console.log(`  ✅ Tiene permiso: ${hasPermission ? 'SÍ' : 'NO'}`);

    // 4. Verificar si el permiso existe en la base de datos
    console.log('\n📋 VERIFICAR PERMISO EN BD:');
    const [permissionExists] = await connection.execute(`
      SELECT id, name, description FROM permissions WHERE id = ?
    `, [requiredPermission]);

    if (permissionExists.length === 0) {
      console.log(`❌ El permiso '${requiredPermission}' NO EXISTE en la base de datos`);
    } else {
      console.log(`✅ El permiso existe: ${permissionExists[0].name}`);
    }

    // 5. Verificar todos los roles y sus permisos
    console.log('\n🔍 TODOS LOS ROLES Y SUS PERMISOS:');
    const [allRoles] = await connection.execute(`
      SELECT 
        ur.id,
        ur.name,
        ur.display_name,
        COUNT(rp.permission_id) as permission_count
      FROM user_roles ur
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      GROUP BY ur.id, ur.name, ur.display_name
      ORDER BY ur.level ASC
    `);

    allRoles.forEach(role => {
      console.log(`  ${role.display_name} (${role.name}): ${role.permission_count} permisos`);
    });

    // 6. Mostrar permisos disponibles relacionados con servicios
    console.log('\n🏥 PERMISOS RELACIONADOS CON SERVICIOS:');
    const [servicePermissions] = await connection.execute(`
      SELECT id, name, description 
      FROM permissions 
      WHERE id LIKE '%service%' OR resource = 'services' OR resource = 'employees'
      ORDER BY id
    `);

    servicePermissions.forEach(perm => {
      console.log(`  - ${perm.id}: ${perm.name}`);
    });

    // 7. Recomendaciones
    console.log('\n💡 DIAGNÓSTICO Y RECOMENDACIONES:');
    
    if (!hasPermission) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log(`   El rol '${alamo.role_name}' no tiene el permiso '${requiredPermission}'`);
      console.log('\n🔧 SOLUCIONES POSIBLES:');
      console.log('   1. Agregar el permiso al rol jefe_servicio');
      console.log('   2. Verificar que el permiso existe en la tabla permissions');
      console.log('   3. Actualizar el sistema de permisos en el código');
    }

    if (!alamo.service_id) {
      console.log('⚠️  ADVERTENCIA: Usuario sin servicio asignado');
    }

    if (!alamo.is_active) {
      console.log('❌ PROBLEMA: Usuario inactivo');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugAlamoPermissions();