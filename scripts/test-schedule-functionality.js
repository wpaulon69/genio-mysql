require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testScheduleFunctionality() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a la base de datos');

    // Verificar estructura de tablas de horarios
    console.log('\n📋 Verificando estructura de tablas de horarios...');
    
    const [monthlySchedulesTable] = await connection.execute(`
      SHOW TABLES LIKE 'monthly_schedules'
    `);
    
    if (monthlySchedulesTable.length > 0) {
      console.log('✅ Tabla monthly_schedules existe');
      
      // Verificar algunos horarios existentes
      const [schedules] = await connection.execute(`
        SELECT 
          id,
          horario_nombre,
          serviceId,
          month,
          year,
          status,
          score,
          createdAt,
          updatedAt
        FROM monthly_schedules 
        WHERE serviceId = 1
        ORDER BY createdAt DESC
        LIMIT 5
      `);
      
      console.log(`\n📅 Horarios encontrados para servicio 1: ${schedules.length}`);
      schedules.forEach(schedule => {
        console.log(`- ${schedule.horario_nombre || `Horario ${schedule.id}`} (${schedule.month}/${schedule.year}) - ${schedule.status} - Puntaje: ${schedule.score || 'N/A'}`);
      });
    } else {
      console.log('❌ Tabla monthly_schedules no existe');
    }

    // Verificar servicios
    const [services] = await connection.execute(`
      SELECT id_servicio, nombre_servicio 
      FROM servicios 
      ORDER BY nombre_servicio
    `);
    
    console.log('\n🏥 Servicios disponibles:');
    services.forEach(service => {
      console.log(`- ${service.nombre_servicio} (ID: ${service.id_servicio})`);
    });

    // Verificar empleados por servicio
    const [employeesByService] = await connection.execute(`
      SELECT 
        s.nombre_servicio,
        COUNT(e.id_empleado) as total_empleados
      FROM servicios s
      LEFT JOIN empleados e ON s.id_servicio = e.id_servicio
      GROUP BY s.id_servicio, s.nombre_servicio
      ORDER BY s.nombre_servicio
    `);
    
    console.log('\n👥 Empleados por servicio:');
    employeesByService.forEach(row => {
      console.log(`- ${row.nombre_servicio}: ${row.total_empleados} empleados`);
    });

    // Verificar jefes de servicio
    const [jefes] = await connection.execute(`
      SELECT 
        u.name,
        u.email,
        u.service_id,
        s.nombre_servicio
      FROM users u
      JOIN servicios s ON u.service_id = s.id_servicio
      WHERE u.role_id = 2
    `);
    
    console.log('\n👨‍⚕️ Jefes de servicio configurados:');
    jefes.forEach(jefe => {
      console.log(`- ${jefe.name} (${jefe.email}) - ${jefe.nombre_servicio}`);
    });

    console.log('\n🎉 Verificación completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Inicia sesión como jefe de servicio');
    console.log('2. Ve al dashboard de "Gestión de Servicio"');
    console.log('3. Haz clic en "Ver Horarios"');
    console.log('4. Selecciona mes y año para ver horarios existentes');
    console.log('5. Los horarios se filtran automáticamente por tu servicio');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testScheduleFunctionality();