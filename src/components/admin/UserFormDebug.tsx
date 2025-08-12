'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  roleId: z.string().min(1, 'Debe seleccionar un rol'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDebugProps {
  onSuccess: () => void;
}

export default function UserFormDebug({ onSuccess }: UserFormDebugProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
    }
  });

  // Fetch roles con manejo de errores mejorado
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      console.log('🔍 Fetching roles...');
      const response = await fetch('/api/admin/roles');
      console.log('📡 Roles response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Roles error:', errorText);
        throw new Error(`Error fetching roles: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Roles data:', data);
      return data;
    }
  });

  const onSubmit = (data: UserFormData) => {
    console.log('📝 Form submitted:', data);
  };

  console.log('🔄 Component render - Roles:', roles, 'Loading:', rolesLoading, 'Error:', rolesError);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug User Form</h3>
      
      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
        <p>Roles loading: {rolesLoading ? 'Yes' : 'No'}</p>
        <p>Roles count: {roles.length}</p>
        <p>Roles error: {rolesError ? rolesError.message : 'None'}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
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
            name="email"
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

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rolesLoading ? (
                      <SelectItem value="loading" disabled>
                        Cargando roles...
                      </SelectItem>
                    ) : rolesError ? (
                      <SelectItem value="error" disabled>
                        Error cargando roles
                      </SelectItem>
                    ) : roles.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No hay roles disponibles
                      </SelectItem>
                    ) : (
                      roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName} (Nivel {role.level})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Usuario (Debug)
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}