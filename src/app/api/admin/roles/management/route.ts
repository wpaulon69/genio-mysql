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
      // Obtener roles con información adicional
      const result = await connection.execute(`
        SELECT 
          ur.id,
          ur.name,
          ur.display_name as displayName,
          ur.level,
          ur.description,
          ur.created_at as createdAt,
          COUNT(DISTINCT rp.permission_id) as permissionsCount,
          COUNT(DISTINCT u.id) as usersCount
        FROM user_roles ur
        LEFT JOIN role_permissions rp ON ur.id = rp.role_id
        LEFT JOIN users u ON ur.id = u.role_id AND u.is_active = 1
        GROUP BY ur.id, ur.name, ur.display_name, ur.level, ur.description, ur.created_at
        ORDER BY ur.level ASC
      `);

      const roles = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
      return NextResponse.json(roles);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}