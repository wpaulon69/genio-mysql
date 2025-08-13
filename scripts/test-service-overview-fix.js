const mysql = require('mysql2/promise');

async function testServiceOverviewFix() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'hospital_shifts'
    });

    console.log('=== TESTING SERVICE OVERVIEW FIX ===\n');

    // 1. Test services data
    console.log('1. Testing services data...');
    const [services] = await connection.execute(`
      SELECT id_servicio, nombre_servicio, descripcion 
      FROM servicios 
      ORDER BY nombre_servicio ASC
    `);
    console.log(`Found ${services.length} services`);
    services.forEach(service => {
      console.log(`  - ${service.nombre_servicio} (ID: ${service.id_servicio})`);
    });

    // 2. Test employees data with proper structure
    console.log('\n2. Testing employees data...');
    const [employees] = await connection.execute(`
      SELECT 
        e.id_empleado,
        e.id_servicio,
        e.nombre,
        e.email_empleado,
        e.trabaja_feriados,
        e.elegible_franco_pos_guardia,
        e.prefiere_trabajar_fines_semana,
        e.disponibilidad_general,
        e.restricciones_especificas,
        s.nombre_servicio
      FROM empleados e
      LEFT JOIN servicios s ON e.id_servicio = s.id_servicio
      ORDER BY e.nombre ASC
    `);
    console.log(`Found ${employees.length} employees`);

    // 3. Group employees by service
    console.log('\n3. Employees by service:');
    const employeesByService = {};
    const unassignedEmployees = [];

    employees.forEach(emp => {
      if (!emp.id_servicio) {
        unassignedEmployees.push(emp);
      } else {
        const serviceName = emp.nombre_servicio || `Servicio ${emp.id_servicio}`;
        if (!employeesByService[serviceName]) {
          employeesByService[serviceName] = [];
        }
        employeesByService[serviceName].push(emp);
      }
    });

    Object.keys(employeesByService).forEach(serviceName => {
      console.log(`\n  ${serviceName}:`);
      employeesByService[serviceName].forEach(emp => {
        const badges = [];
        if (emp.trabaja_feriados) badges.push('Feriados');
        if (emp.prefiere_trabajar_fines_semana) badges.push('Fines de Semana');
        if (emp.elegible_franco_pos_guardia) badges.push('Franco Post-Guardia');
        
        console.log(`    - ${emp.nombre} (${emp.email_empleado}) ${badges.length ? '[' + badges.join(', ') + ']' : ''}`);
      });
    });

    if (unassignedEmployees.length > 0) {
      console.log('\n  Sin Asignar:');
      unassignedEmployees.forEach(emp => {
        console.log(`    - ${emp.nombre} (${emp.email_empleado})`);
      });
    }

    // 4. Test assignment functionality (simulate)
    console.log('\n4. Testing assignment logic...');
    if (unassignedEmployees.length > 0 && services.length > 0) {
      const testEmployee = unassignedEmployees[0];
      const testService = services[0];
      
      console.log(`Simulating assignment of ${testEmployee.nombre} to ${testService.nombre_servicio}...`);
      
      // This would be the actual assignment
      await connection.execute(`
        UPDATE empleados 
        SET id_servicio = ?
        WHERE id_empleado = ?
      `, [testService.id_servicio, testEmployee.id_empleado]);
      
      console.log('✅ Assignment successful');
      
      // Revert the change
      await connection.execute(`
        UPDATE empleados 
        SET id_servicio = NULL
        WHERE id_empleado = ?
      `, [testEmployee.id_empleado]);
      
      console.log('✅ Assignment reverted');
    } else {
      console.log('No unassigned employees or services to test with');
    }

    await connection.end();
    console.log('\n=== TEST COMPLETE ===');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testServiceOverviewFix();