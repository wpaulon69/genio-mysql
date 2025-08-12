const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkServiceAssignments() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('🔍 VERIFICANDO ASIGNACIONES DE SERVICIOS\n');

    // 1. Ver todos los servicios disponibles
    console.log('🏥 SERVICIOS DISPONIBLES:');
    const [services] = await connection.execute(`
      SELECT id_servicio, nombre_servicio, descripcion
      FROM servicios 
      ORDER BY nombre_servicio ASC
    `);

    services.forEach(service => {
      console.log(`  📋 ID: ${service.id_servicio} - ${service.nombre_servicio}`);
      if (service.descripcion) {
        console.log(`      Descripción: ${service.descripcion}`);
      }
    });

    // 2. Ver usuarios con rol Jefe de Servicio
    console.log('\n👨‍⚕️ JEFES DE SERVICIO:');
    const [jefes] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.service_id,
        s.nombre_servicio,
        u.is_active
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      WHERE ur.name = 'jefe_servicio'
      ORDER BY u.name ASC
    `);

    if (jefes.length === 0) {
      console.log('  ❌ No hay usuarios con rol "Jefe de Servicio"');
    } else {
      jefes.forEach(jefe => {
        console.log(`  👤 ${jefe.name} (${jefe.email})`);
        console.log(`      Estado: ${jefe.is_active ? '✅ Activo' : '❌ Inactivo'}`);
        if (jefe.service_id && jefe.nombre_servicio) {
          console.log(`      🏥 Servicio: ${jefe.nombre_servicio} (ID: ${jefe.service_id})`);
        } else {
          console.log(`      ⚠️  SIN SERVICIO ASIGNADO`);
        }
        console.log('');
      });
    }

    // 3. Ver empleados por servicio
    console.log('👥 EMPLEADOS POR SERVICIO:');
    const [employeesByService] = await connection.execute(`
      SELECT 
        s.id_servicio,
        s.nombre_servicio,
        COUNT(e.id_empleado) as total_empleados,
        GROUP_CONCAT(e.nombre ORDER BY e.nombre ASC SEPARATOR ', ') as empleados
      FROM servicios s
      LEFT JOIN empleados e ON s.id_servicio = e.id_servicio
      GROUP BY s.id_servicio, s.nombre_servicio
      ORDER BY s.nombre_servicio ASC
    `);

    employeesByService.forEach(service => {
      console.log(`  🏥 ${service.nombre_servicio}:`);
      console.log(`      👥 ${service.total_empleados} empleados`);
      if (service.empleados) {
        console.log(`      📋 ${service.empleados}`);
      } else {
        console.log(`      📋 Sin empleados asignados`);
      }
      console.log('');
    });

    // 4. Ver empleados sin servicio
    console.log('🆓 EMPLEADOS SIN SERVICIO ASIGNADO:');
    const [unassignedEmployees] = await connection.execute(`
      SELECT nombre, email_empleado
      FROM empleados 
      WHERE id_servicio IS NULL OR id_servicio = 0
      ORDER BY nombre ASC
    `);

    if (unassignedEmployees.length === 0) {
      console.log('  ✅ Todos los empleados tienen servicio asignado');
    } else {
      console.log(`  📊 Total: ${unassignedEmployees.length} empleados sin asignar`);
      unassignedEmployees.forEach(emp => {
        console.log(`  👤 ${emp.nombre} (${emp.email_empleado})`);
      });
    }

    // 5. Resumen y recomendaciones
    console.log('\n📊 RESUMEN:');
    console.log(`  🏥 Servicios totales: ${services.length}`);
    console.log(`  👨‍⚕️ Jefes de servicio: ${jefes.length}`);
    console.log(`  🆓 Empleados sin servicio: ${unassignedEmployees.length}`);

    console.log('\n💡 RECOMENDACIONES:');
    
    // Jefes sin servicio
    const jefesSinServicio = jefes.filter(j => !j.service_id);
    if (jefesSinServicio.length > 0) {
      console.log(`  ⚠️  ${jefesSinServicio.length} jefe(s) sin servicio asignado:`);
      jefesSinServicio.forEach(jefe => {
        console.log(`      - ${jefe.name} (${jefe.email})`);
      });
      console.log('      💡 Asignar servicio en /admin/users');
    }

    // Servicios sin jefe
    const serviciosConJefe = jefes.filter(j => j.service_id).map(j => j.service_id);
    const serviciosSinJefe = services.filter(s => !serviciosConJefe.includes(s.id_servicio));
    if (serviciosSinJefe.length > 0) {
      console.log(`  📋 ${serviciosSinJefe.length} servicio(s) sin jefe asignado:`);
      serviciosSinJefe.forEach(service => {
        console.log(`      - ${service.nombre_servicio} (ID: ${service.id_servicio})`);
      });
      console.log('      💡 Crear o asignar jefe de servicio');
    }

    if (jefesSinServicio.length === 0 && serviciosSinJefe.length === 0) {
      console.log('  ✅ Todas las asignaciones están correctas');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkServiceAssignments();