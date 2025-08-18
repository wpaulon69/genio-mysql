'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface EmployeePreference {
  id_empleado: number;
  nombre: string;
  trabaja_feriados: boolean;
  elegible_franco_pos_guardia: boolean;
  prefiere_trabajar_fines_semana: boolean;
  disponibilidad_general: string;
  restricciones_especificas: string;
  mes: number;
  anio: number;
  turnos_fijos: Array<{
    dia_semana: number;
    tipo_turno: string;
  }>;
  asignaciones: Array<{
    tipo_asignacion: string;
    fecha_inicio: string;
    fecha_fin: string;
    descripcion: string;
  }>;
}

interface EmployeePreferencesDisplayProps {
  month: string;
  year: string;
}

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function EmployeePreferencesDisplay({ month, year }: EmployeePreferencesDisplayProps) {
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['employee-preferences', month, year],
    queryFn: async () => {
      console.log('🔍 [FRONTEND] Haciendo petición a preferencias:', { month, year });
      const response = await fetch(`/api/service-management/employees/preferences?month=${month}&year=${year}`);
      
      console.log('📡 [FRONTEND] Respuesta de API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Error en API:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [FRONTEND] Datos recibidos:', data);
      return data as EmployeePreference[];
    },
    enabled: !!(month && year), // Solo ejecutar si month y year están disponibles
    retry: 1, // Solo reintentar una vez
    retryDelay: 1000 // Esperar 1 segundo antes de reintentar
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Preferencias de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando preferencias...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !preferences) {
    console.error('❌ [FRONTEND] Error en componente:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Preferencias de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-red-600">Error al cargar las preferencias de empleados</p>
            {error && (
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer">Ver detalles del error</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
            <div className="text-sm text-blue-600">
              <p>💡 Posibles soluciones:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Verificar que tienes permisos para gestionar empleados</li>
                <li>Verificar que tienes un servicio asignado</li>
                <li>Revisar los logs del servidor (F12 → Console)</li>
                <li>Contactar al administrador si el problema persiste</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estadísticas generales
  const stats = {
    trabajaFeriados: preferences.filter(p => p.trabaja_feriados).length,
    conTurnosFijos: preferences.filter(p => p.turnos_fijos && p.turnos_fijos.length > 0).length,
    conAsignaciones: preferences.filter(p => p.asignaciones && p.asignaciones.length > 0).length,
    conPreferenciasConfiguradas: preferences.filter(p => p.mes && p.anio).length
  };

  // Verificar si hay datos de preferencias reales
  const hasPreferencesData = preferences.some(p => 
    p.trabaja_feriados || 
    (p.turnos_fijos && p.turnos_fijos.length > 0) ||
    (p.asignaciones && p.asignaciones.length > 0) ||
    (p.mes && p.anio)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Preferencias de Empleados para {month}/{year} ({preferences.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPreferencesData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Información:</strong> No hay preferencias específicas configuradas para {month}/{year}. 
              Se muestran los empleados del servicio con configuración por defecto.
            </p>
          </div>
        )}

        {/* Estadísticas generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.trabajaFeriados}</div>
            <div className="text-xs text-muted-foreground">Trabajan feriados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.conTurnosFijos}</div>
            <div className="text-xs text-muted-foreground">Con turnos fijos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.conAsignaciones}</div>
            <div className="text-xs text-muted-foreground">Con asignaciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.conPreferenciasConfiguradas}</div>
            <div className="text-xs text-muted-foreground">Con preferencias del mes</div>
          </div>
        </div>

        {/* Lista detallada de empleados */}
        <div className="space-y-3">
          {preferences.map((emp) => (
            <div key={emp.id_empleado} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{emp.nombre}</h4>
                <div className="flex gap-1">
                  {emp.trabaja_feriados && (
                    <Badge variant="secondary" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />
                      Feriados
                    </Badge>
                  )}
                  {emp.turnos_fijos && emp.turnos_fijos.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Turnos fijos
                    </Badge>
                  )}
                  {emp.asignaciones && emp.asignaciones.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Asignaciones
                    </Badge>
                  )}
                </div>
              </div>

              {/* Turnos fijos */}
              {emp.turnos_fijos && emp.turnos_fijos.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Turnos fijos:</p>
                  <div className="flex flex-wrap gap-1">
                    {emp.turnos_fijos.map((turno, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {turno.dia_semana} - {turno.tipo_turno}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Asignaciones activas */}
              {emp.asignaciones && emp.asignaciones.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Asignaciones para {month}/{year}:</p>
                  <div className="space-y-1">
                    {emp.asignaciones.map((asig, idx) => (
                      <div key={idx} className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                        <span className="font-medium">{asig.tipo_asignacion}</span>
                        {asig.fecha_inicio && (
                          <span className="text-muted-foreground ml-2">
                            {new Date(asig.fecha_inicio).toLocaleDateString('es-ES')}
                            {asig.fecha_fin && ` - ${new Date(asig.fecha_fin).toLocaleDateString('es-ES')}`}
                          </span>
                        )}
                        {asig.descripcion && (
                          <div className="text-muted-foreground mt-1">{asig.descripcion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}