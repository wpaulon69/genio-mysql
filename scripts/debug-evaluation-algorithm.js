require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Funciones exactas del algoritmo de evaluación
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

// Función de inicialización (copiada exacta del algoritmo)
function initializeEmployeeStatesFromHistory(employeesForService, previousMonthShifts, rulesConfig, firstDayOfCurrentMonth) {
  const employeeStates = {};
  const sortedPreviousShifts = (previousMonthShifts || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const lookbackDays = Math.max(rulesConfig.maxConsecutiveWorkDays, rulesConfig.maxConsecutiveDaysOff, 7);

  employeesForService.forEach(emp => {
    let currentConsecutiveWork = 0;
    let currentConsecutiveRest = 0;
    let lastTypeEncountered = undefined;

    for (let i = lookbackDays - 1; i >= 0; i--) {
      const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);
      const dateToCheckStr = formatDate(dateToCheck);
      const shiftToday = sortedPreviousShifts.find(s => s.date === dateToCheckStr && s.employeeName === emp.nombre);

      if (shiftToday) {
        const shiftType = getShiftType(shiftToday);
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
        currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) ? currentConsecutiveRest + 1 : 1;
        currentConsecutiveWork = 0;
        lastTypeEncountered = 'D';
      }
    }

    employeeStates[emp.id_empleado] = {
      id: emp.id_empleado,
      name: emp.nombre,
      consecutiveWorkDays: currentConsecutiveWork,
      consecutiveRestDays: currentConsecutiveRest,
      shiftsThisMonth: 0,
      lastShiftType: lastTypeEncountered,
    };
  });
  
  return employeeStates;
}

async function debugEvaluationAlgorithm() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando algoritmo de evaluación paso a paso...\n');

    // 1. Obtener configuración del servicio
    const [services] = await connection.execute(`
      SELECT * FROM servicios WHERE id_servicio = 1
    `);
    const service = services[0];
    
    const rulesConfig = {
      maxConsecutiveWorkDays: service.max_dias_trabajo_consecutivos || 6,
      maxConsecutiveDaysOff: service.max_descansos_consecutivos || 3,
      preferredConsecutiveDaysOff: service.dias_descanso_consecutivos_preferidos || 2,
    };

    console.log('📊 Configuración:');
    console.log(`- maxConsecutiveDaysOff: ${rulesConfig.maxConsecutiveDaysOff}`);

    // 2. Obtener horario de mayo (mes anterior)
    const [maySchedules] = await connection.execute(`
      SELECT id FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC LIMIT 1
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No se encontró horario de mayo 2025');
      return;
    }

    // 3. Obtener turnos del mes anterior
    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre as employeeName
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ?
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    console.log(`📊 Turnos del mes anterior: ${mayShifts.length}`);

    // 4. Simular empleados (solo Alamo para simplificar)
    const employeesForService = [{ id_empleado: 1, nombre: 'Alamo' }];

    // 5. Inicializar estados desde historial
    const firstDayOfCurrentMonth = new Date(2025, 5, 1); // 1 de junio 2025
    const employeeStates = initializeEmployeeStatesFromHistory(
      employeesForService, 
      mayShifts, 
      rulesConfig, 
      firstDayOfCurrentMonth
    );

    console.log('\n📊 Estado inicial de Alamo:');
    const alamoState = employeeStates[1];
    console.log(`- consecutiveRestDays: ${alamoState.consecutiveRestDays}`);
    console.log(`- lastShiftType: ${alamoState.lastShiftType}`);

    // 6. Simular evaluación del primer día de junio
    console.log('\n🔍 Simulando evaluación del 1 de junio...');
    
    // Crear un turno de prueba para el 1 de junio (asumiendo que es descanso)
    const testShift = {
      date: '2025-06-01',
      employeeName: 'Alamo',
      startTime: '',
      endTime: '',
      notes: 'D (Descanso)'
    };

    const shiftType = getShiftType(testShift);
    const isRest = isRestDay(shiftType);
    
    console.log(`- Turno del 1 de junio: ${testShift.notes}`);
    console.log(`- Tipo de turno: ${shiftType}`);
    console.log(`- ¿Es descanso?: ${isRest}`);

    // 7. Calcular días consecutivos como lo hace el algoritmo de evaluación
    if (isRest) {
      // Esta es la línea exacta del algoritmo de evaluación
      const newConsecutiveRestDays = isRestDay(alamoState.lastShiftType) ? alamoState.consecutiveRestDays + 1 : 1;
      
      console.log(`\n📊 Cálculo de días consecutivos:`);
      console.log(`- Estado anterior: ${alamoState.consecutiveRestDays} días`);
      console.log(`- Último tipo anterior: ${alamoState.lastShiftType}`);
      console.log(`- ¿Último era descanso?: ${isRestDay(alamoState.lastShiftType)}`);
      console.log(`- Nuevo cálculo: ${newConsecutiveRestDays} días`);
      
      if (newConsecutiveRestDays > rulesConfig.maxConsecutiveDaysOff) {
        console.log(`\n❌ VIOLACIÓN DETECTADA:`);
        console.log(`- ${newConsecutiveRestDays} días > ${rulesConfig.maxConsecutiveDaysOff} máximo`);
        console.log(`- Mensaje: "Descansó ${newConsecutiveRestDays} días (máx: ${rulesConfig.maxConsecutiveDaysOff})"`);
      } else {
        console.log(`\n✅ No hay violación: ${newConsecutiveRestDays} ≤ ${rulesConfig.maxConsecutiveDaysOff}`);
      }
    }

    // 8. Verificar si el problema está en los datos del mes anterior
    console.log('\n🔍 Verificando datos del mes anterior para Alamo:');
    const alamoShifts = mayShifts.filter(s => s.employeeName === 'Alamo');
    console.log(`- Turnos de Alamo en mayo: ${alamoShifts.length}`);
    
    // Mostrar últimos 10 días
    const lastDays = alamoShifts.slice(-10);
    console.log('\nÚltimos 10 días de mayo:');
    lastDays.forEach(shift => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const type = getShiftType(shift);
      const rest = isRestDay(type);
      console.log(`${dateStr}: ${shift.notes} → ${type} (${rest ? 'Descanso' : 'Trabajo'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugEvaluationAlgorithm();