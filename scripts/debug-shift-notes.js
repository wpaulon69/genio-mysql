require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function debugShiftNotes() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando notas reales de turnos de Alamo...\n');

    // Obtener horario de mayo 2025
    const [maySchedules] = await connection.execute(`
      SELECT id FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC LIMIT 1
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No se encontró horario de mayo 2025');
      return;
    }

    // Obtener últimos 10 días de Alamo con notas completas
    const [shifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date DESC
      LIMIT 10
    `, [maySchedules[0].id]);

    console.log('📊 Últimos 10 días de Alamo en mayo:');
    console.log('Fecha       | Horario      | Notas completas');
    console.log('------------|--------------|----------------------------------');

    shifts.reverse().forEach(shift => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
      const horario = shift.startTime && shift.endTime ? `${shift.startTime}-${shift.endTime}` : 'Sin horario';
      
      console.log(`${dateStr.padEnd(11)} | ${horario.padEnd(12)} | "${shift.notes}"`);
    });

    console.log('\n🔍 Análisis de las notas:');
    console.log('- "Turno Fijo" debería indicar que trabajó (no descanso)');
    console.log('- "D (Fijo)" indica descanso fijo');
    console.log('- El problema está en cómo se interpreta "Turno Fijo"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugShiftNotes();