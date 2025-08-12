'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const roleSchema = z.object({
  name: z.string().min(1, 'El nombre interno es requerido').regex(/^[a-z_]+$/, 'Solo letras minúsculas y guiones bajos'),
  displayName: z.string().min(1, 'El nombre para mostrar es requerido'),
  level: z.number().min(1, 'El nivel debe ser mayor a 0').max(10, 'El nivel debe ser menor a 11'),
  description: z.string().min(1, 'La descripción es requerida'),
  permissions: z.array(z.string()).min(1, 'Debe seleccionar al menos un permiso')
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role?: any;
  onSuccess: () => void;
}

export default function RoleForm({ role, onSuccess }: RoleFormProps) {
  const { toast } = useToast();
  const isEditing = !!role;

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      displayName: role?.displayName || '',
      level: role?.level || 1,
      description: role?.description || '',
      permissions: role?.permissions || []
    }
  });

  // Fetch available permissions
  const { data: availablePermissions = [] } = useQuery({
    queryKey: ['available-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) throw new Error('Error fetching permissions');
      return response.json();
    }
  });

  // Create/Update role mutation
  const roleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const url = isEditing ? `/api/admin/roles/${role.id}` : '/api/admin/roles';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error saving role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? 'Rol actualizado' : 'Rol creado',
        description: `El rol ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al guardar rol'
      });
    }
  });

  const onSubmit = (data: RoleFormData) => {
    roleMutation.mutate(data);
  };

  // Group permissions by resource
  const groupedPermissions = availablePermissions.reduce((acc: any, permission: any) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

  const resourceLabels: { [key: string]: string } = {
    users: '👥 Usuarios',
    services: '🏥 Servicios',
    employees: '👨‍💼 Empleados',
    schedules: '📅 Horarios',
    shifts: '🔄 Turnos',
    reports: '📊 Reportes',
    holidays: '🎉 Feriados',
    system: '⚙️ Sistema'
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Shield className="mr-2 h-4 w-4" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nombre Interno</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin_hospital" 
                        {...field}
                        disabled={isEditing}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nombre para Mostrar</FormLabel>
                    <FormControl>
                      <Input placeholder="Administrador Hospital" {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nivel (1-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción del rol y sus responsabilidades..."
                      rows={2}
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Permisos del Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([resource, permissions]: [string, any]) => (
                      <div key={resource} className="border rounded-md p-3">
                        <h4 className="font-medium mb-2 text-sm">
                          {resourceLabels[resource] || resource.toUpperCase()}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                          {permissions.map((permission: any) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={field.value?.includes(permission.id)}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = checked
                                    ? [...(field.value || []), permission.id]
                                    : (field.value || []).filter((p: string) => p !== permission.id);
                                  field.onChange(updatedPermissions);
                                }}
                              />
                              <label
                                htmlFor={permission.id}
                                className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {permission.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onSuccess} size="sm">
            Cancelar
          </Button>
          <Button type="submit" disabled={roleMutation.isPending} size="sm">
            {roleMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {isEditing ? 'Actualizar Rol' : 'Crear Rol'}
          </Button>
        </div>
      </form>
    </Form>
  );
}