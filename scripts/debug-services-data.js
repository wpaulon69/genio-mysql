const mysql = require('mysql2/promise');

async function debugServicesData() {
  let connection;
  
  try {
    // Intentar diferentes configuraciones de conexión
    const configs = [
      { host: 'localhost', user: 'root', password: '', database: 'hospital_schedule' },
      { host: 'localhost', user: 'root', password: 'root', database: 'hospital_schedule' },
      { host: '127.0.0.1', user: 'root', password: '', database: 'hospital_schedule' }
    ];

    for (const config of configs) {
      try {
        connection = await mysql.createConnection(config);
        console.log(`✅ Conectado con: ${config.host}`);
        break;
      } catch (err) {
        console.log(`❌ Falló conexión con: ${config.host}`);
        continue;
      }
    }

    if (!connection) {
      console.log('❌ No se pudo conectar a la base de datos');
      return;
    }

    console.log('=== DEBUG: Datos de Servicios ===\n');

    // 1. Verificar servicios disponibles
    console.log('1. Servicios en la base de datos:');
    const [services] = await connection.execute(`
      SELECT 
        id_servicio,
        nombre_servicio,
        dotacion_objetivo,
        habilitar_turno_manana,
        habilitar_turno_tarde,
        habilitar_turno_noche,
        activo
      FROM servicios
      ORDER BY nombre_servicio
    `);
    
    console.table(services);

    // 2. Verificar empleados por servicio
    console.log('\n2. Empleados por servicio:');
    const [employeesByService] = await connection.execute(`
      SELECT 
        s.nombre_servicio,
        COUNT(e.id_empleado) as total_empleados,
        COUNT(CASE WHEN e.activo = 1 THEN 1 END) as empleados_activos
      FROM servicios s
      LEFT JOIN empleados e ON s.id_servicio = e.id_servicio
      GROUP BY s.id_servicio, s.nombre_servicio
      ORDER BY s.nombre_servicio
    `);
    
    console.table(employeesByService);

    // 3. Verificar servicio específico "mucamas"
    console.log('\n3. Detalles del servicio "mucamas":');
    const [mucamasService] = await connection.execute(`
      SELECT * FROM servicios WHERE LOWER(nombre_servicio) LIKE '%mucama%'
    `);
    
    if (mucamasService.length > 0) {
      console.log('Servicio mucamas encontrado:');
      console.log(JSON.stringify(mucamasService[0], null, 2));
      
      // Empleados del servicio mucamas
      const [mucamasEmployees] = await connection.execute(`
        SELECT 
          e.id_empleado,
          e.nombre,
          e.apellido,
          e.activo
        FROM empleados e
        WHERE e.id_servicio = ?
      `, [mucamasService[0].id_servicio]);
      
      console.log('\nEmpleados del servicio mucamas:');
      console.table(mucamasEmployees);
    } else {
      console.log('❌ No se encontró servicio mucamas');
    }

    console.log('\n=== Fin del Debug ===');

  } catch (error) {
    console.error('Error en debug:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugServicesData();