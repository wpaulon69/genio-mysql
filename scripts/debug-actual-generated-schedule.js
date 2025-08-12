require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

function getShiftType(shift) {
  if (!shift) return '';
  const note = shift.notes?.toUpperCase();
  if (note === '_EMPTY_') return '';
  if (note === 'C' || note === 'C (FRANCO COMP.)' || note?.includes('FRANCO COMP')) return 'C';
  if (note?.startsWith('F') || note?.includes('FERIADO')) return 'F';
  if (note === 'D' || note === 'D (DESCANSO)' || note?.includes('DESCANSO') || note === 'D (FIJO SEMANAL)' || note === 'D (FDS OBJETIVO)' || note === 'D (FIJO)') return 'D';
  if (note?.startsWith('LAO')) return 'LAO';
  if (note?.startsWith('LM')) return 'LM';
  if (note?.startsWith('V')) return 'V';
  
  if (shift.startTime && shift.startTime.trim() !== '') {
    if (shift.startTime.startsWith('07:') || shift.startTime.startsWith('08:')) return 'M';
    if (shift.startTime.startsWith('14:') || shift.startTime.startsWith('15:')) return 'T';
    if (shift.startTime.startsWith('22:') || shift.startTime.startsWith('23:')) return 'N';
  }
  
  if (note?.includes('MAÑANA') || note?.includes('(M)')) return 'M';
  if (note?.includes('TARDE') || note?.includes('(T)')) return 'T';
  if (note?.includes('NOCHE') || note?.includes('(N)')) return 'N';
  
  if ((!shift.startTime || shift.startTime.trim() === '') && (!note || note.trim() === '')) return 'D';
  return '';
}

function isRestDay(shiftType) {
  if (!shiftType) return true;
  return ['D', 'F', 'C', 'LAO', 'LM', 'V'].includes(shiftType.toUpperCase());
}

async function debugActualGeneratedSchedule() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando el horario generado real...\n');

    // Buscar si hay algún horario de junio 2025 guardado
    const [juneSchedules] = await connection.execute(`
      SELECT id, horario_nombre, status, createdAt
      FROM horarios 
      WHERE year = '2025' AND month = '6' AND serviceId = 1
      ORDER BY createdAt DESC
      LIMIT 5
    `);

    console.log(`📊 Horarios de junio 2025 encontrados: ${juneSchedules.length}`);
    
    if (juneSchedules.length === 0) {
      console.log('❌ No hay horarios de junio guardados');
      console.log('💡 Esto significa que la violación se genera DURANTE la generación, no después');
      console.log('💡 El problema está en el algoritmo de generación o en la evaluación inmediata');
      return;
    }

    // Analizar el horario más reciente
    const latestSchedule = juneSchedules[0];
    console.log(`\n📋 Analizando: ${latestSchedule.horario_nombre} (${latestSchedule.status})`);
    console.log(`Creado: ${new Date(latestSchedule.createdAt).toLocaleString()}`);

    // Obtener turnos de Alamo en junio
    const [juneShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
      LIMIT 10
    `, [latestSchedule.id]);

    console.log(`\n📊 Turnos de Alamo en junio: ${juneShifts.length}`);
    console.log('Primeros 10 días:');
    console.log('Fecha       | Horario      | Notas        | Tipo | ¿Descanso?');
    console.log('------------|--------------|--------------|------|----------');

    let consecutiveRestDays = 0;
    let lastWasRest = false;

    juneShifts.forEach((shift, index) => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const horario = shift.startTime && shift.endTime ? `${shift.startTime}-${shift.endTime}` : 'Sin horario';
      const shiftType = getShiftType(shift);
      const isRest = isRestDay(shiftType);
      
      // Contar días consecutivos
      if (isRest) {
        consecutiveRestDays = lastWasRest ? consecutiveRestDays + 1 : 1;
      } else {
        consecutiveRestDays = 0;
      }
      lastWasRest = isRest;
      
      console.log(`${dateStr}      | ${horario.padEnd(12)} | ${shift.notes.padEnd(12)} | ${shiftType.padEnd(4)} | ${isRest ? 'Sí' : 'No'} (${consecutiveRestDays})`);
    });

    // Verificar si hay violaciones guardadas para este horario
    const [violations] = await connection.execute(`
      SELECT p.message, p.date, e.nombre as employeeName
      FROM problemashorarios p 
      LEFT JOIN empleados e ON p.employeeId = e.id_empleado 
      WHERE p.monthlyScheduleId = ? AND e.nombre = 'Alamo'
    `, [latestSchedule.id]);

    console.log(`\n📊 Violaciones guardadas para Alamo: ${violations.length}`);
    violations.forEach(violation => {
      try {
        const parsed = JSON.parse(violation.message);
        console.log(`- ${violation.date}: ${parsed.rule} - ${parsed.details}`);
      } catch (e) {
        console.log(`- ${violation.date}: ${violation.message}`);
      }
    });

    console.log('\n💡 ANÁLISIS:');
    if (violations.length > 0) {
      console.log('❌ HAY VIOLACIONES GUARDADAS');
      console.log('- Esto confirma que el problema está en la evaluación');
      console.log('- Comparar los datos reales vs las violaciones reportadas');
    } else {
      console.log('✅ No hay violaciones guardadas');
      console.log('- El problema puede estar en la evaluación en tiempo real');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugActualGeneratedSchedule();