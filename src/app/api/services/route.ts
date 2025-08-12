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

    // Obtener todos los servicios
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT 
          id_servicio,
          nombre_servicio,
          descripcion
        FROM servicios 
        ORDER BY nombre_servicio ASC
      `);

      const services = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
      return NextResponse.json(services);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}