require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

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

async function debugWithExtendedLookback() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando con lookback extendido...\n');

    // Obtener configuración actual del servicio
    const [services] = await connection.execute(`
      SELECT max_dias_trabajo_consecutivos, max_descansos_consecutivos 
      FROM servicios WHERE id_servicio = 1
    `);
    
    const service = services[0];
    const lookbackDays = Math.max(service.max_dias_trabajo_consecutivos, service.max_descansos_consecutivos, 7);
    
    console.log(`📊 Configuración del servicio:`);
    console.log(`- max_dias_trabajo_consecutivos: ${service.max_dias_trabajo_consecutivos}`);
    console.log(`- max_descansos_consecutivos: ${service.max_descansos_consecutivos}`);
    console.log(`- lookbackDays calculado: ${lookbackDays}`);

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

    // Obtener TODOS los turnos de mayo para Alamo
    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    console.log(`\n📊 Total turnos de Alamo en mayo: ${mayShifts.length}`);

    // Simular con el lookbackDays real
    const firstDayOfCurrentMonth = new Date(2025, 5, 1); // 1 de junio 2025
    
    console.log(`\n🔍 Simulando con lookbackDays = ${lookbackDays}`);
    console.log(`Mirando desde ${formatDate(subDays(firstDayOfCurrentMonth, lookbackDays))} hasta ${formatDate(subDays(firstDayOfCurrentMonth, 1))}`);
    
    let currentConsecutiveWork = 0;
    let currentConsecutiveRest = 0;
    let lastTypeEncountered = undefined;

    console.log('\nFecha       | Turno | Tipo | Notas            | Consec.Desc | LastType');
    console.log('------------|-------|------|------------------|-------------|----------');

    // Iterar con el lookbackDays real
    for (let i = lookbackDays - 1; i >= 0; i--) {
      const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);
      const dateToCheckStr = formatDate(dateToCheck);
      const shiftToday = mayShifts.find(s => s.date.toISOString().split('T')[0] === dateToCheckStr);

      let shiftType = '';
      let foundShift = 'No';
      let notes = '';

      if (shiftToday) {
        foundShift = 'Sí';
        notes = (shiftToday.notes || '').substring(0, 16);
        shiftType = getShiftType({
          notes: shiftToday.notes,
          startTime: shiftToday.startTime,
          endTime: shiftToday.endTime
        });

        if (shiftType === 'M' || shiftType === 'T' || shiftType === 'N') {
          currentConsecutiveWork = (lastTypeEncountered === 'M' || lastTypeEncountered === 'T' || lastTypeEncountered === 'N') ? currentConsecutiveWork + 1 : 1;
          currentConsecutiveRest = 0;
          lastTypeEncountered = shiftType;
        } else {
          currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C') ? currentConsecutiveRest + 1 : 1;
          currentConsecutiveWork = 0;
          lastTypeEncountered = shiftType;
        }
      } else {
        foundShift = 'No→D';
        notes = '(asume descanso)';
        shiftType = 'D';
        currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) ? currentConsecutiveRest + 1 : 1;
        currentConsecutiveWork = 0;
        lastTypeEncountered = 'D';
      }

      const dateStr = dateToCheck.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      console.log(`${dateStr}      | ${foundShift.padEnd(5)} | ${shiftType.padEnd(4)} | ${notes.padEnd(16)} | ${currentConsecutiveRest.toString().padEnd(11)} | ${lastTypeEncountered || 'undef'}`);
    }

    console.log(`\n📊 Estado inicial calculado:`);
    console.log(`- Días de descanso consecutivos: ${currentConsecutiveRest}`);
    console.log(`- Último tipo: ${lastTypeEncountered}`);

    if (currentConsecutiveRest >= 8) {
      console.log('\n❌ BUG ENCONTRADO:');
      console.log('- El algoritmo está contando días sin datos como descansos');
      console.log('- Esto infla el contador artificialmente');
      console.log('\n🔧 POSIBLES CAUSAS:');
      console.log('1. El horario de mayo no cubre todos los días necesarios');
      console.log('2. Hay días faltantes en la base de datos');
      console.log('3. El lookbackDays es demasiado grande');
    } else {
      console.log('\n✅ La inicialización parece correcta');
      console.log('- El problema debe estar en otro lugar del algoritmo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugWithExtendedLookback();