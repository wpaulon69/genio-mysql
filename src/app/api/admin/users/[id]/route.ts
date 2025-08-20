import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { updateUser, deactivateUser, activateUser } from '@/lib/mysql/users';
import * as AuthPermissions from '@/lib/auth/permissions';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.permissions.includes(AuthPermissions.PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, roleId, serviceId, employeeId, isActive, mustChangePassword } = body;

    if (!name || !email || !roleId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const resolvedParams = await params;
    await updateUser(resolvedParams.id, {
      name,
      email,
      password: password || undefined, // Solo actualizar si se proporciona
      roleId,
      serviceId: serviceId || undefined,
      employeeId: employeeId || undefined,
      isActive: isActive ?? true,
      mustChangePassword: mustChangePassword ?? true
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.permissions.includes(AuthPermissions.PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    
    // No permitir eliminar el propio usuario
    if (session.user.id === resolvedParams.id) {
      return NextResponse.json({ message: 'Cannot delete your own user' }, { status: 400 });
    }

    // Importar deleteUser
    const { deleteUser } = await import('@/lib/mysql/users');
    await deleteUser(resolvedParams.id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}