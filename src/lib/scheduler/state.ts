/**
 * @fileOverview Define las interfaces de estado y la lógica de inicialización para el algoritmo de generación de horarios.
 */

import type { Employee, AIShift, ScoreBreakdown, ScheduleViolation } from '@/lib/types';
import { format, parseISO, subDays } from 'date-fns';
import { getShiftTypeForEval, getShiftDetails, getShiftDateTime } from './utils';
import type { ScheduleRulesConfig } from './config';

/**
 * Mantiene el estado de un empleado durante el proceso de generación o evaluación del horario.
 */
export interface EmployeeState {
  id: number;
  name: string;
  consecutiveWorkDays: number;
  consecutiveRestDays: number;
  shiftsThisMonth: number;
  lastShiftType?: AIShift['notes'] | 'M' | 'T' | 'N' | 'D' | 'LAO' | 'LM' | 'C' | 'F';
  lastActualWorkShiftEndTime: Date | null;
  completeWeekendsOffThisMonth: number;
}

/**
 * Contiene los resultados acumulados durante la evaluación de un horario.
 */
export interface EvaluationContext {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  violations: ScheduleViolation[];
}

/**
 * Inicializa el estado de los empleados basándose en los turnos del mes anterior.
 */
export function initializeEmployeeStatesFromHistory(
  employeesForService: Employee[],
  previousMonthShifts: AIShift[] | null,
  rulesConfig: ScheduleRulesConfig,
  firstDayOfCurrentMonth: Date
): Record<string, EmployeeState> {
  const employeeStates: Record<string, EmployeeState> = {};
  const sortedPreviousShifts = (previousMonthShifts || []).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  const lookbackDays = Math.max(rulesConfig.maxConsecutiveWorkDays, rulesConfig.maxConsecutiveDaysOff, 7);



  employeesForService.forEach(emp => {
    let currentConsecutiveWork = 0;
    let currentConsecutiveRest = 0;
    let lastTypeEncountered: EmployeeState['lastShiftType'] = undefined;
    let lastWorkShiftEnd: Date | null = null;



    // Procesar días desde el más antiguo al más reciente para calcular secuencias correctamente
    for (let i = lookbackDays - 1; i >= 0; i--) {
      const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);
      const dateToCheckStr = format(dateToCheck, 'yyyy-MM-dd');
      const shiftToday = sortedPreviousShifts.find(s => s.date === dateToCheckStr && s.employeeName === emp.nombre);

      let todayShiftType: string;
      
      if (shiftToday) {
        todayShiftType = getShiftTypeForEval(shiftToday);
      } else {
        // Si no hay datos para este día, asumimos descanso
        todayShiftType = 'D';
      }

      // Determinar si es día de trabajo o descanso
      const isWorkDay = todayShiftType === 'M' || todayShiftType === 'T' || todayShiftType === 'N';
      const isRestDay = !isWorkDay;

      if (isWorkDay) {
        // Es día de trabajo
        if (lastTypeEncountered === 'M' || lastTypeEncountered === 'T' || lastTypeEncountered === 'N') {
          currentConsecutiveWork += 1;
        } else {
          currentConsecutiveWork = 1; // Primer día de trabajo después de descanso
        }
        currentConsecutiveRest = 0;
        
        if (shiftToday) {
          const { endTime: shiftEndTimeStr } = getShiftDetails(todayShiftType);
          lastWorkShiftEnd = getShiftDateTime(dateToCheck, shiftEndTimeStr, todayShiftType === 'N');
        }
      } else {
        // Es día de descanso
        if (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) {
          currentConsecutiveRest += 1;
        } else {
          currentConsecutiveRest = 1; // Primer día de descanso después de trabajo
        }
        currentConsecutiveWork = 0;
      }
      
      lastTypeEncountered = todayShiftType;
    }


    // Debug logging para detectar problemas de inicialización
    if (currentConsecutiveRest > 3) {
      console.warn(`⚠️ POSIBLE ERROR: ${emp.nombre} inicializado con ${currentConsecutiveRest} días de descanso consecutivos`);
      console.warn(`Último tipo encontrado: ${lastTypeEncountered}`);
      console.warn(`Días de lookback: ${lookbackDays}`);
    }

    employeeStates[emp.id_empleado] = {
      id: emp.id_empleado,
      name: emp.nombre,
      consecutiveWorkDays: currentConsecutiveWork,
      consecutiveRestDays: currentConsecutiveRest,
      shiftsThisMonth: 0,
      lastShiftType: lastTypeEncountered,
      lastActualWorkShiftEndTime: lastWorkShiftEnd,
      completeWeekendsOffThisMonth: 0
    };


  });
  return employeeStates;
}
