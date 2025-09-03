import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission, getUserPermissions } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

interface RawEmployee {
  id_empleado: number;
  nombre: string;
  email_empleado: string;
  trabaja_feriados: number;
  elegible_franco_pos_guardia: number;
  prefiere_trabajar_fines_semana: number;
  disponibilidad_general: string | null;
  restricciones_especificas: string | null;
}

interface RawTurnoFijo {
  id_empleado: number;
  dia_semana: string;
  tipo_turno: string;
}

interface RawAsignacion {
  id_empleado: number;
  id_tipo_asignacion: number;
  tipo_asignacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string | null;
}

interface RawAdditionalPreference {
  employeeId: number;
  elegible_franco_pos_guardia_adicional: number;
  prefiere_trabajar_fines_semana_adicional: number;
  fixedWeeklyShiftTiming: string | null;
  workPattern: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Verificar serviceId - puede venir de parámetro (Admin Hospital) o sesión (Jefe Servicio)
    const { searchParams } = new URL(request.url);
    const serviceIdParam = searchParams.get('serviceId');
    const serviceId = serviceIdParam || session.user.serviceId;
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Usuario sin servicio asignado' }, { status: 400 });
    }
    
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 });
    }
    
    const connection = await getConnection();
    
    try {
      // Obtener empleados básicos del servicio con preferencias de la tabla empleados
      const [employees] = await connection.execute(`
        SELECT 
          e.id_empleado,
          e.nombre,
          e.email_empleado,
          COALESCE(e.trabaja_feriados, 0) as trabaja_feriados,
          COALESCE(e.elegible_franco_pos_guardia, 0) as elegible_franco_pos_guardia,
          COALESCE(e.prefiere_trabajar_fines_semana, 0) as prefiere_trabajar_fines_semana,
          e.disponibilidad_general,
          e.restricciones_especificas
        FROM empleados e
        WHERE e.id_servicio = ?
        ORDER BY e.nombre
      `, [serviceId]) as any;
      
      // Obtener turnos fijos para todos los empleados del servicio
      const [turnosFijos] = await connection.execute(`
        SELECT 
          tf.id_empleado,
          tf.dia_semana,
          tf.tipo_turno
        FROM turnos_fijos tf
        INNER JOIN empleados e ON tf.id_empleado = e.id_empleado
        WHERE e.id_servicio = ?
        ORDER BY tf.id_empleado, tf.dia_semana
      `, [serviceId]) as any;
      
      // Obtener asignaciones activas para el período específico
      const startOfMonth = `${year}-${month.padStart(2, '0')}-01`;
      const endOfMonth = `${year}-${month.padStart(2, '0')}-31`;
      
      const [asignaciones] = await connection.execute(`
        SELECT 
          a.id_empleado,
          a.id_tipo_asignacion,
          ta.nombre_tipo as tipo_asignacion,
          a.fecha_inicio,
          a.fecha_fin,
          a.descripcion
        FROM asignaciones_empleado a
        INNER JOIN empleados e ON a.id_empleado = e.id_empleado
        INNER JOIN tipos_asignacion ta ON a.id_tipo_asignacion = ta.id_tipo_asignacion
        WHERE e.id_servicio = ? 
          AND (
            (a.fecha_inicio <= ? AND a.fecha_fin >= ?) OR
            (a.fecha_inicio >= ? AND a.fecha_inicio <= ?)
          )
        ORDER BY a.id_empleado, a.fecha_inicio
      `, [serviceId, endOfMonth, startOfMonth, startOfMonth, endOfMonth]) as any;
      
      // Obtener preferencias adicionales de la tabla empleadopreferencias (si existe)
      let preferenciasAdicionales = [];
      
      try {
        const [result] = await connection.execute(`
          SELECT 
            ep.employeeId as id_empleado,
            ep.eligibleForDayOffAfterDuty as elegible_franco_pos_guardia_adicional,
            ep.prefersWeekendWork as prefiere_trabajar_fines_semana_adicional,
            ep.fixedWeeklyShiftTiming,
            ep.workPattern
          FROM empleadopreferencias ep
          INNER JOIN empleados e ON ep.employeeId = e.id_empleado
          WHERE e.id_servicio = ?
          ORDER BY ep.employeeId
        `, [serviceId]) as any;
        
        preferenciasAdicionales = result;
      } catch (tableError: any) {
        console.log('⚠️ [PREFERENCES API] Tabla empleadopreferencias no accesible:', tableError.message);
        preferenciasAdicionales = [];
      }

      // Organizar los datos combinando empleados con sus preferencias y datos adicionales
      const employeesWithPreferences = employees.map((emp: RawEmployee) => {
        const preferenciaAdicional = preferenciasAdicionales.find((p: RawAdditionalPreference) => p.employeeId === emp.id_empleado);
        
        return {
          id_empleado: emp.id_empleado,
          nombre: emp.nombre,
          email_empleado: emp.email_empleado,
          trabaja_feriados: Boolean(emp.trabaja_feriados),
          // Usar preferencias de la tabla empleados como principal, empleadopreferencias como override
          elegible_franco_pos_guardia: preferenciaAdicional?.elegible_franco_pos_guardia_adicional ?? Boolean(emp.elegible_franco_pos_guardia),
          prefiere_trabajar_fines_semana: preferenciaAdicional?.prefiere_trabajar_fines_semana_adicional ?? Boolean(emp.prefiere_trabajar_fines_semana),
          disponibilidad_general: emp.disponibilidad_general || 'disponible',
          restricciones_especificas: emp.restricciones_especificas || '',
          fixedWeeklyShiftTiming: preferenciaAdicional?.fixedWeeklyShiftTiming || null,
          workPattern: preferenciaAdicional?.workPattern || null,
          mes: parseInt(month),
          anio: parseInt(year),
          turnos_fijos: turnosFijos.filter((tf: RawTurnoFijo) => tf.id_empleado === emp.id_empleado),
          asignaciones: asignaciones.filter((a: RawAsignacion) => a.id_empleado === emp.id_empleado)
        };
      });

      return NextResponse.json(employeesWithPreferences);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ [PREFERENCES API] Error fetching employee preferences:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}