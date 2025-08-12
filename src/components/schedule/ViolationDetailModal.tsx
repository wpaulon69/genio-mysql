"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CircleAlert, CircleHelp, Info, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleViolation, AIShift } from '@/lib/types';

interface ViolationDetailModalProps {
  violation: ScheduleViolation;
  children: React.ReactNode;
  serviceId: number;
  currentMonth: string;
  currentYear: string;
}

interface PreviousMonthContext {
  shifts: AIShift[];
  scheduleName: string;
  loading: boolean;
  error: string | null;
}

export default function ViolationDetailModal({ 
  violation, 
  children, 
  serviceId, 
  currentMonth, 
  currentYear 
}: ViolationDetailModalProps) {
  const [previousContext, setPreviousContext] = useState<PreviousMonthContext>({
    shifts: [],
    scheduleName: '',
    loading: false,
    error: null
  });

  const fetchPreviousMonthContext = async () => {
    if (!violation.employeeName) return;

    setPreviousContext(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Calcular mes anterior
      const currentMonthInt = parseInt(currentMonth);
      const currentYearInt = parseInt(currentYear);
      
      let prevMonth = currentMonthInt - 1;
      let prevYear = currentYearInt;
      
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYearInt - 1;
      }

      const response = await fetch(`/api/monthlySchedules?year=${prevYear}&month=${prevMonth}&serviceId=${serviceId}&status=published`);
      
      if (response.ok) {
        const schedules = await response.json();
        if (schedules.length > 0) {
          const schedule = schedules[0];
          const employeeShifts = schedule.shifts.filter((shift: AIShift) => 
            shift.employeeName === violation.employeeName
          );

          // Obtener últimos 10 días del mes anterior para contexto
          const lastDays = employeeShifts
            .sort((a: AIShift, b: AIShift) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-10);

          setPreviousContext({
            shifts: lastDays,
            scheduleName: schedule.horario_nombre || 'Horario anterior',
            loading: false,
            error: null
          });
        } else {
          setPreviousContext(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'No se encontró horario del mes anterior' 
          }));
        }
      } else {
        setPreviousContext(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error al obtener horario anterior' 
        }));
      }
    } catch (error) {
      setPreviousContext(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error de conexión' 
      }));
    }
  };

  const getShiftTypeDisplay = (shift: AIShift) => {
    if (shift.notes?.includes('Descanso') || shift.notes?.includes('D (')) {
      return { type: 'Descanso', color: 'bg-gray-100 text-gray-700' };
    } else if (shift.notes?.includes('Mañana') || shift.startTime?.includes('07:00')) {
      return { type: 'Mañana', color: 'bg-blue-100 text-blue-700' };
    } else if (shift.notes?.includes('Tarde') || shift.startTime?.includes('14:00')) {
      return { type: 'Tarde', color: 'bg-orange-100 text-orange-700' };
    } else if (shift.notes?.includes('Noche') || shift.startTime?.includes('21:00')) {
      return { type: 'Noche', color: 'bg-purple-100 text-purple-700' };
    } else {
      return { type: shift.notes || 'Sin especificar', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'error' 
      ? <CircleAlert className="h-5 w-5 text-destructive" />
      : <CircleHelp className="h-5 w-5 text-yellow-600" />;
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'error'
      ? 'border-destructive/60 bg-destructive/10'
      : 'border-yellow-500/60 bg-yellow-500/10';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div onClick={fetchPreviousMonthContext} className="cursor-pointer">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon(violation.severity)}
            Detalle de Incidencia: {violation.rule}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Información principal de la incidencia */}
            <Card className={cn("border-2", getSeverityColor(violation.severity))}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Información de la Incidencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Empleado:</span>
                    <span>{violation.employeeName || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fecha:</span>
                    <span>{violation.date || 'Todo el mes'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Turno:</span>
                    <span>{violation.shiftType || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Categoría:</span>
                    <Badge className={cn(
                      violation.category === 'serviceRule'
                        ? "bg-blue-600 text-white"
                        : "bg-green-600 text-white"
                    )}>
                      {violation.category === 'serviceRule' ? 'Regla Servicio' : 'Bienestar Personal'}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Descripción del problema:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {violation.details}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contexto del mes anterior */}
            {violation.employeeName && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Contexto del Mes Anterior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {previousContext.loading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cargando información del mes anterior...
                    </div>
                  )}
                  
                  {previousContext.error && (
                    <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md">
                      <Info className="h-4 w-4" />
                      {previousContext.error}
                    </div>
                  )}
                  
                  {!previousContext.loading && !previousContext.error && previousContext.shifts.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        Últimos 10 días de {violation.employeeName} en: {previousContext.scheduleName}
                      </div>
                      
                      <div className="grid gap-2">
                        {previousContext.shifts.map((shift, index) => {
                          const shiftDisplay = getShiftTypeDisplay(shift);
                          return (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono">
                                  {new Date(shift.date).toLocaleDateString('es-ES', { 
                                    weekday: 'short', 
                                    day: '2-digit', 
                                    month: '2-digit' 
                                  })}
                                </span>
                                <Badge className={cn("text-xs", shiftDisplay.color)}>
                                  {shiftDisplay.type}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {shift.startTime && shift.endTime ? `${shift.startTime}-${shift.endTime}` : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
                        💡 <strong>Tip:</strong> Esta información del mes anterior ayuda a entender la continuidad 
                        de turnos y descansos que puede estar causando la incidencia actual.
                      </div>
                    </div>
                  )}
                  
                  {!previousContext.loading && !previousContext.error && previousContext.shifts.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No se encontraron turnos del mes anterior para este empleado.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sugerencias de resolución */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <Info className="h-5 w-5" />
                  Sugerencias de Resolución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {violation.rule.includes('Exceso Días Descanso') && (
                    <>
                      <p>• Revisar si la configuración de días máximos de descanso es realista para el servicio</p>
                      <p>• Considerar ajustar los turnos fijos del empleado si es necesario</p>
                      <p>• Verificar que no haya conflictos con licencias o asignaciones especiales</p>
                    </>
                  )}
                  {violation.rule.includes('Dotación') && (
                    <>
                      <p>• Verificar que hay suficientes empleados disponibles para cubrir la dotación</p>
                      <p>• Revisar las preferencias y restricciones de los empleados</p>
                      <p>• Considerar ajustar la dotación objetivo si es muy alta</p>
                    </>
                  )}
                  {violation.rule.includes('Consecutivos') && (
                    <>
                      <p>• Revisar la configuración de días consecutivos máximos</p>
                      <p>• Verificar que los turnos fijos no generen patrones problemáticos</p>
                      <p>• Considerar distribuir mejor la carga de trabajo</p>
                    </>
                  )}
                  <p className="text-muted-foreground italic">
                    💡 Puedes editar manualmente el horario en la grilla para resolver esta incidencia.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}