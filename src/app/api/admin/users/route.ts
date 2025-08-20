import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getAllUsers, createUser, getUserRoles } from '@/lib/mysql/users';
import { getServices } from '@/lib/mysql/services';
import { getEmployees } from '@/lib/mysql/employees';
import * as AuthPermissions from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.permissions.includes(AuthPermissions.PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const users = await getAllUsers();
    
    // Enriquecer con información de servicios y empleados
    const [services, employees] = await Promise.all([
      getServices(),
      getEmployees()
    ]);

    const enrichedUsers = users.map(user => ({
      ...user,
      serviceName: user.serviceId ? services.find(s => s.id_servicio === user.serviceId)?.nombre_servicio : null,
      employeeName: user.employeeId ? employees.find(e => e.id_empleado === user.employeeId)?.nombre : null
    }));

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.permissions.includes(AuthPermissions.PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, roleId, serviceId, employeeId, isActive, mustChangePassword } = body;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const userId = await createUser({
      name,
      email,
      password,
      roleId,
      serviceId: serviceId || undefined,
      employeeId: employeeId || undefined,
      isActive: isActive ?? true,
      mustChangePassword: mustChangePassword ?? true
    });

    return NextResponse.json({ id: userId, message: 'User created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}