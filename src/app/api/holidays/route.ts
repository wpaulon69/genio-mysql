import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '@/lib/mysql/holidays';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Los feriados pueden ser vistos por cualquier usuario autenticado
    // ya que son necesarios para la generación de horarios
    const holidays = await getHolidays();
    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error in GET /api/holidays:', error);
    return NextResponse.json({ message: 'Error fetching holidays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_HOLIDAYS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const body = await request.json();
    const newHolidayId = await createHoliday(body);
    return NextResponse.json({ id: newHolidayId }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/holidays:', error);
    return NextResponse.json({ message: 'Error creating holiday' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_HOLIDAYS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ message: 'Holiday ID is required' }, { status: 400 });
    }
    await updateHoliday(id, data);
    return NextResponse.json({ message: 'Holiday updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/holidays:', error);
    return NextResponse.json({ message: 'Error updating holiday' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_HOLIDAYS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Holiday ID is required' }, { status: 400 });
    }
    await deleteHoliday(Number(id));
    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/holidays:', error);
    return NextResponse.json({ message: 'Error deleting holiday' }, { status: 500 });
  }
}
