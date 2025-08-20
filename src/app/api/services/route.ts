import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getConnection } from '@/lib/mysql/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden crear servicios
    if (!hasPermission(session.user, PERMISSIONS.MANAGE_ALL_SERVICES)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const serviceData = await request.json();
    const connection = await getConnection();
    
    try {
      const [result] = await connection.execute(`
        INSERT INTO servicios (
          nombre_servicio, descripcion, habilitar_turno_noche,
          dotacion_objetivo_lunes_a_viernes_mananas, dotacion_objetivo_lunes_a_viernes_tardes, dotacion_objetivo_lunes_a_viernes_noche,
          dotacion_objetivo_sab_dom_feriados_mananas, dotacion_objetivo_sab_dom_feriados_tardes, dotacion_objetivo_sab_dom_feriados_noche,
          max_dias_trabajo_consecutivos, dias_trabajo_consecutivos_preferidos, max_descansos_consecutivos,
          dias_descanso_consecutivos_preferidos, min_descansos_requeridos_antes_de_trabajar, fds_descanso_completo_objetivo,
          notas_adicionales
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        serviceData.notas_adicionales || null
      ]);

      return NextResponse.json({ 
        message: 'Servicio creado exitosamente',
        id_servicio: (result as any).insertId 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const serviceData = await request.json();
    const connection = await getConnection();
    
    try {
      // Verificar permisos: Admin puede editar cualquier servicio, Jefe de servicio solo el suyo
      if (!hasPermission(session.user, PERMISSIONS.MANAGE_ALL_SERVICES)) {
        if (!session.user.serviceId || session.user.serviceId !== serviceData.id_servicio) {
          return NextResponse.json({ error: 'Sin permisos para editar este servicio' }, { status: 403 });
        }
      }

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
        serviceData.id_servicio
      ]);

      return NextResponse.json({ message: 'Servicio actualizado exitosamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden eliminar servicios
    if (!hasPermission(session.user, PERMISSIONS.MANAGE_ALL_SERVICES)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');

    if (!serviceId) {
      return NextResponse.json({ error: 'ID de servicio requerido' }, { status: 400 });
    }

    const connection = await getConnection();
    
    try {
      await connection.execute('DELETE FROM servicios WHERE id_servicio = ?', [serviceId]);
      return NextResponse.json({ message: 'Servicio eliminado exitosamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}