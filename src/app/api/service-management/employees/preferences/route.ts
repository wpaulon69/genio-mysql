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

    if (!hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    if (!session.user.serviceId) {
      return NextResponse.json({ error: 'Usuario sin servicio asignado' }, { status: 400 });
    }

    const serviceId = session.user.serviceId;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 });
    }
    const connection = await getConnection();
    
    try {
      // Obtener empleados básicos del servicio
      // Simplificamos para usar solo la tabla empleados que sabemos que existe
      const [employees] = await connection.execute(`
        SELECT 
          e.id_empleado,
          e.nombre,
          COALESCE(e.trabaja_feriados, 0) as trabaja_feriados
        FROM empleados e
        WHERE e.id_servicio = ?
        ORDER BY e.nombre
      `, [serviceId]) as any;

      // Agregar mes y año desde los parámetros
      const employeesWithPeriod = employees.map(emp => ({
        ...emp,
        mes: parseInt(month),
        anio: parseInt(year)
      }));

      // Obtener turnos fijos para todos los empleados del servicio
      const [turnosFijos] = await connection.execute(`
        SELECT 
          tf.id_empleado,
          tf.dia_semana,
          tf.tipo_turno
        FROM turnos_fijos tf
        INNER JOIN empleados e ON tf.id_empleado = e.id_empleado
        WHERE e.id_servicio = ?
        ORDER BY tf.id_empleado, tf.dia_semana
      `, [serviceId]) as any;

      // Obtener asignaciones activas para el período específico
      const startOfMonth = `${year}-${month.padStart(2, '0')}-01`;
      const endOfMonth = `${year}-${month.padStart(2, '0')}-31`;
      
      const [asignaciones] = await connection.execute(`
        SELECT 
          a.id_empleado,
          a.id_tipo_asignacion,
          ta.nombre_tipo as tipo_asignacion,
          a.fecha_inicio,
          a.fecha_fin,
          a.descripcion
        FROM asignaciones_empleado a
        INNER JOIN empleados e ON a.id_empleado = e.id_empleado
        INNER JOIN tipos_asignacion ta ON a.id_tipo_asignacion = ta.id_tipo_asignacion
        WHERE e.id_servicio = ? 
          AND (
            (a.fecha_inicio <= ? AND a.fecha_fin >= ?) OR
            (a.fecha_inicio >= ? AND a.fecha_inicio <= ?)
          )
        ORDER BY a.id_empleado, a.fecha_inicio
      `, [serviceId, endOfMonth, startOfMonth, startOfMonth, endOfMonth]) as any;

      // Organizar los datos
      const employeesWithPreferences = employeesWithPeriod.map(emp => ({
        ...emp,
        turnos_fijos: turnosFijos.filter(tf => tf.id_empleado === emp.id_empleado),
        asignaciones: asignaciones.filter(a => a.id_empleado === emp.id_empleado)
      }));

      return NextResponse.json(employeesWithPreferences);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching employee preferences:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}