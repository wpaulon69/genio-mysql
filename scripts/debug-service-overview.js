const mysql = require('mysql2/promise');

async function debugServiceOverview() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'hospital_shifts'
    });

    console.log('=== DEBUGGING SERVICE OVERVIEW ===\n');

    // Test services
    console.log('1. Testing services table...');
    const [services] = await connection.execute('SELECT * FROM servicios LIMIT 3');
    console.log('Services found:', services.length);
    if (services.length > 0) {
      console.log('Sample service:', JSON.stringify(services[0], null, 2));
    }

    // Test employees
    console.log('\n2. Testing employees table...');
    const [employees] = await connection.execute('SELECT * FROM empleados LIMIT 3');
    console.log('Employees found:', employees.length);
    if (employees.length > 0) {
      console.log('Sample employee:', JSON.stringify(employees[0], null, 2));
    }

    // Test employees with service assignment
    console.log('\n3. Testing employees with service assignment...');
    const [assignedEmployees] = await connection.execute(`
      SELECT e.*, s.nombre_servicio 
      FROM empleados e 
      LEFT JOIN servicios s ON e.id_servicio = s.id_servicio 
      WHERE e.id_servicio IS NOT NULL 
      LIMIT 3
    `);
    console.log('Assigned employees found:', assignedEmployees.length);
    if (assignedEmployees.length > 0) {
      console.log('Sample assigned employee:', JSON.stringify(assignedEmployees[0], null, 2));
    }

    await connection.end();
    console.log('\n=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugServiceOverview();