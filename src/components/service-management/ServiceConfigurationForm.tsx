"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// 1. FIX: Use coerce.boolean() for the checkbox to handle 0/1 from DB.
//    Remove the complex .refine() as the form logic handles conditional fields.
const serviceConfigSchema = z.object({
  nombre_servicio: z.string().min(1, "El nombre del servicio es obligatorio"),
  descripcion: z.string().optional(),
  habilitar_turno_noche: z.coerce.boolean(),
  dotacion_objetivo_lunes_a_viernes_mananas: z.coerce.number().int().min(0),
  dotacion_objetivo_lunes_a_viernes_tardes: z.coerce.number().int().min(0),
  dotacion_objetivo_lunes_a_viernes_noche: z.coerce.number().int().min(0).optional(),
  dotacion_objetivo_sab_dom_feriados_mananas: z.coerce.number().int().min(0),
  dotacion_objetivo_sab_dom_feriados_tardes: z.coerce.number().int().min(0),
  dotacion_objetivo_sab_dom_feriados_noche: z.coerce.number().int().min(0).optional(),
  max_dias_trabajo_consecutivos: z.coerce.number().int().min(1).max(14),
  dias_trabajo_consecutivos_preferidos: z.coerce.number().int().min(1).max(14),
  max_descansos_consecutivos: z.coerce.number().int().min(1).max(14),
  dias_descanso_consecutivos_preferidos: z.coerce.number().int().min(1).max(14),
  min_descansos_requeridos_antes_de_trabajar: z.coerce.number().int().min(0).max(7),
  fds_descanso_completo_objetivo: z.coerce.number().int().min(0).max(5),
  notas_adicionales: z.string().nullable().optional(),
});

type ServiceConfigFormData = z.infer<typeof serviceConfigSchema>;

interface ServiceConfigurationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (service: Service) => void;
  service?: Service | null;
  isLoading?: boolean;
}

export default function ServiceConfigurationForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  service, 
  isLoading 
}: ServiceConfigurationFormProps) {
  const { toast } = useToast();

  const form = useForm<ServiceConfigFormData>({
    resolver: zodResolver(serviceConfigSchema),
    defaultValues: {
      nombre_servicio: '',
      descripcion: '',
      habilitar_turno_noche: false,
      dotacion_objetivo_lunes_a_viernes_mananas: 0,
      dotacion_objetivo_lunes_a_viernes_tardes: 0,
      dotacion_objetivo_lunes_a_viernes_noche: 0,
      dotacion_objetivo_sab_dom_feriados_mananas: 0,
      dotacion_objetivo_sab_dom_feriados_tardes: 0,
      dotacion_objetivo_sab_dom_feriados_noche: 0,
      max_dias_trabajo_consecutivos: 6,
      dias_trabajo_consecutivos_preferidos: 5,
      max_descansos_consecutivos: 3,
      dias_descanso_consecutivos_preferidos: 2,
      min_descansos_requeridos_antes_de_trabajar: 1,
      fds_descanso_completo_objetivo: 1,
      notas_adicionales: '',
    },
  });

  const enableNightShiftValue = form.watch('habilitar_turno_noche');

  useEffect(() => {
    if (isOpen) {
      if (service) {
        // 2. FIX: Robustly reset the form by merging service data with defaults.
        // This prevents data loss if the service object has nullish values that should override defaults.
        const defaultValues = form.formState.defaultValues;
        const mergedValues = { ...defaultValues, ...service };
        // Explicitly convert nulls to empty strings for Textarea fields
        if (mergedValues.descripcion === null) {
          mergedValues.descripcion = '';
        }
        if (mergedValues.notas_adicionales === null) {
          mergedValues.notas_adicionales = '';
        }
        // Filter mergedValues to only include properties defined in ServiceConfigFormData
        const formValues: ServiceConfigFormData = {
          nombre_servicio: mergedValues.nombre_servicio,
          descripcion: mergedValues.descripcion,
          habilitar_turno_noche: mergedValues.habilitar_turno_noche,
          dotacion_objetivo_lunes_a_viernes_mananas: mergedValues.dotacion_objetivo_lunes_a_viernes_mananas,
          dotacion_objetivo_lunes_a_viernes_tardes: mergedValues.dotacion_objetivo_lunes_a_viernes_tardes,
          dotacion_objetivo_lunes_a_viernes_noche: mergedValues.dotacion_objetivo_lunes_a_viernes_noche,
          dotacion_objetivo_sab_dom_feriados_mananas: mergedValues.dotacion_objetivo_sab_dom_feriados_mananas,
          dotacion_objetivo_sab_dom_feriados_tardes: mergedValues.dotacion_objetivo_sab_dom_feriados_tardes,
          dotacion_objetivo_sab_dom_feriados_noche: mergedValues.dotacion_objetivo_sab_dom_feriados_noche,
          max_dias_trabajo_consecutivos: mergedValues.max_dias_trabajo_consecutivos,
          dias_trabajo_consecutivos_preferidos: mergedValues.dias_trabajo_consecutivos_preferidos,
          max_descansos_consecutivos: mergedValues.max_descansos_consecutivos,
          dias_descanso_consecutivos_preferidos: mergedValues.dias_descanso_consecutivos_preferidos,
          min_descansos_requeridos_antes_de_trabajar: mergedValues.min_descansos_requeridos_antes_de_trabajar,
          fds_descanso_completo_objetivo: mergedValues.fds_descanso_completo_objetivo,
          notas_adicionales: mergedValues.notas_adicionales,
        };
        form.reset(formValues);
      } else {
        // Reset to defaults for a new service
        form.reset(form.formState.defaultValues);
      }
    }
  }, [service, isOpen, form]);

  const handleFormSubmit = (data: ServiceConfigFormData) => {
    // 3. FIX: Ensure all original service data is preserved, only updating changed fields.
    // This prevents fields not present in the form from being wiped out.
    const submissionData = { ...service, ...data };

    if (!submissionData.habilitar_turno_noche) {
      submissionData.dotacion_objetivo_lunes_a_viernes_noche = 0;
      submissionData.dotacion_objetivo_sab_dom_feriados_noche = 0;
    }
    
    onSubmit(submissionData as Service);
  };

  const onFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Error de Validación",
      description: "Por favor, revise los campos del formulario. Hay errores de validación.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{service ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</DialogTitle>
          <DialogDescription>
            Ajusta las configuraciones, dotaciones objetivo y reglas de trabajo de tu servicio.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit, onFormError)} className="flex flex-col flex-grow min-h-0">
            <div className="flex-grow overflow-y-auto max-h-[70vh] p-4 space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="nombre_servicio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Servicio</FormLabel>
                        <FormControl>
                          <Input placeholder="ej., Sala de Emergencias" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="habilitar_turno_noche" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">Habilitar Turno Noche (N)</FormLabel>
                        </div>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="descripcion" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describa brevemente el servicio"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Separator />

                {/* Dotación objetivo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dotación Objetivo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 p-4 border rounded-md">
                      <h4 className="font-semibold">Lunes a Viernes</h4>
                      <FormField control={form.control} name="dotacion_objetivo_lunes_a_viernes_mananas" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mañanas (L-V)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="dotacion_objetivo_lunes_a_viernes_tardes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tardes (L-V)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {enableNightShiftValue && (
                        <FormField control={form.control} name="dotacion_objetivo_lunes_a_viernes_noche" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Noches (L-V)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>
                    <div className="space-y-3 p-4 border rounded-md">
                      <h4 className="font-semibold">Sábados, Domingos y Feriados</h4>
                      <FormField control={form.control} name="dotacion_objetivo_sab_dom_feriados_mananas" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mañanas (S,D,F)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="dotacion_objetivo_sab_dom_feriados_tardes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tardes (S,D,F)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {enableNightShiftValue && (
                        <FormField control={form.control} name="dotacion_objetivo_sab_dom_feriados_noche" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Noches (S,D,F)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Reglas de planificación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reglas de Planificación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="max_dias_trabajo_consecutivos" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máx. Días Consecutivos</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="14" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dias_trabajo_consecutivos_preferidos" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días Consecutivos Preferidos</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="14" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="max_descansos_consecutivos" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máx. Descansos Consecutivos</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="14" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dias_descanso_consecutivos_preferidos" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descansos Consecutivos Preferidos</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="14" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="min_descansos_requeridos_antes_de_trabajar" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mín. Descansos Previos</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fds_descanso_completo_objetivo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>FDS Libres Objetivo</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <Separator />
                <FormField control={form.control} name="notas_adicionales" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Agregue cualquier información adicional..."
                        rows={3}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t bg-background">
              <div className="flex justify-between w-full">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}