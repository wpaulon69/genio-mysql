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
    const { trabaja_feriados, turnos_fijos, asignaciones } = await request.json();

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

      // Iniciar transacción
      await connection.beginTransaction();

      try {
        // Actualizar preferencia de feriados
        await connection.execute(`
          UPDATE empleados 
          SET trabaja_feriados = ?
          WHERE id_empleado = ?
        `, [trabaja_feriados ? 1 : 0, employeeId]);

        // Eliminar turnos fijos existentes
        await connection.execute(`
          DELETE FROM turnos_fijos_empleado 
          WHERE id_empleado = ?
        `, [employeeId]);

        // Insertar nuevos turnos fijos
        if (turnos_fijos && turnos_fijos.length > 0) {
          for (const turno of turnos_fijos) {
            await connection.execute(`
              INSERT INTO turnos_fijos_empleado (id_empleado, dia_semana, tipo_turno)
              VALUES (?, ?, ?)
            `, [employeeId, turno.dia_semana, turno.tipo_turno]);
          }
        }

        // Eliminar asignaciones existentes futuras
        await connection.execute(`
          DELETE FROM asignaciones_empleado 
          WHERE id_empleado = ? AND fecha_inicio >= CURDATE()
        `, [employeeId]);

        // Insertar nuevas asignaciones
        if (asignaciones && asignaciones.length > 0) {
          for (const asignacion of asignaciones) {
            await connection.execute(`
              INSERT INTO asignaciones_empleado (id_empleado, id_tipo_asignacion, fecha_inicio, fecha_fin, descripcion)
              VALUES (?, ?, ?, ?, ?)
            `, [
              employeeId, 
              asignacion.id_tipo_asignacion, 
              asignacion.fecha_inicio, 
              asignacion.fecha_fin,
              asignacion.descripcion || null
            ]);
          }
        }

        await connection.commit();

        return NextResponse.json({ 
          message: 'Preferencias actualizadas exitosamente',
          employeeId,
          employeeName: employee[0].nombre
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating employee preferences:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}