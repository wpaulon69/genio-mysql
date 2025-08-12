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

    // Verificar permisos para gestionar usuarios
    if (!hasPermission(session.user, 'MANAGE_USERS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Obtener todos los roles
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT 
          id,
          name,
          display_name as displayName,
          level,
          description,
          created_at as createdAt
        FROM user_roles 
        ORDER BY level ASC
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { name, displayName, level, description, permissions } = await request.json();

    // Validaciones básicas
    if (!name || !displayName || !level || !description) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const connection = await getConnection();
    try {
      // Verificar si ya existe un rol con ese nombre
      const [existingRole] = await connection.execute(`
        SELECT id FROM user_roles WHERE name = ?
      `, [name]) as any;

      if (existingRole.length > 0) {
        return NextResponse.json(
          { error: 'Ya existe un rol con ese nombre interno' },
          { status: 400 }
        );
      }

      // Iniciar transacción
      await connection.execute('START TRANSACTION');

      // Crear el rol
      await connection.execute(`
        INSERT INTO user_roles (id, name, display_name, level, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [name, name, displayName, level, description]);

      // Insertar permisos si se proporcionaron
      if (permissions && permissions.length > 0) {
        const permissionValues = permissions.map((permissionId: string) => [name, permissionId]);
        const placeholders = permissions.map(() => '(?, ?)').join(', ');
        const flatValues = permissionValues.flat();
        
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}
        `, flatValues);
      }

      // Confirmar transacción
      await connection.execute('COMMIT');

      return NextResponse.json({ 
        message: 'Rol creado exitosamente',
        roleId: name 
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.execute('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}