import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_ALL_EMPLOYEES')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'ID de empleado requerido' }, { status: 400 });
    }

    const connection = await getConnection();
    
    try {
      // Verificar que el empleado existe
      const [employee] = await connection.execute(`
        SELECT id_empleado, nombre, id_servicio
        FROM empleados 
        WHERE id_empleado = ?
      `, [employeeId]) as any;

      if (employee.length === 0) {
        return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
      }

      // Desasignar el empleado del servicio
      await connection.execute(`
        UPDATE empleados 
        SET id_servicio = NULL
        WHERE id_empleado = ?
      `, [employeeId]);

      return NextResponse.json({ 
        message: 'Empleado desasignado exitosamente',
        employeeId,
        employeeName: employee[0].nombre
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error unassigning employee:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}