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

    // Verificar permisos para gestionar roles
    if (!hasPermission(session.user, 'SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const connection = await getConnection();
    try {
      // Obtener todos los permisos disponibles
      const result = await connection.execute(`
        SELECT 
          id,
          name,
          resource,
          action,
          description
        FROM permissions 
        ORDER BY resource ASC, action ASC
      `);

      const permissions = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
      return NextResponse.json(permissions);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}