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
    const connection = await getConnection();
    
    try {
      // Obtener empleados asignados al servicio del usuario
      const result = await connection.execute(`
        SELECT 
          id_empleado,
          id_servicio,
          nombre,
          email_empleado,
          elegible_franco_pos_guardia,
          prefiere_trabajar_fines_semana,
          disponibilidad_general,
          restricciones_especificas,
          trabaja_feriados
        FROM empleados 
        WHERE id_servicio = ?
        ORDER BY nombre ASC
      `, [serviceId]);

      const employees = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
      
      // Para cada empleado, obtener sus turnos fijos y asignaciones
      for (let employee of employees) {
        // Obtener turnos fijos
        const [turnosFijos] = await connection.execute(`
          SELECT dia_semana, tipo_turno
          FROM turnos_fijos
          WHERE id_empleado = ?
          ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')
        `, [employee.id_empleado]) as any;

        // Obtener asignaciones futuras
        const [asignaciones] = await connection.execute(`
          SELECT 
            ae.id_tipo_asignacion,
            ae.fecha_inicio,
            ae.fecha_fin,
            ae.descripcion,
            ta.nombre_tipo
          FROM asignaciones_empleado ae
          JOIN tipos_asignacion ta ON ae.id_tipo_asignacion = ta.id_tipo_asignacion
          WHERE ae.id_empleado = ? AND ae.fecha_fin >= CURDATE()
          ORDER BY ae.fecha_inicio
        `, [employee.id_empleado]) as any;

        employee.turnos_fijos = turnosFijos || [];
        employee.asignaciones = asignaciones || [];
      }
      
      return NextResponse.json(employees);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching service employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}