require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testDataTypes() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando tipos de datos...');

    // Obtener el horario
    const [schedules] = await connection.execute(`
      SELECT * FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1
    `);

    if (schedules.length > 0) {
      const schedule = schedules[0];
      
      // Obtener shifts
      const [shifts] = await connection.execute(`
        SELECT 
          hd.*,
          e.nombre as employeeName,
          s.nombre_servicio as serviceName
        FROM horario_detalles hd
        LEFT JOIN empleados e ON hd.employeeId = e.id_empleado
        LEFT JOIN servicios s ON hd.serviceId = s.id_servicio
        WHERE hd.horario_id = ?
        LIMIT 5
      `, [schedule.id]);

      console.log('\n📊 Análisis de tipos de datos:');
      console.log('Schedule ID type:', typeof schedule.id, schedule.id);
      console.log('Schedule ID toString:', schedule.id.toString());
      console.log('Shifts array type:', typeof shifts, Array.isArray(shifts));
      console.log('Shifts length:', shifts.length);
      
      console.log('\n🔍 Estructura del objeto que se envía al frontend:');
      const frontendObject = {
        ...schedule,
        id: schedule.id.toString(),
        shifts: shifts,
        violations: [],
        scoreBreakdown: null
      };
      
      console.log('Object keys:', Object.keys(frontendObject));
      console.log('shifts property exists:', 'shifts' in frontendObject);
      console.log('shifts is array:', Array.isArray(frontendObject.shifts));
      console.log('shifts length:', frontendObject.shifts.length);
      
      // Simular JSON serialization/deserialization como hace la API
      console.log('\n🔄 Simulando serialización JSON (como hace la API):');
      const jsonString = JSON.stringify([frontendObject]);
      const parsedBack = JSON.parse(jsonString);
      const firstSchedule = parsedBack[0];
      
      console.log('After JSON round-trip:');
      console.log('- shifts exists:', !!firstSchedule.shifts);
      console.log('- shifts is array:', Array.isArray(firstSchedule.shifts));
      console.log('- shifts length:', firstSchedule.shifts.length);
      console.log('- condition (shifts && shifts.length > 0):', firstSchedule.shifts && firstSchedule.shifts.length > 0);
      
      // Verificar un shift específico
      if (firstSchedule.shifts.length > 0) {
        const firstShift = firstSchedule.shifts[0];
        console.log('\n🎯 Primer shift después de JSON:');
        console.log('- employeeName:', firstShift.employeeName);
        console.log('- date:', firstShift.date);
        console.log('- startTime:', firstShift.startTime);
        console.log('- notes:', firstShift.notes);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDataTypes();