import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getConnection } from '@/lib/mysql/config';
import * as AuthPermissions from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los empleados activos
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT
          e.id_empleado,
          e.id_servicio,
          e.nombre,
          e.email_empleado,
          e.trabaja_feriados,
          e.elegible_franco_pos_guardia,
          e.prefiere_trabajar_fines_semana,
          e.disponibilidad_general,
          e.restricciones_especificas,
          s.nombre_servicio
        FROM empleados e
        LEFT JOIN servicios s ON e.id_servicio = s.id_servicio
        ORDER BY e.nombre ASC
      `);

      const employees = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
      console.log('GET /api/employees - Returning employees:', employees);
      return NextResponse.json(employees);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authorization check
    if (!session?.user || !session.user.permissions.map(p => p.trim().toLowerCase()).includes(AuthPermissions.PERMISSIONS.MANAGE_ALL_EMPLOYEES.toLowerCase())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre,
      email_empleado,
      id_servicio, // Optional
      trabaja_feriados, // Optional, defaults to 0
      elegible_franco_pos_guardia, // Optional, defaults to 0
      prefiere_trabajar_fines_semana, // Optional, defaults to 0
      disponibilidad_general, // Optional
      restricciones_especificas // Optional
    } = body;

    // Basic validation
    if (!nombre || !email_empleado) {
      return NextResponse.json({ message: 'Nombre y Email del empleado son campos requeridos.' }, { status: 400 });
    }

    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO empleados (
          nombre,
          email_empleado,
          id_servicio,
          trabaja_feriados,
          elegible_franco_pos_guardia,
          prefiere_trabajar_fines_semana,
          disponibilidad_general,
          restricciones_especificas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
          nombre,
          email_empleado,
          id_servicio || null, // Use null for optional int fields if not provided
          trabaja_feriados ?? 0, // Use default 0 if not provided
          elegible_franco_pos_guardia ?? 0, // Use default 0 if not provided
          prefiere_trabajar_fines_semana ?? 0, // Use default 0 if not provided
          disponibilidad_general || null,
          restricciones_especificas || null
        ]
      );

      const insertedId = (result as any).insertId;
      return NextResponse.json({ id_empleado: insertedId, message: 'Empleado creado exitosamente.' }, { status: 201 });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'El email del empleado ya existe.' }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ message: 'Error interno del servidor al crear empleado.' }, { status: 500 });
  }
}


