require('dotenv').config({ path: '.env.local' });

// Simular la función getMonthlySchedules directamente
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testPreviousMonthDirect() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Probando consulta directa del mes anterior...\n');

    // Simular la consulta que hace getMonthlySchedules
    const year = '2025';
    const month = '5';
    const serviceId = '1';
    const status = 'published';
    
    let query = 'SELECT * FROM horarios WHERE year = ? AND month = ? AND serviceId = ? AND status = ?';
    const params = [year, month, serviceId, status];
    
    console.log(`📡 Query: ${query}`);
    console.log(`📊 Params: [${params.join(', ')}]`);
    
    const [scheduleRows] = await connection.execute(query, params);
    
    console.log(`✅ Horarios encontrados: ${scheduleRows.length}`);
    
    if (scheduleRows.length > 0) {
      const schedule = scheduleRows[0];
      console.log(`📋 Horario principal:`);
      console.log(`   - ID: ${schedule.id}`);
      console.log(`   - Nombre: ${schedule.horario_nombre}`);
      console.log(`   - Estado: ${schedule.status}`);
      console.log(`   - Servicio: ${schedule.serviceName} (ID: ${schedule.serviceId})`);
      console.log(`   - Período: ${schedule.month}/${schedule.year}`);
      
      // Obtener los turnos (shifts) del horario
      const scheduleId = schedule.id;
      const shiftsQuery = `
        SELECT hd.*, e.nombre as employeeName, s.nombre_servicio as serviceName 
        FROM horario_detalles hd 
        LEFT JOIN empleados e ON hd.employeeId = e.id_empleado 
        LEFT JOIN servicios s ON hd.serviceId = s.id_servicio 
        WHERE hd.horario_id = ?
        ORDER BY hd.date ASC
      `;
      
      const [shifts] = await connection.execute(shiftsQuery, [scheduleId]);
      console.log(`📅 Turnos encontrados: ${shifts.length}`);
      
      if (shifts.length > 0) {
        console.log(`\n📅 Primeros 10 turnos del mes anterior:`);
        shifts.slice(0, 10).forEach(shift => {
          console.log(`   - ${shift.date}: ${shift.employeeName} - ${shift.notes || 'Sin notas'} (${shift.startTime}-${shift.endTime})`);
        });
        
        // Verificar últimos días de mayo para continuidad
        console.log(`\n🔍 Últimos días de mayo (para continuidad):`);
        const lastDays = shifts.filter(shift => {
          const date = new Date(shift.date);
          return date.getDate() >= 28; // Últimos días del mes
        });
        
        lastDays.forEach(shift => {
          console.log(`   - ${shift.date}: ${shift.employeeName} - ${shift.notes || 'Sin notas'}`);
        });
      }
    } else {
      console.log('❌ No se encontró horario publicado para mayo 2025 del servicio 1');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPreviousMonthDirect();