import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const employeeId = resolvedParams.id;
    const body = await request.json();
    const {
      nombre,
      email_empleado,
      trabaja_feriados,
      elegible_franco_pos_guardia,
      prefiere_trabajar_fines_semana,
      disponibilidad_general,
      restricciones_especificas
    } = body;

    console.log(`PUT /api/service-management/employees/${employeeId} - Request Body:`, body);

    if (!employeeId) {
      return NextResponse.json({ message: 'ID de empleado es requerido.' }, { status: 400 });
    }

    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE empleados SET
          nombre = ?,
          email_empleado = ?,
          trabaja_feriados = ?,
          elegible_franco_pos_guardia = ?,
          prefiere_trabajar_fines_semana = ?,
          disponibilidad_general = ?,
          restricciones_especificas = ?
        WHERE id_empleado = ?`,
        [
          nombre,
          email_empleado,
          trabaja_feriados ? 1 : 0,
          elegible_franco_pos_guardia ? 1 : 0,
          prefiere_trabajar_fines_semana ? 1 : 0,
          disponibilidad_general || null,
          restricciones_especificas || null,
          employeeId
        ]
      );

      if ((result as any).affectedRows === 0) {
        return NextResponse.json({ message: 'Empleado no encontrado o no se realizaron cambios.' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Empleado actualizado exitosamente.' }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ message: 'Error interno del servidor al actualizar el empleado.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const serviceId = session.user.serviceId;
    const connection = await getConnection();
    
    try {
      // Verificar que el empleado pertenece al servicio del usuario
      const [employee] = await connection.execute(`
        SELECT id_empleado, nombre, id_servicio
        FROM empleados 
        WHERE id_empleado = ?
      `, [employeeId]) as any;

      if (employee.length === 0) {
        return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
      }

      if (employee[0].id_servicio !== serviceId) {
        return NextResponse.json({ 
          error: 'El empleado no pertenece a tu servicio' 
        }, { status: 403 });
      }

      // TODO: Verificar que el empleado no tenga horarios activos
      // const [activeSchedules] = await connection.execute(`
      //   SELECT COUNT(*) as count
      //   FROM schedule_assignments 
      //   WHERE employee_id = ? AND schedule_date >= CURDATE()
      // `, [employeeId]) as any;

      // if (activeSchedules[0].count > 0) {
      //   return NextResponse.json({ 
      //     error: 'No se puede remover el empleado porque tiene horarios activos' 
      //   }, { status: 400 });
      // }

      // Remover el empleado del servicio (establecer id_servicio como NULL)
      await connection.execute(`
        UPDATE empleados 
        SET id_servicio = NULL
        WHERE id_empleado = ?
      `, [employeeId]);

      return NextResponse.json({ 
        message: 'Empleado removido exitosamente del servicio',
        employeeId,
        employeeName: employee[0].nombre
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error removing employee:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}