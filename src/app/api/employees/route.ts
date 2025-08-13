import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getConnection } from '@/lib/mysql/config';

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