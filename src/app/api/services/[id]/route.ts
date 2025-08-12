import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { id } = await params;
    const serviceId = parseInt(id);
    
    // Verificar que el usuario solo pueda acceder a su propio servicio
    // Temporalmente comentado para debug
    // if (session.user.serviceId !== serviceId) {
    //   return NextResponse.json({ 
    //     error: 'No tienes acceso a este servicio' 
    //   }, { status: 403 });
    // }

    const connection = await getConnection();
    
    try {
      const [service] = await connection.execute(`
        SELECT 
          id_servicio,
          nombre_servicio,
          descripcion,
          habilitar_turno_noche,
          dotacion_objetivo_lunes_a_viernes_mananas,
          dotacion_objetivo_lunes_a_viernes_tardes,
          dotacion_objetivo_lunes_a_viernes_noche,
          dotacion_objetivo_sab_dom_feriados_mananas,
          dotacion_objetivo_sab_dom_feriados_tardes,
          dotacion_objetivo_sab_dom_feriados_noche,
          max_dias_trabajo_consecutivos,
          dias_trabajo_consecutivos_preferidos,
          max_descansos_consecutivos,
          dias_descanso_consecutivos_preferidos,
          min_descansos_requeridos_antes_de_trabajar,
          fds_descanso_completo_objetivo
        FROM servicios 
        WHERE id_servicio = ?
      `, [serviceId]) as any;

      if (service.length === 0) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
      }

      return NextResponse.json(service[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}