"use client";

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AIShift, Employee, Service, Holiday, MonthlySchedule, ScoreBreakdown, ScheduleViolation } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createServiceSpecificRulesConfig } from '@/lib/scheduler/config';
import { useToast } from '@/hooks/use-toast';
import InteractiveScheduleGrid from '@/components/schedule/InteractiveScheduleGrid';
import { generateAlgorithmicSchedule } from '@/lib/scheduler';
import EmployeePreferencesDisplay from './EmployeePreferencesDisplay';

const scheduleGenerationSchema = z.object({
  month: z.string().min(1, "Debe seleccionar un mes."),
  year: z.string().min(1, "Debe seleccionar un año."),
});

type ScheduleGenerationFormData = z.infer<typeof scheduleGenerationSchema>;

interface ServiceScheduleGeneratorProps {
  service: Service;
  employees: Employee[];
  holidays: Holiday[];
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
const months = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: format(new Date(currentYear, i), 'MMMM', { locale: es }),
}));

export default function ServiceScheduleGenerator({ service, employees, holidays }: ServiceScheduleGeneratorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<AIShift[] | null>(null);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    violations: ScheduleViolation[];
    scoreBreakdown: ScoreBreakdown;
    responseText: string;
  } | null>(null);

  const saveScheduleMutation = useMutation({
    mutationFn: async (scheduleData: Partial<MonthlySchedule>) => {
      const response = await fetch('/api/monthlySchedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-schedules'] }); // @ts-ignore
      toast({ title: "Horario Guardado", description: "El horario ha sido guardado exitosamente." });
      setShowGrid(false);
      setGeneratedShifts(null);
      setEvaluation(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: `No se pudo guardar el horario: ${err.message}` });
    },
  });

  const form = useForm<ScheduleGenerationFormData>({
    resolver: zodResolver(scheduleGenerationSchema),
    defaultValues: {
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
    },
  });

  const handleGenerateSubmit = async (data: ScheduleGenerationFormData) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedShifts(null);
    setEvaluation(null);
    setShowGrid(false);

    try {
      // Obtener horario del mes anterior para continuidad
      let previousMonthShifts = null;
      const currentMonth = parseInt(data.month);
      const currentYear = parseInt(data.year);
      
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }

      try {
        const prevMonthResponse = await fetch(`/api/monthlySchedules?year=${prevYear}&month=${prevMonth}&serviceId=${service.id_servicio}&status=published`);
        if (prevMonthResponse.ok) {
          const prevSchedules = await prevMonthResponse.json();
          if (prevSchedules.length > 0) {
            // Buscar el horario publicado más reciente
            const publishedSchedule = prevSchedules.find(s => s.status === 'published') || prevSchedules[0];
            previousMonthShifts = publishedSchedule.shifts;
          }
        }
      } catch (prevError) {
        console.warn('⚠️ No se pudo obtener el horario del mes anterior:', prevError);
      }

      const result = await generateAlgorithmicSchedule(
        service,
        data.month,
        data.year,
        employees,
        holidays,
        previousMonthShifts,
        createServiceSpecificRulesConfig(service)
      );
      
      setGeneratedShifts(result.generatedShifts);
      setEvaluation({
        score: result.score,
        violations: result.violations,
        scoreBreakdown: result.scoreBreakdown,
        responseText: result.responseText,
      });
      
      setShowGrid(true);
      toast({ 
        title: "Generación Completa", 
        description: `Horario generado con una puntuación de ${result.score.toFixed(0)}/100.` 
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error desconocido en la generación.";
      setError(message);
      toast({ 
        variant: "destructive", 
        title: "Error de Generación", 
        description: message 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = (shifts: AIShift[], status: 'published' | 'draft') => {
    const scheduleNameFromPrompt = prompt(
      "Por favor, ingrese un nombre para este horario:", 
      `Horario ${service.nombre_servicio} - ${months.find(m => m.value === form.getValues('month'))?.label} ${form.getValues('year')}`
    );

    if (!scheduleNameFromPrompt) {
      toast({
        variant: "default",
        title: "Guardado cancelado",
        description: "No se ingresó un nombre para el horario.",
      });
      return;
    }

    const now = Date.now();
    const scheduleData: Partial<MonthlySchedule> = {
      scheduleKey: `${service.id_servicio}-${form.getValues('year')}-${form.getValues('month')}-${status}-${Date.now()}`,
      year: form.getValues('year'),
      month: form.getValues('month'),
      serviceId: service.id_servicio.toString(),
      serviceName: service.nombre_servicio,
      horario_nombre: scheduleNameFromPrompt,
      status,
      shifts,
      version: 1,
      createdAt: now,
      updatedAt: now,
      score: evaluation?.score ?? null,
      violations: evaluation?.violations ?? [],
      scoreBreakdown: evaluation?.scoreBreakdown ?? null,
      responseText: evaluation?.responseText ?? null,
    };
    
    saveScheduleMutation.mutate(scheduleData);
  };

  const handleShiftsChange = (newShifts: AIShift[]) => {
    setGeneratedShifts(newShifts);
  };

  if (showGrid && generatedShifts) {
    return (
      <InteractiveScheduleGrid
        initialShifts={generatedShifts}
        initialScheduleName={`Horario ${service.nombre_servicio} - ${months.find(m => m.value === form.getValues('month'))?.label} ${form.getValues('year')}`}
        allEmployees={employees}
        targetService={service}
        month={form.getValues('month')}
        year={form.getValues('year')}
        holidays={holidays}
        onBackToConfig={() => setShowGrid(false)}
        onSave={handleSave}
        onShiftsChange={handleShiftsChange}
        isSaving={saveScheduleMutation.isPending}
      />
    );
  }

  const selectedMonth = form.watch('month');
  const selectedYear = form.watch('year');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="mr-3 h-6 w-6 text-primary"/>
            Generar Nuevo Horario
          </CardTitle>
          <CardDescription>
            Genera automáticamente un horario optimizado para {service.nombre_servicio} usando inteligencia artificial.
          </CardDescription>
        </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerateSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar mes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mostrar preferencias solo cuando mes y año estén seleccionados */}
            {selectedMonth && selectedYear && (
              <EmployeePreferencesDisplay month={selectedMonth} year={selectedYear} />
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error de Generación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Información del Servicio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <p><strong>Servicio:</strong> {service.nombre_servicio}</p>
                  <p><strong>Empleados:</strong> {employees.length}</p>
                </div>
                <div>
                  <p><strong>Turno noche habilitado:</strong> {service.habilitar_turno_noche ? 'Sí' : 'No'}</p>
                  <p><strong>Descripción:</strong> {service.descripcion || 'No definida'}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">Dotación Objetivo</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <p className="font-medium mb-1">Lunes a Viernes:</p>
                    <p>• Mañana: {service.dotacion_objetivo_lunes_a_viernes_mananas || 0}</p>
                    <p>• Tarde: {service.dotacion_objetivo_lunes_a_viernes_tardes || 0}</p>
                    {service.habilitar_turno_noche && (
                      <p>• Noche: {service.dotacion_objetivo_lunes_a_viernes_noche || 0}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium mb-1">Fines de Semana y Feriados:</p>
                    <p>• Mañana: {service.dotacion_objetivo_sab_dom_feriados_mananas || 0}</p>
                    <p>• Tarde: {service.dotacion_objetivo_sab_dom_feriados_tardes || 0}</p>
                    {service.habilitar_turno_noche && (
                      <p>• Noche: {service.dotacion_objetivo_sab_dom_feriados_noche || 0}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isGenerating}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando Horario...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar Horario
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}