require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Funciones exactas del algoritmo
function getShiftType(shift) {
  if (!shift) {
    return '';
  }

  const note = shift.notes?.toUpperCase();

  if (note === '_EMPTY_') {
    return '';
  }

  if (note === 'C' || note === 'C (FRANCO COMP.)' || note?.includes('FRANCO COMP')) {
    return 'C';
  }
  if (note?.startsWith('F') || note?.includes('FERIADO')) {
    return 'F';
  }
  if (note === 'D' || note === 'D (DESCANSO)' || note?.includes('DESCANSO') || note === 'D (FIJO SEMANAL)' || note === 'D (FDS OBJETIVO)' || note === 'D (FIJO)') {
    return 'D';
  }
  if (note?.startsWith('LAO')) {
    return 'LAO';
  }
  if (note?.startsWith('LM')) {
    return 'LM';
  }
  if (note?.startsWith('V')) {
    return 'V';
  }

  // Turnos de trabajo basados en startTime
  if (shift.startTime && shift.startTime.trim() !== '') {
    if (shift.startTime.startsWith('07:') || shift.startTime.startsWith('08:')) {
      return 'M';
    }
    if (shift.startTime.startsWith('14:') || shift.startTime.startsWith('15:')) {
      return 'T';
    }
    if (shift.startTime.startsWith('22:') || shift.startTime.startsWith('23:')) {
      return 'N';
    }
  }
  
  // Turnos de trabajo basados en las notas
  if (note?.includes('MAÑANA') || note?.includes('(M)')) {
    return 'M';
  }
  if (note?.includes('TARDE') || note?.includes('(T)')) {
    return 'T';
  }
  if (note?.includes('NOCHE') || note?.includes('(N)')) {
    return 'N';
  }
  
  // Fallback
  if ((!shift.startTime || shift.startTime.trim() === '') && (!note || note.trim() === '')) {
    return 'D';
  }
  
  return '';
}

function isRestDay(shiftType) {
  if (!shiftType) return true;
  return ['D', 'F', 'C', 'LAO', 'LM', 'V'].includes(shiftType.toUpperCase());
}

async function debugWithRealFunctions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando con funciones reales del algoritmo...\n');

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

    // Obtener últimos 10 días de Alamo
    const [shifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date DESC
      LIMIT 10
    `, [maySchedules[0].id]);

    console.log('📊 Análisis con funciones reales del algoritmo:');
    console.log('Fecha       | Notas        | StartTime | ShiftType | ¿Descanso? | Consec.Desc');
    console.log('------------|--------------|-----------|-----------|------------|------------');

    let consecutiveRestDays = 0;
    let lastShiftType = null;

    shifts.reverse().forEach(shift => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      
      const shiftObj = {
        notes: shift.notes,
        startTime: shift.startTime,
        endTime: shift.endTime
      };
      
      const shiftType = getShiftType(shiftObj);
      const isRest = isRestDay(shiftType);
      
      // Calcular días consecutivos
      if (isRest) {
        consecutiveRestDays = isRestDay(lastShiftType) ? consecutiveRestDays + 1 : 1;
      } else {
        consecutiveRestDays = 0;
      }
      
      console.log(`${dateStr}      | ${(shift.notes || '').substring(0, 12).padEnd(12)} | ${(shift.startTime || '').padEnd(9)} | ${shiftType.padEnd(9)} | ${isRest ? 'Sí' : 'No'}.padEnd(10)} | ${consecutiveRestDays}`);
      
      lastShiftType = shiftType;
    });

    console.log('\n💡 Resultado:');
    console.log(`- Días de descanso consecutivos al final de mayo: ${consecutiveRestDays}`);
    console.log(`- Último tipo de turno: ${lastShiftType}`);
    
    if (consecutiveRestDays <= 2) {
      console.log('✅ El cálculo parece correcto - no debería haber violación de 8 días');
    } else {
      console.log('❌ Hay un problema en el cálculo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugWithRealFunctions();