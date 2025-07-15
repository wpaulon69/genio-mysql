import { NextResponse } from 'next/server';
import { getPublishedMonthlySchedule } from '@/lib/mysql/monthlySchedules';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const serviceId = searchParams.get('serviceId');

  if (!year || !month || !serviceId) {
    return NextResponse.json({ message: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    const schedule = await getPublishedMonthlySchedule(year, month, serviceId);
    if (schedule) {
      return NextResponse.json(schedule);
    } else {
      return NextResponse.json({ message: 'No se encontró un horario publicado para el servicio y fecha seleccionados.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error en la API de calidad de horario:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return NextResponse.json({ message: 'Error al obtener el informe de calidad.', error: errorMessage }, { status: 500 });
  }
}
