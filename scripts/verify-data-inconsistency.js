require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function verifyDataInconsistency() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando inconsistencia en los datos...\n');

    // Obtener horario de mayo
    const [maySchedules] = await connection.execute(`
      SELECT id FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC LIMIT 1
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No se encontró horario de mayo 2025');
      return;
    }

    // Obtener los días específicos que el modal mostraba vs lo que dice la BD
    const [specificDays] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo' 
      AND hd.date BETWEEN '2025-05-24' AND '2025-05-31'
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    console.log('📊 Datos reales en la base de datos (24-31 mayo):');
    console.log('Fecha       | Horario      | Notas        | ¿Qué debería ser?');
    console.log('------------|--------------|--------------|------------------');

    specificDays.forEach(shift => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
      const horario = shift.startTime && shift.endTime ? `${shift.startTime}-${shift.endTime}` : 'Sin horario';
      
      // Determinar qué debería ser según el modal
      let shouldBe = '';
      if (dateStr.includes('24/05')) shouldBe = 'Descanso ✓';
      else if (dateStr.includes('25/05')) shouldBe = 'TRABAJO (modal decía Mañana)';
      else if (dateStr.includes('26/05')) shouldBe = 'Trabajo ✓';
      else if (dateStr.includes('27/05')) shouldBe = 'Trabajo ✓';
      else if (dateStr.includes('28/05')) shouldBe = 'Trabajo ✓';
      else if (dateStr.includes('29/05')) shouldBe = 'Trabajo ✓';
      else if (dateStr.includes('30/05')) shouldBe = 'Descanso (modal decía Descanso)';
      else if (dateStr.includes('31/05')) shouldBe = 'Descanso ✓';
      
      console.log(`${dateStr.padEnd(11)} | ${horario.padEnd(12)} | ${shift.notes.padEnd(12)} | ${shouldBe}`);
    });

    console.log('\n🔍 Análisis de la inconsistencia:');
    console.log('El modal mostraba:');
    console.log('- sáb, 24/05: Descanso');
    console.log('- dom, 25/05: Mañana (TRABAJO)');
    console.log('- lun, 26/05: Mañana (TRABAJO)');
    console.log('- mar, 27/05: Mañana (TRABAJO)');
    console.log('- mié, 28/05: Mañana (TRABAJO)');
    console.log('- jue, 29/05: Mañana (TRABAJO)');
    console.log('- vie, 30/05: Descanso');

    console.log('\nPero la base de datos tiene:');
    specificDays.forEach(shift => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
      console.log(`- ${dateStr}: ${shift.notes}`);
    });

    console.log('\n💡 CONCLUSIÓN:');
    console.log('Si hay inconsistencia entre el modal y la BD, el problema puede ser:');
    console.log('1. El modal está leyendo datos diferentes');
    console.log('2. Hay múltiples horarios y se está mostrando el incorrecto');
    console.log('3. Los datos se corrompieron después de la creación');
    
    // Verificar si hay múltiples horarios de mayo
    const [allMaySchedules] = await connection.execute(`
      SELECT id, horario_nombre, status, createdAt
      FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1
      ORDER BY createdAt DESC
    `);

    console.log(`\n📊 Todos los horarios de mayo 2025: ${allMaySchedules.length}`);
    allMaySchedules.forEach((schedule, i) => {
      console.log(`${i+1}. ${schedule.horario_nombre} (${schedule.status}) - ${new Date(schedule.createdAt).toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyDataInconsistency();