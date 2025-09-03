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

    // Verificar permisos: Admin puede ver cualquier servicio, Jefe de servicio solo el suyo
    const canManageAllServices = hasPermission(session.user, 'MANAGE_ALL_SERVICES');
    const canManageOwnService = hasPermission(session.user, 'MANAGE_OWN_SERVICE');
    
    if (!canManageAllServices && !canManageOwnService) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { id } = await params;
    const serviceId = parseInt(id);
    
    // Verificar que el usuario solo pueda acceder a su propio servicio (si no es admin)
    if (!canManageAllServices && session.user.serviceId !== serviceId) {
      return NextResponse.json({ 
        error: 'No tienes acceso a este servicio' 
      }, { status: 403 });
    }

    const connection = await getConnection();
    
    try {
      const [service] = await connection.execute(`
        SELECT 
          id_servicio,
          nombre_servicio,
          descripcion,
          habilitar_turno_noche,
          targetCompleteWeekendsOff,
          notas_adicionales,
          dotacion_objetivo_lunes_a_viernes_mananas,
          dotacion_objetivo_lunes_a_viernes_tardes,
          dotacion_objetivo_lunes_a_viernes_noche,
          dotacion_objetivo_sab_dom_feriados_mananas,
          dotacion_objetivo_sab_dom_feriados_tardes,
          dotacion_objetivo_sab_dom_feriados_noche,
          max_dias_trabajo_consecutivos,
          max_descansos_consecutivos,
          dias_trabajo_consecutivos_preferidos,
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
  } catch (error: any) {
    console.error('❌ API /services/[id] - Error completo:', error);
    console.error('❌ API /services/[id] - Error message:', error.message);
    console.error('❌ API /services/[id] - Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos: Admin puede editar cualquier servicio, Jefe de servicio solo el suyo
    const canManageAllServices = hasPermission(session.user, 'MANAGE_ALL_SERVICES');
    const canManageOwnService = hasPermission(session.user, 'MANAGE_OWN_SERVICE');
    
    if (!canManageAllServices && !canManageOwnService) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { id } = await params;
    const serviceId = parseInt(id);
    const serviceData = await request.json();
    
    // Verificar que el usuario solo pueda editar su propio servicio (si no es admin)
    if (!canManageAllServices && session.user.serviceId !== serviceId) {
      return NextResponse.json({ 
        error: 'Sin permisos para editar este servicio' 
      }, { status: 403 });
    }

    const connection = await getConnection();
    
    try {
      await connection.execute(`
        UPDATE servicios SET
          nombre_servicio = ?, descripcion = ?, habilitar_turno_noche = ?,
          dotacion_objetivo_lunes_a_viernes_mananas = ?, dotacion_objetivo_lunes_a_viernes_tardes = ?, dotacion_objetivo_lunes_a_viernes_noche = ?,
          dotacion_objetivo_sab_dom_feriados_mananas = ?, dotacion_objetivo_sab_dom_feriados_tardes = ?, dotacion_objetivo_sab_dom_feriados_noche = ?,
          max_dias_trabajo_consecutivos = ?, dias_trabajo_consecutivos_preferidos = ?, max_descansos_consecutivos = ?,
          dias_descanso_consecutivos_preferidos = ?, min_descansos_requeridos_antes_de_trabajar = ?, fds_descanso_completo_objetivo = ?,
          notas_adicionales = ?
        WHERE id_servicio = ?
      `, [
        serviceData.nombre_servicio,
        serviceData.descripcion || null,
        serviceData.habilitar_turno_noche ? 1 : 0,
        serviceData.dotacion_objetivo_lunes_a_viernes_mananas || 0,
        serviceData.dotacion_objetivo_lunes_a_viernes_tardes || 0,
        serviceData.dotacion_objetivo_lunes_a_viernes_noche || 0,
        serviceData.dotacion_objetivo_sab_dom_feriados_mananas || 0,
        serviceData.dotacion_objetivo_sab_dom_feriados_tardes || 0,
        serviceData.dotacion_objetivo_sab_dom_feriados_noche || 0,
        serviceData.max_dias_trabajo_consecutivos || 6,
        serviceData.dias_trabajo_consecutivos_preferidos || 5,
        serviceData.max_descansos_consecutivos || 3,
        serviceData.dias_descanso_consecutivos_preferidos || 2,
        serviceData.min_descansos_requeridos_antes_de_trabajar || 1,
        serviceData.fds_descanso_completo_objetivo || 1,
        serviceData.notas_adicionales || null,
        serviceId
      ]);

      return NextResponse.json({ message: 'Servicio actualizado exitosamente' });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}