import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getConnection } from '@/lib/mysql/config';
import { hasPermission } from '@/lib/auth/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await getConnection();
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const employeeId = resolvedParams.id;

    if (!session?.user || !hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!employeeId) {
      return NextResponse.json({ message: 'ID de empleado es requerido.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      trabaja_feriados,
      turnos_fijos,
      asignaciones
    } = body;

    await connection.beginTransaction();

    // 1. Update basic preferences in empleados table
    await connection.execute(
      `UPDATE empleados SET trabaja_feriados = ? WHERE id_empleado = ?`,
      [trabaja_feriados ? 1 : 0, employeeId]
    );

    // 2. Update turnos_fijos (delete and insert)
    await connection.execute('DELETE FROM turnos_fijos WHERE id_empleado = ?', [employeeId]);
    if (turnos_fijos && turnos_fijos.length > 0) {
      const turnosFijosValues = turnos_fijos.map((turno: any) => [employeeId, turno.dia_semana, turno.tipo_turno]);
      await connection.query('INSERT INTO turnos_fijos (id_empleado, dia_semana, tipo_turno) VALUES ?', [turnosFijosValues]);
    }

    // 3. Update asignaciones (delete and insert)
    await connection.execute('DELETE FROM asignaciones_empleado WHERE id_empleado = ?', [employeeId]);
    if (asignaciones && asignaciones.length > 0) {
      const asignacionesValues = asignaciones.map((asig: any) => [
        employeeId, 
        asig.id_tipo_asignacion, 
        asig.fecha_inicio, 
        asig.fecha_fin, 
        asig.descripcion
      ]);
      await connection.query('INSERT INTO asignaciones_empleado (id_empleado, id_tipo_asignacion, fecha_inicio, fecha_fin, descripcion) VALUES ?', [asignacionesValues]);
    }

    await connection.commit();

    return NextResponse.json({ message: 'Preferencias de empleado actualizadas exitosamente.' });

  } catch (error: any) {
    await connection.rollback();
    console.error('Error updating employee preferences:', error);
    return NextResponse.json({ message: 'Error interno del servidor al actualizar preferencias.', error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

