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

      // Contar empleados disponibles (sin servicio asignado)
      const [availableEmployees] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM empleados 
        WHERE id_servicio IS NULL OR id_servicio = 0
      `) as any;

      // Obtener mes actual
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });

      // Verificar si hay horario activo para el mes actual
      let activeScheduleCount = 0;
      try {
        const [activeSchedule] = await connection.execute(`
          SELECT COUNT(*) as count
          FROM monthly_schedules 
          WHERE service_id = ? 
          AND YEAR(STR_TO_DATE(CONCAT(year, '-', month, '-01'), '%Y-%m-%d')) = ? 
          AND MONTH(STR_TO_DATE(CONCAT(year, '-', month, '-01'), '%Y-%m-%d')) = ?
        `, [serviceId, currentDate.getFullYear(), currentDate.getMonth() + 1]) as any;
        activeScheduleCount = activeSchedule[0].count;
      } catch (error) {
        console.log('Warning: Could not check monthly schedules, table might not exist:', error);
        activeScheduleCount = 0;
      }

      // Calcular cobertura basada en empleados asignados vs disponibles
      const totalEmployees = assignedEmployees[0].count + availableEmployees[0].count;
      const coverage = totalEmployees > 0 ? Math.round((assignedEmployees[0].count / totalEmployees) * 100) : 0;
      const targetCoverage = 90;

      // Contar solicitudes pendientes (simulado por ahora)
      // TODO: Implementar tabla de solicitudes de cambios de turno
      const pendingRequests = 0; // Simplificado por ahora

      const stats = {
        serviceName: serviceInfo[0].nombre_servicio,
        assignedEmployees: assignedEmployees[0].count,
        availableEmployees: availableEmployees[0].count,
        currentMonth: currentMonth,
        coverage: coverage,
        targetCoverage: targetCoverage,
        pendingRequests: pendingRequests,
        activeSchedule: activeScheduleCount > 0
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