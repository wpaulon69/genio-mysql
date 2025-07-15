import { NextResponse } from 'next/server';
import { getSchedulesInDateRange } from '@/lib/mysql/monthlySchedules';
import { getShiftType } from '@/lib/scheduler/utils';
import type { MonthlySchedule } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearFrom = searchParams.get('yearFrom');
  const monthFrom = searchParams.get('monthFrom');
  const yearTo = searchParams.get('yearTo');
  const monthTo = searchParams.get('monthTo');
  const serviceId = searchParams.get('serviceId');

  if (!yearFrom || !monthFrom || !yearTo || !monthTo || !serviceId) {
    return NextResponse.json({ message: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    const schedulesInRange = await getSchedulesInDateRange(yearFrom, monthFrom, yearTo, monthTo, serviceId);

    const comparisonData = schedulesInRange.map((schedule: MonthlySchedule) => {
      const workDays = schedule.shifts.filter(s => ['M', 'T', 'N'].includes(getShiftType(s))).length;
      const restDays = schedule.shifts.length - workDays;
      
      return {
        month: `${new Date(parseInt(schedule.year), parseInt(schedule.month) - 1).toLocaleString('es-ES', { month: 'long' })} ${schedule.year}`,
        score: schedule.score,
        totalViolations: schedule.violations?.length || 0,
        errorViolations: schedule.violations?.filter(v => v.severity === 'error').length || 0,
        warningViolations: schedule.violations?.filter(v => v.severity === 'warning').length || 0,
        workDays: workDays,
        restDays: restDays,
      };
    });

    return NextResponse.json(comparisonData);
  } catch (error) {
    console.error('Error en la API de comparación de horarios:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return NextResponse.json({ message: 'Error al generar el informe comparativo.', error: errorMessage }, { status: 500 });
  }
}
