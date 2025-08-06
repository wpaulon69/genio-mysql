import { format, parseISO, addDays, getDay } from 'date-fns';
import type { AIShift, AsignacionEmpleado } from '@/lib/types';

export function getShiftType(shift: AIShift | null | undefined): 'M' | 'T' | 'N' | 'D' | 'LAO' | 'LM' | 'C' | 'F' | 'V' | '' {
  if (!shift) {
    return '';
  }

  const note = shift.notes?.toUpperCase();

  // --- INICIO DE LA CORRECCIÓN ---
  // Si la nota es _EMPTY_, es un turno vacío intencional, no un error.
  if (note === '_EMPTY_') {
    return '';
  }
  // --- FIN DE LA CORRECCIÓN ---

  // Tipos explícitos que no son de trabajo a partir de las notas (máxima prioridad)
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

  // Turnos de trabajo basados en startTime (si las notas no especificaron un tipo de no trabajo)
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
  
  // Turnos de trabajo basados en las notas (si startTime no coincidió o si startTime estaba vacío pero las notas indican M, T, N)
  if (note?.includes('MAÑANA') || note?.includes('(M)')) {
    return 'M';
  }
  if (note?.includes('TARDE') || note?.includes('(T)')) {
    return 'T';
  }
  if (note?.includes('NOCHE') || note?.includes('(N)')) {
    return 'N';
  }
  
  // Fallback: Si startTime está vacío Y las notas también están vacías o no son indicativas de ningún tipo conocido,
  // entonces considéralo un día de descanso ('D').
  if ((!shift.startTime || shift.startTime.trim() === '') && (!note || note.trim() === '')) {
    return 'D';
  }
  
  return ''; // Fallback para cualquier otro caso no manejado
}

// La función anterior getShiftTypeForEval se reemplaza por getShiftType
export { getShiftType as getShiftTypeForEval };

export function isRestDay(shiftType: string | undefined): boolean {
    if (!shiftType) return true;
    return ['D', 'F', 'C', 'LAO', 'LM', 'V'].includes(shiftType.toUpperCase());
}

export function getShiftDetails(shiftType: 'M' | 'T' | 'N' | 'D'): { startTime: string, endTime: string } {
    switch (shiftType) {
        case 'M': return { startTime: '07:00', endTime: '14:00' };
        case 'T': return { startTime: '14:00', endTime: '21:00' };
        case 'N': return { startTime: '21:00', endTime: '07:00' };
        default: return { startTime: '00:00', endTime: '00:00' };
    }
}

export function getShiftDateTime(date: Date, time: string, isNightShiftNextDay?: boolean): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    if (isNightShiftNextDay) {
        return addDays(dateTime, 1);
    }
    return dateTime;
}

export function isWeekend(date: Date): boolean {
    const day = getDay(date);
    return day === 0 || day === 6;
}

export function isHoliday(date: Date, holidays: { date: string }[]): boolean {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.some(h => h.date === dateStr);
}

export function isEmployeeOnLeave(date: Date, assignments: AsignacionEmpleado[]): boolean {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments.some(a => {
        const startDate = format(parseISO(a.fecha_inicio), 'yyyy-MM-dd');
        const endDate = format(parseISO(a.fecha_fin), 'yyyy-MM-dd');
        return dateStr >= startDate && dateStr <= endDate;
    });
}

export function canAssignShiftDueToRest(
    lastShiftEndTime: Date | null,
    currentShiftStartTime: Date,
    minRestHours: number
): boolean {
    if (!lastShiftEndTime) return true;
    const hoursSinceLastShift = (currentShiftStartTime.getTime() - lastShiftEndTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastShift >= minRestHours;
}

export function normalizeDayName(day: number): 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo' {
    const dayMap: { [key: number]: 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo' } = { 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado', 0: 'Domingo' };
    return dayMap[day];
}

export function isEmployeeOnFixedAssignmentOnDate(
    date: Date,
    fixedAssignments: any[]
): any | null {
    const dateStr = format(date, 'yyyy-MM-dd');
    return fixedAssignments.find(a => a.startDate <= dateStr && a.endDate >= dateStr) || null;
}
