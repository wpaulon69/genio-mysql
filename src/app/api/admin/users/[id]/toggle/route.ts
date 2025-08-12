import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { activateUser, deactivateUser } from '@/lib/mysql/users';
import { PERMISSIONS } from '@/lib/types/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.permissions.includes(PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    // No permitir desactivar el propio usuario
    if (session.user.id === params.id && !isActive) {
      return NextResponse.json({ message: 'Cannot deactivate your own user' }, { status: 400 });
    }

    if (isActive) {
      await activateUser(params.id);
    } else {
      await deactivateUser(params.id);
    }

    return NextResponse.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]/toggle:', error);
    return NextResponse.json({ message: 'Error updating user status' }, { status: 500 });
  }
}