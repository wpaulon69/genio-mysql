import {
  getMonthlySchedules,
  createMonthlySchedule,
  updateMonthlySchedule,
  deleteMonthlySchedule,
} from '@/lib/mysql/monthlySchedules';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || undefined;
    const month = searchParams.get('month') || undefined;
    const serviceId = searchParams.get('serviceId') || undefined;
    const status = searchParams.get('status') || undefined;

    const schedules = await getMonthlySchedules(year, month, serviceId, status);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error in GET /api/monthlySchedules:', error);
    return NextResponse.json({ message: 'Error fetching schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSchedule = await createMonthlySchedule(body);
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/monthlySchedules:', error);
    return NextResponse.json({ message: 'Error creating schedule' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await updateMonthlySchedule(body);
    return NextResponse.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/monthlySchedules:', error);
    return NextResponse.json({ message: 'Error updating schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const password = searchParams.get('password');

    if (password !== 'dev-delete') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!scheduleId) {
      return NextResponse.json({ message: 'scheduleId is required' }, { status: 400 });
    }

    await deleteMonthlySchedule(scheduleId);
    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/monthlySchedules:', error);
    return NextResponse.json({ message: 'Error deleting schedule' }, { status: 500 });
  }
}
