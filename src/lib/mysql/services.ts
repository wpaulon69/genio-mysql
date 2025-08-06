import { getConnection } from './config';
import type { Service } from '@/lib/types';

export async function getServices(): Promise<Service[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM servicios');
    return rows as Service[];
  } finally {
    connection.release();
  }
}

export async function createService(service: Omit<Service, 'id_servicio'>): Promise<number> {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO servicios (
        nombre_servicio, descripcion, habilitar_turno_noche, 
        dotacion_objetivo_lunes_a_viernes_mananas, dotacion_objetivo_lunes_a_viernes_tardes, dotacion_objetivo_lunes_a_viernes_noche,
        dotacion_objetivo_sab_dom_feriados_mananas, dotacion_objetivo_sab_dom_feriados_tardes, dotacion_objetivo_sab_dom_feriados_noche,
        max_dias_trabajo_consecutivos, max_descansos_consecutivos, dias_trabajo_consecutivos_preferidos,
        dias_descanso_consecutivos_preferidos, min_descansos_requeridos_antes_de_trabajar,
        fds_descanso_completo_objetivo, notas_adicionales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service.nombre_servicio, service.descripcion, service.habilitar_turno_noche,
        service.dotacion_objetivo_lunes_a_viernes_mananas, service.dotacion_objetivo_lunes_a_viernes_tardes, service.dotacion_objetivo_lunes_a_viernes_noche,
        service.dotacion_objetivo_sab_dom_feriados_mananas, service.dotacion_objetivo_sab_dom_feriados_tardes, service.dotacion_objetivo_sab_dom_feriados_noche,
        service.max_dias_trabajo_consecutivos, service.max_descansos_consecutivos, service.dias_trabajo_consecutivos_preferidos,
        service.dias_descanso_consecutivos_preferidos, service.min_descansos_requeridos_antes_de_trabajar,
        service.fds_descanso_completo_objetivo, service.notas_adicionales
      ]
    );
    return (result as any).insertId;
  } finally {
    connection.release();
  }
}

export async function updateService(id: number, service: Omit<Service, 'id_servicio'>): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(
      `UPDATE servicios SET
        nombre_servicio = ?, descripcion = ?, habilitar_turno_noche = ?,
        dotacion_objetivo_lunes_a_viernes_mananas = ?, dotacion_objetivo_lunes_a_viernes_tardes = ?, dotacion_objetivo_lunes_a_viernes_noche = ?,
        dotacion_objetivo_sab_dom_feriados_mananas = ?, dotacion_objetivo_sab_dom_feriados_tardes = ?, dotacion_objetivo_sab_dom_feriados_noche = ?,
        max_dias_trabajo_consecutivos = ?, max_descansos_consecutivos = ?, dias_trabajo_consecutivos_preferidos = ?,
        dias_descanso_consecutivos_preferidos = ?, min_descansos_requeridos_antes_de_trabajar = ?,
        fds_descanso_completo_objetivo = ?, notas_adicionales = ?
      WHERE id_servicio = ?`,
      [
        service.nombre_servicio, service.descripcion, service.habilitar_turno_noche,
        service.dotacion_objetivo_lunes_a_viernes_mananas, service.dotacion_objetivo_lunes_a_viernes_tardes, service.dotacion_objetivo_lunes_a_viernes_noche,
        service.dotacion_objetivo_sab_dom_feriados_mananas, service.dotacion_objetivo_sab_dom_feriados_tardes, service.dotacion_objetivo_sab_dom_feriados_noche,
        service.max_dias_trabajo_consecutivos, service.max_descansos_consecutivos, service.dias_trabajo_consecutivos_preferidos,
        service.dias_descanso_consecutivos_preferidos, service.min_descansos_requeridos_antes_de_trabajar,
        service.fds_descanso_completo_objetivo, service.notas_adicionales,
        id
      ]
    );
  } finally {
    connection.release();
  }
}

export async function deleteService(id: number): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute('DELETE FROM servicios WHERE id_servicio = ?', [id]);
  } finally {
    connection.release();
  }
}
