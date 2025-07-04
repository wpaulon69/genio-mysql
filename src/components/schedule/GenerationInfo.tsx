import type { Service, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Sun, Sunset, ListChecks, CalendarDays, Clock, Coffee, ShieldCheck } from 'lucide-react';
import type { ScheduleRulesConfig } from '@/lib/scheduler/config';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GenerationInfoProps {
  service: Service;
  employees: Employee[];
  rulesConfig: ScheduleRulesConfig;
}

export default function GenerationInfo({ service, employees, rulesConfig }: GenerationInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Generación</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
        
        {/* Columna 1: Info General y Dotación */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold flex items-center mb-2"><Briefcase className="mr-2 h-5 w-5 text-primary" />Servicio</h3>
            <p className="text-sm text-muted-foreground">{service.nombre_servicio}</p>
          </div>
          <div>
            <h3 className="font-semibold flex items-center mb-2"><Sun className="mr-2 h-5 w-5 text-primary" />Dotación (Día de Semana)</h3>
            <div className="flex space-x-4 text-sm">
              <span>Mañana: <Badge variant="secondary">{service.dotacion_objetivo_lunes_a_viernes_mananas}</Badge></span>
              <span>Tarde: <Badge variant="secondary">{service.dotacion_objetivo_lunes_a_viernes_tardes}</Badge></span>
              {service.habilitar_turno_noche && <span>Noche: <Badge variant="secondary">{service.dotacion_objetivo_lunes_a_viernes_noche}</Badge></span>}
            </div>
          </div>
          <div>
            <h3 className="font-semibold flex items-center mb-2"><Sunset className="mr-2 h-5 w-5 text-primary" />Dotación (Fin de Semana/Feriado)</h3>
            <div className="flex space-x-4 text-sm">
              <span>Mañana: <Badge variant="secondary">{service.dotacion_objetivo_sab_dom_feriados_mananas}</Badge></span>
              <span>Tarde: <Badge variant="secondary">{service.dotacion_objetivo_sab_dom_feriados_tardes}</Badge></span>
              {service.habilitar_turno_noche && <span>Noche: <Badge variant="secondary">{service.dotacion_objetivo_sab_dom_feriados_noche}</Badge></span>}
            </div>
          </div>
        </div>

        {/* Columna 2: Reglas del Algoritmo */}
        <div className="space-y-2">
            <h3 className="font-semibold flex items-center mb-3"><ShieldCheck className="mr-2 h-5 w-5 text-primary" />Reglas del Algoritmo</h3>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Máx. días de trabajo seguidos:</span>
                <Badge>{rulesConfig.maxConsecutiveWorkDays}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center"><Coffee className="mr-2 h-4 w-4 text-muted-foreground" />Máx. días de descanso seguidos:</span>
                <Badge>{rulesConfig.maxConsecutiveDaysOff}</Badge>
            </div>
             <div className="flex items-center justify-between text-sm">
                <span className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" />Descanso mínimo entre turnos:</span>
                <Badge>{rulesConfig.minimumRestHoursBetweenShifts} hs</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />FDS de descanso completos (objetivo):</span>
                <Badge>{service.fds_descanso_completo_objetivo ?? rulesConfig.defaultTargetCompleteWeekendsOff}</Badge>
            </div>
        </div>

        {/* Columna 3: Empleados */}
        <div>
          <h3 className="font-semibold flex items-center mb-2"><Users className="mr-2 h-5 w-5 text-primary" />Empleados Asignados ({employees.length})</h3>
          <ScrollArea className="h-40">
            <ul className="list-disc pl-5 text-sm space-y-1">
              {employees.map(e => <li key={e.id_empleado}>{e.nombre}</li>)}
            </ul>
          </ScrollArea>
        </div>

      </CardContent>
    </Card>
  );
}
