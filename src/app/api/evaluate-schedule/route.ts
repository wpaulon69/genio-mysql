import { NextResponse } from 'next/server';
import { evaluateScheduleMetrics } from '@/lib/scheduler/evaluation';
import { createServiceSpecificRulesConfig } from '@/lib/scheduler/config';
import type { AIShift, Service, Employee, Holiday } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shifts,
      service,
      month,
      year,
      employees,
      holidays,
      previousMonthShifts,
    }: {
      shifts: AIShift[];
      service: Service;
      month: string;
      year: string;
      employees: Employee[];
      holidays: Holiday[];
      previousMonthShifts: AIShift[] | null;
    } = body;

    if (!shifts || !service || !month || !year || !employees || !holidays) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos para la evaluación.' }, { status: 400 });
    }

    const rulesConfig = createServiceSpecificRulesConfig(service);

    const evaluationResult = await evaluateScheduleMetrics(
      shifts,
      service,
      month,
      year,
      employees,
      holidays,
      previousMonthShifts,
      rulesConfig
    );

    return NextResponse.json(evaluationResult);
  } catch (error) {
    console.error('Error en la API de evaluación de horarios:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return NextResponse.json({ message: 'Error al evaluar el horario.', error: errorMessage }, { status: 500 });
  }
}
