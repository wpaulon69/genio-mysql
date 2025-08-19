'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  roleId: z.string().min(1, 'Debe seleccionar un rol'),
  serviceId: z.string().optional(),
  employeeId: z.string().optional(),
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean().default(true)
});

type UserFormData = z.infer<typeof userSchema>;

interface SimpleUserFormProps {
  user?: any;
  onSuccess: () => void;
}

export default function SimpleUserForm({ user, onSuccess }: SimpleUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const isEditing = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      roleId: user?.role?.id || '',
      serviceId: user?.serviceId?.toString() || '',
      employeeId: user?.employeeId?.toString() || '',
      isActive: user?.isActive ?? true,
      mustChangePassword: user?.mustChangePassword ?? true
    }
  });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) throw new Error('Error fetching roles');
      return response.json();
    }
  });

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Error fetching services');
      return response.json();
    }
  });

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Error fetching employees');
      return response.json();
    }
  });

  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const url = isEditing ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          serviceId: data.serviceId ? parseInt(data.serviceId) : null,
          employeeId: data.employeeId ? parseInt(data.employeeId) : null
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error saving user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? 'Usuario actualizado' : 'Usuario creado',
        description: `El usuario ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al guardar usuario'
      });
    }
  });

  const onSubmit = (data: UserFormData) => {
    // Validación personalizada para contraseña
    if (!isEditing && (!data.password || data.password.trim() === '')) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'La contraseña es requerida para crear un nuevo usuario'
      });
      return;
    }

    if (!isEditing && data.password && data.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    // Si estamos editando y no se proporcionó contraseña, no la incluimos
    if (isEditing && (!data.password || data.password.trim() === '')) {
      const { password, ...dataWithoutPassword } = data;
      userMutation.mutate(dataWithoutPassword as UserFormData);
    } else {
      userMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isEditing ? 'Dejar vacío para mantener actual' : 'Contraseña segura'}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol del Usuario</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="super_admin">🔧 Super Administrador - Acceso total al sistema</option>
                    <option value="admin_hospital">🏥 Admin Hospital - Gestión de todo el hospital</option>
                    <option value="jefe_servicio">👨‍⚕️ Jefe de Servicio - Gestión de UN servicio específico</option>
                    
                    <option value="empleado">👤 Empleado - Acceso básico personal</option>
                  </select>
                </FormControl>
                <div className="text-xs text-muted-foreground mt-1">
                  <strong>Jefe de Servicio:</strong> Gestiona solo empleados de su servicio asignado (ej: solo mucamas o solo cocina)
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servicio (Opcional)</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Sin servicio asignado</option>
                    {services.map((service: any) => (
                      <option key={service.id_servicio} value={service.id_servicio.toString()}>
                        {service.nombre_servicio}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empleado Vinculado (Opcional)</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Sin empleado vinculado</option>
                  {employees.map((employee: any) => (
                    <option key={employee.id_empleado} value={employee.id_empleado.toString()}>
                      {employee.nombre}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Usuario Activo</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mustChangePassword"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Debe cambiar contraseña</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={userMutation.isPending}>
            {userMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Form>
  );
}