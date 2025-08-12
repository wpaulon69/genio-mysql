import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { displayName, level, description, permissions } = await request.json();
    const roleId = params.id;

    const connection = await getConnection();
    try {
      // Iniciar transacción
      await connection.execute('START TRANSACTION');

      // Actualizar información básica del rol
      await connection.execute(`
        UPDATE user_roles 
        SET display_name = ?, level = ?, description = ?, updated_at = NOW()
        WHERE id = ?
      `, [displayName, level, description, roleId]);

      // Eliminar permisos existentes
      await connection.execute(`
        DELETE FROM role_permissions WHERE role_id = ?
      `, [roleId]);

      // Insertar nuevos permisos
      if (permissions && permissions.length > 0) {
        const permissionValues = permissions.map((permissionId: string) => [roleId, permissionId]);
        const placeholders = permissions.map(() => '(?, ?)').join(', ');
        const flatValues = permissionValues.flat();
        
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}
        `, flatValues);
      }

      // Confirmar transacción
      await connection.execute('COMMIT');

      return NextResponse.json({ 
        message: 'Rol actualizado exitosamente',
        roleId 
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.execute('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const roleId = params.id;

    const connection = await getConnection();
    try {
      // Verificar si hay usuarios con este rol
      const [usersResult] = await connection.execute(`
        SELECT COUNT(*) as count FROM users WHERE role_id = ? AND is_active = 1
      `, [roleId]) as any;

      if (usersResult[0].count > 0) {
        return NextResponse.json(
          { error: `No se puede eliminar el rol. Hay ${usersResult[0].count} usuarios asignados.` },
          { status: 400 }
        );
      }

      // Iniciar transacción
      await connection.execute('START TRANSACTION');

      // Eliminar permisos del rol
      await connection.execute(`
        DELETE FROM role_permissions WHERE role_id = ?
      `, [roleId]);

      // Eliminar el rol
      await connection.execute(`
        DELETE FROM user_roles WHERE id = ?
      `, [roleId]);

      // Confirmar transacción
      await connection.execute('COMMIT');

      return NextResponse.json({ 
        message: 'Rol eliminado exitosamente' 
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.execute('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}