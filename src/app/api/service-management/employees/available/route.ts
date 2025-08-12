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

    const connection = await getConnection();
    
    try {
      // Obtener empleados sin servicio asignado o con servicio NULL/0
      const result = await connection.execute(`
        SELECT 
          id_empleado,
          nombre,
          email_empleado,
          id_servicio
        FROM empleados 
        WHERE id_servicio IS NULL OR id_servicio = 0
        ORDER BY nombre ASC
      `);

      const employees = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
      return NextResponse.json(employees);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching available employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}