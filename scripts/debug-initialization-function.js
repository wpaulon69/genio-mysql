require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Función para restar días
function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// Función para formatear fecha
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Función getShiftType (copiada del algoritmo real)
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

async function debugInitializationFunction() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando función de inicialización...\n');

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

    // Obtener todos los turnos de Alamo en mayo
    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    console.log(`📊 Turnos de Alamo en mayo: ${mayShifts.length}`);

    // Simular la función initializeEmployeeStatesFromHistory
    const firstDayOfCurrentMonth = new Date(2025, 5, 1); // 1 de junio 2025
    const lookbackDays = 7; // Valor típico
    
    console.log(`\n🔍 Simulando inicialización para el 1 de junio 2025:`);
    console.log(`- Mirando hacia atrás ${lookbackDays} días`);
    console.log(`- Desde: ${formatDate(subDays(firstDayOfCurrentMonth, lookbackDays))} hasta: ${formatDate(subDays(firstDayOfCurrentMonth, 1))}`);
    
    console.log('\nFecha       | Turno encontrado | ShiftType | Consec.Desc | Consec.Trab | LastType');
    console.log('------------|------------------|-----------|-------------|-------------|----------');

    let currentConsecutiveWork = 0;
    let currentConsecutiveRest = 0;
    let lastTypeEncountered = undefined;

    // Iterar desde el día más antiguo al más reciente (como hace el algoritmo)
    for (let i = lookbackDays - 1; i >= 0; i--) {
      const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);
      const dateToCheckStr = formatDate(dateToCheck);
      const shiftToday = mayShifts.find(s => s.date.toISOString().split('T')[0] === dateToCheckStr);

      let shiftType = '';
      let foundShift = 'No';

      if (shiftToday) {
        foundShift = 'Sí';
        shiftType = getShiftType({
          notes: shiftToday.notes,
          startTime: shiftToday.startTime,
          endTime: shiftToday.endTime
        });

        if (shiftType === 'M' || shiftType === 'T' || shiftType === 'N') {
          currentConsecutiveWork = (lastTypeEncountered === 'M' || lastTypeEncountered === 'T' || lastTypeEncountered === 'N') ? currentConsecutiveWork + 1 : 1;
          currentConsecutiveRest = 0;
          lastTypeEncountered = shiftType;
        } else { // D, F, LAO, LM, C
          currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C') ? currentConsecutiveRest + 1 : 1;
          currentConsecutiveWork = 0;
          lastTypeEncountered = shiftType;
        }
      } else {
        // ¡AQUÍ ESTÁ EL PROBLEMA!
        foundShift = 'No (asume D)';
        shiftType = 'D';
        currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) ? currentConsecutiveRest + 1 : 1;
        currentConsecutiveWork = 0;
        lastTypeEncountered = 'D';
      }

      const dateStr = dateToCheck.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      console.log(`${dateStr}      | ${foundShift.padEnd(16)} | ${shiftType.padEnd(9)} | ${currentConsecutiveRest.toString().padEnd(11)} | ${currentConsecutiveWork.toString().padEnd(11)} | ${lastTypeEncountered || 'undefined'}`);
    }

    console.log('\n💡 Estado inicial calculado para Alamo:');
    console.log(`- Días de descanso consecutivos: ${currentConsecutiveRest}`);
    console.log(`- Días de trabajo consecutivos: ${currentConsecutiveWork}`);
    console.log(`- Último tipo de turno: ${lastTypeEncountered}`);

    if (currentConsecutiveRest >= 8) {
      console.log('\n❌ PROBLEMA ENCONTRADO:');
      console.log('- El algoritmo está contando días sin datos como descansos');
      console.log('- Esto infla artificialmente el contador de días consecutivos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugInitializationFunction();