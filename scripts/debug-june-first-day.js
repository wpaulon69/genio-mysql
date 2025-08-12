require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function debugJuneFirstDay() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando qué pasa el 1 de junio 2025...\n');

    // Obtener horario de junio 2025
    const [juneSchedules] = await connection.execute(`
      SELECT id, horario_nombre FROM horarios 
      WHERE year = '2025' AND month = '6' AND serviceId = 1
      ORDER BY createdAt DESC LIMIT 1
    `);

    if (juneSchedules.length === 0) {
      console.log('❌ No se encontró horario de junio 2025');
      return;
    }

    console.log(`📅 Horario de junio: ${juneSchedules[0].horario_nombre}`);

    // Obtener el turno de Alamo el 1 de junio
    const [juneFirstDay] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo' AND hd.date = '2025-06-01'
    `, [juneSchedules[0].id]);

    if (juneFirstDay.length === 0) {
      console.log('❌ No se encontró turno de Alamo para el 1 de junio');
      return;
    }

    const shift = juneFirstDay[0];
    console.log('📊 Turno de Alamo el 1 de junio 2025:');
    console.log(`- Fecha: ${shift.date}`);
    console.log(`- Horario: ${shift.startTime || 'Sin horario'} - ${shift.endTime || 'Sin horario'}`);
    console.log(`- Notas: "${shift.notes}"`);

    // Determinar tipo de turno
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

    const shiftType = getShiftType({
      notes: shift.notes,
      startTime: shift.startTime,
      endTime: shift.endTime
    });

    const isRest = isRestDay(shiftType);

    console.log(`\n🔍 Análisis del turno:`);
    console.log(`- Tipo de turno: ${shiftType}`);
    console.log(`- ¿Es descanso?: ${isRest ? 'Sí' : 'No'}`);

    // Simular el cálculo de días consecutivos
    console.log(`\n🔍 Simulación del cálculo:`);
    console.log(`- Estado inicial (desde mayo): 1 día de descanso consecutivo`);
    console.log(`- Último tipo: D (descanso del 31 de mayo)`);
    
    if (isRest) {
      const newConsecutiveRestDays = 1 + 1; // Estado inicial + este día
      console.log(`- El 1 de junio es descanso → ${newConsecutiveRestDays} días consecutivos`);
      
      if (newConsecutiveRestDays > 7) {
        console.log(`❌ VIOLACIÓN: ${newConsecutiveRestDays} días > 7 máximo`);
      } else {
        console.log(`✅ No hay violación: ${newConsecutiveRestDays} días ≤ 7 máximo`);
      }
    } else {
      console.log(`- El 1 de junio es trabajo → resetea contador a 0`);
      console.log(`✅ No hay violación`);
    }

    // Verificar más días de junio para ver el patrón
    console.log(`\n🔍 Verificando más días de junio...`);
    const [moreDays] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo' AND hd.date BETWEEN '2025-06-01' AND '2025-06-10'
      ORDER BY hd.date ASC
    `, [juneSchedules[0].id]);

    let consecutiveRest = 1; // Estado inicial desde mayo
    let lastType = 'D'; // Último tipo desde mayo

    moreDays.forEach(dayShift => {
      const dayShiftType = getShiftType({
        notes: dayShift.notes,
        startTime: dayShift.startTime,
        endTime: dayShift.endTime
      });
      const dayIsRest = isRestDay(dayShiftType);
      
      if (dayIsRest) {
        consecutiveRest = isRestDay(lastType) ? consecutiveRest + 1 : 1;
      } else {
        consecutiveRest = 0;
      }
      
      const date = new Date(dayShift.date);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      
      console.log(`${dateStr}: ${dayShift.notes} (${dayShiftType}) → ${dayIsRest ? 'Descanso' : 'Trabajo'} → Consec: ${consecutiveRest}`);
      
      lastType = dayShiftType;
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugJuneFirstDay();