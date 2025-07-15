import { NextResponse } from 'next/server';
import { getSchedulesInDateRange } from '@/lib/mysql/monthlySchedules';
import { getEmployees } from '@/lib/mysql/employees';
import { getHolidays } from '@/lib/mysql/holidays';
import { getShiftType } from '@/lib/scheduler/utils';
import { parseISO, getDay } from 'date-fns';
import type { MonthlySchedule, EmployeeReportMetrics, Employee } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearFrom = searchParams.get('yearFrom');
  const monthFrom = searchParams.get('monthFrom');
  const yearTo = searchParams.get('yearTo');
  const monthTo = searchParams.get('monthTo');
  const serviceId = searchParams.get('serviceId') || undefined;

  if (!yearFrom || !monthFrom || !yearTo || !monthTo) {
    return NextResponse.json({ message: 'Faltan parámetros de fecha requeridos' }, { status: 400 });
  }

  try {
    const [schedulesInRange, employees, holidays] = await Promise.all([
        getSchedulesInDateRange(yearFrom, monthFrom, yearTo, monthTo, serviceId),
        getEmployees(),
        getHolidays()
    ]);

    const metricsByEmployee: Record<string, EmployeeReportMetrics> = {};

    schedulesInRange.forEach((schedule: MonthlySchedule) => {
      schedule.shifts.forEach(shift => {
        try {
          const employee = (employees as Employee[]).find(e => e.nombre === shift.employeeName);
          if (!employee) {
            console.warn(`No se encontró empleado para el turno: ${shift.employeeName}`);
            return;
          }

          if (!metricsByEmployee[employee.id_empleado]) {
            metricsByEmployee[employee.id_empleado] = {
              employeeId: employee.id_empleado.toString(),
              employeeName: employee.nombre,
              totalAssignedDays: 0, workDays: 0, weekendWorkDays: 0, holidayWorkDays: 0,
              weekendRestDays: 0, restDays: 0, ptoDays: 0, sickLeaveDays: 0, compOffDays: 0, holidaysOff: 0,
              shiftsM: 0, shiftsT: 0, shiftsN: 0,
              workToRestRatio: '',
            };
          }
          const metrics = metricsByEmployee[employee.id_empleado];
          metrics.totalAssignedDays++;

          // The DB may return a string or a Date object. Create a clean 'yyyy-MM-dd' string.
          const dateString = new Date(shift.date).toISOString().split('T')[0];
          if (dateString === 'Invalid Date') {
            console.error('Fecha inválida encontrada en el turno:', shift);
            return; // Skip this shift
          }

          const shiftDate = parseISO(dateString);
          const dayOfWeek = getDay(shiftDate);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isCurrentHoliday = holidays.some(h => h.date === dateString);
          const shiftType = getShiftType(shift);

          if (shiftType === 'M') metrics.shiftsM++;
          else if (shiftType === 'T') metrics.shiftsT++;
          else if (shiftType === 'N') metrics.shiftsN++;

          if (['M', 'T', 'N'].includes(shiftType)) {
            metrics.workDays++;
            if (isCurrentHoliday) metrics.holidayWorkDays++;
            else if (isWeekend) metrics.weekendWorkDays++;
          } else if (shiftType === 'D') {
            metrics.restDays++;
            if (isWeekend) metrics.weekendRestDays++;
          } else if (shiftType === 'LAO') {
            metrics.ptoDays++;
          } else if (shiftType === 'LM') {
            metrics.sickLeaveDays++;
          } else if (shiftType === 'C') {
            metrics.compOffDays++;
          } else if (shiftType === 'F') {
            metrics.holidaysOff++;
            if (isWeekend) metrics.weekendRestDays++;
          }
        } catch (error) {
          console.error('Error procesando el turno:', shift, error);
        }
      });
    });

    const reportDataArray = Object.values(metricsByEmployee).map(metrics => {
      const totalOffDays = metrics.restDays + metrics.ptoDays + metrics.sickLeaveDays + metrics.compOffDays + metrics.holidaysOff;
      metrics.workToRestRatio = `${metrics.workDays} W : ${totalOffDays} L`;
      return metrics;
    }).sort((a,b) => a.employeeName.localeCompare(b.employeeName));

    return NextResponse.json(reportDataArray);
  } catch (error) {
    console.error('Error en la API de comparación de empleados:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return NextResponse.json({ message: 'Error al generar el informe de comparación de empleados.', error: errorMessage }, { status: 500 });
  }
}
