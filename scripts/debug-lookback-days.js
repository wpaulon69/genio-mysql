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

function isRestDay(shiftType) {
  if (!shiftType) return true;
  return ['D', 'F', 'C', 'LAO', 'LM', 'V'].includes(shiftType.toUpperCase());
}

async function debugLookbackDays() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando exactamente qué días mira el algoritmo...\n');

    // Configuración del servicio
    const [services] = await connection.execute(`
      SELECT max_dias_trabajo_consecutivos, max_descansos_consecutivos 
      FROM servicios WHERE id_servicio = 1
    `);
    const service = services[0];
    const lookbackDays = Math.max(service.max_dias_trabajo_consecutivos, service.max_descansos_consecutivos, 7);
    
    console.log(`📊 Configuración:`);
    console.log(`- max_dias_trabajo_consecutivos: ${service.max_dias_trabajo_consecutivos}`);
    console.log(`- max_descansos_consecutivos: ${service.max_descansos_consecutivos}`);
    console.log(`- lookbackDays calculado: ${lookbackDays}`);

    // Obtener horario de mayo
    const [maySchedules] = await connection.execute(`
      SELECT id FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC LIMIT 1
    `);

    // Obtener TODOS los turnos de Alamo en mayo
    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre as employeeName
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    // Simular exactamente lo que hace el algoritmo
    const firstDayOfCurrentMonth = new Date(2025, 5, 1); // 1 de junio 2025
    
    console.log(`\n🔍 El algoritmo mira desde ${formatDate(subDays(firstDayOfCurrentMonth, lookbackDays))} hasta ${formatDate(subDays(firstDayOfCurrentMonth, 1))}`);
    console.log(`Eso son ${lookbackDays} días hacia atrás desde el 1 de junio`);

    console.log('\nFecha       | Turno encontrado | Tipo | Notas            | Consec.Desc | Acumulado');
    console.log('------------|------------------|------|------------------|-------------|----------');

    let currentConsecutiveRest = 0;
    let lastTypeEncountered = undefined;
    let totalRestDays = 0;

    // Iterar exactamente como el algoritmo
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
        shiftType = getShiftType(shiftToday);

        if (shiftType === 'M' || shiftType === 'T' || shiftType === 'N') {
          currentConsecutiveRest = 0;
          lastTypeEncountered = shiftType;
        } else {
          currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C') ? currentConsecutiveRest + 1 : 1;
          lastTypeEncountered = shiftType;
          totalRestDays++;
        }
      } else {
        foundShift = 'No→D';
        notes = '(asume descanso)';
        shiftType = 'D';
        currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) ? currentConsecutiveRest + 1 : 1;
        lastTypeEncountered = 'D';
        totalRestDays++;
      }

      const dateStr = dateToCheck.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      console.log(`${dateStr}      | ${foundShift.padEnd(16)} | ${shiftType.padEnd(4)} | ${notes.padEnd(16)} | ${currentConsecutiveRest.toString().padEnd(11)} | ${totalRestDays}`);
    }

    console.log(`\n📊 Resultado final:`);
    console.log(`- Días de descanso consecutivos: ${currentConsecutiveRest}`);
    console.log(`- Total días de descanso encontrados: ${totalRestDays}`);
    console.log(`- Último tipo: ${lastTypeEncountered}`);

    console.log('\n💡 ANÁLISIS:');
    if (currentConsecutiveRest >= 7) {
      console.log('❌ PROBLEMA ENCONTRADO:');
      console.log('- El algoritmo está mirando demasiados días hacia atrás');
      console.log('- Está contando descansos de semanas anteriores que no deberían importar');
      console.log('- El lookbackDays debería ser menor o la lógica debería cambiar');
    } else {
      console.log('✅ El cálculo parece razonable');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugLookbackDays();