const mysql = require('mysql2/promise');

async function debugServiceStats() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'hospital_shifts'
    });

    console.log('=== DEBUGGING SERVICE STATS API ===\n');

    // 1. Test service info
    console.log('1. Testing services table...');
    const [services] = await connection.execute(`
      SELECT id_servicio, nombre_servicio, descripcion
      FROM servicios 
      ORDER BY id_servicio
    `);
    console.log(`Found ${services.length} services:`);
    services.forEach(service => {
      console.log(`  - ID: ${service.id_servicio}, Name: ${service.nombre_servicio}`);
    });

    if (services.length === 0) {
      console.log('❌ No services found - this will cause stats to fail');
      await connection.end();
      return;
    }

    const testServiceId = services[0].id_servicio;
    console.log(`\nUsing service ID ${testServiceId} for testing...`);

    // 2. Test assigned employees count
    console.log('\n2. Testing assigned employees count...');
    const [assignedEmployees] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM empleados 
      WHERE id_servicio = ?
    `, [testServiceId]);
    console.log(`Assigned employees: ${assignedEmployees[0].count}`);

    // 3. Test available employees count
    console.log('\n3. Testing available employees count...');
    const [availableEmployees] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM empleados 
      WHERE id_servicio IS NULL OR id_servicio = 0
    `);
    console.log(`Available employees: ${availableEmployees[0].count}`);

    // 4. Test monthly schedules table
    console.log('\n4. Testing monthly_schedules table...');
    try {
      const [schedules] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM monthly_schedules 
        WHERE service_id = ?
      `, [testServiceId]);
      console.log(`Monthly schedules for service: ${schedules[0].count}`);
    } catch (error) {
      console.log('❌ monthly_schedules table might not exist or have different structure');
      console.log('Error:', error.message);
      
      // Check if table exists
      const [tables] = await connection.execute(`
        SHOW TABLES LIKE 'monthly_schedules'
      `);
      if (tables.length === 0) {
        console.log('❌ monthly_schedules table does not exist');
      } else {
        console.log('✅ monthly_schedules table exists, checking structure...');
        const [columns] = await connection.execute(`
          DESCRIBE monthly_schedules
        `);
        console.log('Table structure:');
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type}`);
        });
      }
    }

    // 5. Test current date logic
    console.log('\n5. Testing date logic...');
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    });
    console.log(`Current month: ${currentMonth}`);
    console.log(`Year: ${currentDate.getFullYear()}, Month: ${currentDate.getMonth() + 1}`);

    // 6. Simulate full stats response
    console.log('\n6. Simulating full stats response...');
    const stats = {
      serviceName: services[0].nombre_servicio,
      assignedEmployees: assignedEmployees[0].count,
      availableEmployees: availableEmployees[0].count,
      currentMonth: currentMonth,
      coverage: 85,
      targetCoverage: 90,
      pendingRequests: 2,
      activeSchedule: false
    };
    
    console.log('Stats object:');
    console.log(JSON.stringify(stats, null, 2));

    await connection.end();
    console.log('\n=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugServiceStats();