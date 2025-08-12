'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User, Mail, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const employeeSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email_empleado: z.string().email('Email inválido'),
  trabaja_feriados: z.boolean(),
  elegible_franco_pos_guardia: z.boolean(),
  prefiere_trabajar_fines_semana: z.boolean(),
  disponibilidad_general: z.string().optional(),
  restricciones_especificas: z.string().optional()
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Employee {
  id_empleado: number;
  nombre: string;
  email_empleado: string;
  trabaja_feriados: boolean;
  elegible_franco_pos_guardia: boolean;
  prefiere_trabajar_fines_semana: boolean;
  disponibilidad_general: string;
  restricciones_especificas: string;
}

interface EmployeeEditFormProps {
  employee: Employee;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EmployeeEditForm({ employee, onSuccess, onCancel }: EmployeeEditFormProps) {
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nombre: employee.nombre || '',
      email_empleado: employee.email_empleado || '',
      trabaja_feriados: employee.trabaja_feriados || false,
      elegible_franco_pos_guardia: employee.elegible_franco_pos_guardia || false,
      prefiere_trabajar_fines_semana: employee.prefiere_trabajar_fines_semana || false,
      disponibilidad_general: employee.disponibilidad_general || '',
      restricciones_especificas: employee.restricciones_especificas || ''
    }
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await fetch(`/api/service-management/employees/${employee.id_empleado}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating employee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Empleado actualizado',
        description: 'La información del empleado ha sido actualizada exitosamente.'
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar empleado'
      });
    }
  });

  const onSubmit = (data: EmployeeFormData) => {
    updateEmployeeMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <User className="mr-2 h-4 w-4" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email_empleado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@hospital.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Settings className="mr-2 h-4 w-4" />
              Preferencias de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="trabaja_feriados"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Trabaja Feriados</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Disponible para trabajar en días feriados
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prefiere_trabajar_fines_semana"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Prefiere Fines de Semana</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Prefiere trabajar sábados y domingos
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="elegible_franco_pos_guardia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Franco Post-Guardia</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Elegible para franco después de guardia
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="disponibilidad_general"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad General</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: Disponible mañanas y tardes, no noches..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restricciones_especificas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restricciones Específicas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: No puede trabajar martes por estudios..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateEmployeeMutation.isPending}>
            {updateEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar Empleado
          </Button>
        </div>
      </form>
    </Form>
  );
}