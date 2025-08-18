import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission, getUserPermissions } from '@/lib/auth/permissions';
import { getConnection } from '@/lib/mysql/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [PREFERENCES API] Iniciando petición...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('❌ [PREFERENCES API] No hay sesión de usuario');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('👤 [PREFERENCES API] Usuario:', {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role?.name,
      serviceId: session.user.serviceId
    });

    if (!hasPermission(session.user, 'MANAGE_SERVICE_EMPLOYEES')) {
      console.log('❌ [PREFERENCES API] Sin permisos MANAGE_SERVICE_EMPLOYEES');
      console.log('🔍 [PREFERENCES API] Permisos del usuario:', getUserPermissions(session.user));
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Verificar serviceId - puede venir de session.user.serviceId o session.user.service_id
    const serviceId = session.user.serviceId || session.user.service_id;
    if (!serviceId) {
      console.log('❌ [PREFERENCES API] Usuario sin serviceId asignado');
      return NextResponse.json({ error: 'Usuario sin servicio asignado' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    console.log('📅 [PREFERENCES API] Parámetros:', { month, year, serviceId });

    if (!month || !year) {
      console.log('❌ [PREFERENCES API] Faltan parámetros month o year');
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 });
    }
    
    const connection = await getConnection();
    
    try {
      // Obtener empleados básicos del servicio con preferencias de la tabla empleados
      console.log('🔍 Buscando empleados para serviceId:', serviceId);
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
      
      console.log('🔍 Empleados encontrados:', employees.length);

      // Obtener turnos fijos para todos los empleados del servicio
      console.log('🔍 Buscando turnos fijos...');
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
      
      console.log('🔍 Turnos fijos encontrados:', turnosFijos.length);

      // Obtener asignaciones activas para el período específico
      console.log('🔍 Buscando asignaciones...');
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
      
      console.log('🔍 Asignaciones encontradas:', asignaciones.length);

      // Obtener preferencias adicionales de la tabla empleadopreferencias (si existe)
      console.log('🔍 Buscando preferencias adicionales...');
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
        console.log('🔍 Preferencias adicionales encontradas:', preferenciasAdicionales.length);
      } catch (tableError: any) {
        console.log('⚠️ [PREFERENCES API] Tabla empleadopreferencias no accesible:', tableError.message);
        preferenciasAdicionales = [];
      }

      // Organizar los datos combinando empleados con sus preferencias y datos adicionales
      const employeesWithPreferences = employees.map(emp => {
        const preferenciaAdicional = preferenciasAdicionales.find(p => p.id_empleado === emp.id_empleado);
        
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
          turnos_fijos: turnosFijos.filter(tf => tf.id_empleado === emp.id_empleado),
          asignaciones: asignaciones.filter(a => a.id_empleado === emp.id_empleado)
        };
      });

      console.log('✅ Devolviendo preferencias completas:', employeesWithPreferences.length, 'empleados');
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