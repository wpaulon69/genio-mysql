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
      const [assignmentTypes] = await connection.execute(`
        SELECT id_tipo_asignacion, nombre_tipo, descripcion
        FROM tipos_asignacion
        ORDER BY nombre_tipo
      `) as any;

      return NextResponse.json(assignmentTypes);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching assignment types:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}