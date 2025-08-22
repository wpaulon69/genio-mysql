import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos para gestionar empleados del servicio
    if (!hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Verificar que el usuario tenga un servicio asignado
    if (!session.user.serviceId) {
      return NextResponse.json({ error: 'Usuario sin servicio asignado' }, { status: 400 });
    }

    const serviceId = session.user.serviceId;
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('es-ES', { month: 'long' });
    const connection = await getConnection();
    
    try {
      // Obtener información del servicio
      const [serviceInfo] = await connection.execute(`
        SELECT nombre_servicio, descripcion
        FROM servicios 
        WHERE id_servicio = ?
      `, [serviceId]) as any;

      if (serviceInfo.length === 0) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
      }

      // Contar empleados asignados al servicio
      const [assignedEmployees] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM empleados 
        WHERE id_servicio = ?
      `, [serviceId]) as any;

      // Contar total de horarios (borrador, publicado, archivado)
      let totalSchedulesCount = 0;
      try {
        const [totalSchedules] = await connection.execute(`
          SELECT COUNT(*) as count
          FROM horarios 
          WHERE serviceId = ?
        `, [serviceId]) as any;
        totalSchedulesCount = totalSchedules[0].count;
      } catch (error) {
        console.log('Warning: Could not count total schedules, table might not exist:', error);
        totalSchedulesCount = 0;
      }

      // Contar horarios publicados para el mes actual
      let publishedScheduleCount = 0;
      try {
        const [activeSchedule] = await connection.execute(`
          SELECT COUNT(*) as count
          FROM horarios 
          WHERE serviceId = ? 
          AND year = ? 
          AND month = ?
          AND status = 'published'
        `, [serviceId, currentDate.getFullYear(), currentDate.getMonth() + 1]) as any;
        publishedScheduleCount = activeSchedule[0].count;
      } catch (error) {
        console.log('Warning: Could not check monthly schedules, table might not exist:', error);
        publishedScheduleCount = 0;
      }

      // Determinar el próximo mes/año para generar horario
      let nextScheduleMonth = currentDate.getMonth() + 1;
      let nextScheduleYear = currentDate.getFullYear();

      let maxYear = null;
      let maxMonth = null;

      try {
        const [latestSchedule] = await connection.execute(`
          SELECT MAX(year) as maxYear, MAX(month) as maxMonth
          FROM horarios
          WHERE serviceId = ?
        `, [serviceId]) as any;

        if (latestSchedule && latestSchedule[0].maxYear && latestSchedule[0].maxMonth) {
          maxYear = latestSchedule[0].maxYear;
          maxMonth = parseInt(latestSchedule[0].maxMonth as string, 10);

          if (maxMonth === 12) {
            nextScheduleMonth = 1;
            nextScheduleYear = maxYear + 1;
          } else {
            nextScheduleMonth = maxMonth + 1;
            nextScheduleYear = maxYear;
          }
        }
      } catch (error) {
        console.log('Warning: Could not determine next schedule month/year:', error);
      }

      let pendingRequests = 0; // TODO: Implement actual fetching of pending requests count

      // Fetch scores for the last 6 published schedules
      let averageScore = null;
      try {
        const [scheduleScores] = await connection.execute(`
          SELECT score
          FROM horarios
          WHERE serviceId = ? AND status = 'published' AND score IS NOT NULL
          ORDER BY year DESC, month DESC
          LIMIT 6
        `, [serviceId]) as any;

        if (scheduleScores.length > 0) {
          const totalScore = scheduleScores.reduce((sum: number, row: { score: number }) => sum + row.score, 0);
          averageScore = totalScore / scheduleScores.length;
        }
      } catch (error) {
        console.log('Warning: Could not fetch schedule scores:', error);
      }

      console.log('maxYear:', maxYear, 'maxMonth:', maxMonth);
      console.log('nextScheduleYear (before stats):', nextScheduleYear, 'nextScheduleMonth (before stats):', nextScheduleMonth);

      const stats = {
        serviceName: serviceInfo[0].nombre_servicio,
        averageScheduleScore: averageScore,
        assignedEmployees: assignedEmployees[0].count,
        currentMonth: currentMonth,
        pendingRequests: pendingRequests,
        activeSchedule: publishedScheduleCount > 0,
        totalSchedules: totalSchedulesCount,
        publishedSchedules: publishedScheduleCount,
        nextScheduleMonth: new Date(nextScheduleYear, nextScheduleMonth - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        nextScheduleYear: nextScheduleYear
      };

      return NextResponse.json(stats);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching service stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}