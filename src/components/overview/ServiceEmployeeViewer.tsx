
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Service, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, AlertTriangle, UserPlus, UserMinus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/hooks';
import { useToast } from '@/hooks/use-toast';
import { hasPermission } from '@/lib/auth/permissions';

const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function ServiceEmployeeViewer() {
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading: isLoadingServices, error: errorServices } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

  const { data: employees = [], isLoading: isLoadingEmployees, error: errorEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const selectedService = useMemo(() => {
    return services.find(service => service.id_servicio.toString() === selectedServiceId);
  }, [services, selectedServiceId]);

  const assignedEmployees = useMemo(() => {
    if (!selectedServiceId || employees.length === 0) {
      return [];
    }
    return employees.filter(employee => employee.id_servicio && employee.id_servicio.toString() === selectedServiceId);
  }, [selectedServiceId, employees]);

  const unassignedEmployees = useMemo(() => {
    return employees.filter(employee => !employee.id_servicio || employee.id_servicio === 0);
  }, [employees]);

  // Mutation para asignar empleado
  const assignEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, serviceId }: { employeeId: number; serviceId: number }) => {
      const response = await fetch('/api/admin/employees/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, serviceId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error asignando empleado');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Empleado asignado',
        description: 'El empleado ha sido asignado al servicio exitosamente.'
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al asignar empleado'
      });
    }
  });

  // Mutation para desasignar empleado
  const unassignEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await fetch('/api/admin/employees/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error desasignando empleado');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Empleado desasignado',
        description: 'El empleado ha sido removido del servicio exitosamente.'
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al desasignar empleado'
      });
    }
  });

  const handleAssignEmployee = (employeeId: number) => {
    if (!selectedServiceId) return;
    assignEmployeeMutation.mutate({ 
      employeeId, 
      serviceId: parseInt(selectedServiceId) 
    });
  };

  const handleUnassignEmployee = (employeeId: number) => {
    unassignEmployeeMutation.mutate(employeeId);
  };

  const isLoading = isLoadingServices || isLoadingEmployees;
  const queryError = errorServices || errorEmployees;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (queryError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error al Cargar Datos</AlertTitle>
        <AlertDescription>{queryError.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visor de Empleados por Servicio</CardTitle>
        <CardDescription>Seleccione un servicio para ver los empleados asignados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-full md:w-1/2">
          <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
            <SelectTrigger id="service-select">
              <SelectValue placeholder="Seleccione un servicio..." />
            </SelectTrigger>
            <SelectContent>
              {services.length > 0 ? (
                services.map(service => (
                  <SelectItem key={service.id_servicio} value={service.id_servicio.toString()}>{service.nombre_servicio}</SelectItem>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No hay servicios disponibles.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedServiceId && selectedService && (
          <div>
            <h3 className="text-xl font-semibold mb-3">
              Empleados en: <span className="text-primary">{selectedService.nombre_servicio}</span>
            </h3>
            {assignedEmployees.length > 0 ? (
              <ul className="space-y-4">
                {assignedEmployees.map(employee => (
                  <li key={employee.id_empleado} className="flex items-center gap-4 p-3 border rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://placehold.co/48x48.png?text=${getInitials(employee.nombre)}`} alt={employee.nombre} data-ai-hint="retrato persona" />
                      <AvatarFallback>{getInitials(employee.nombre)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-medium text-base">{employee.nombre}</p>
                      <p className="text-sm text-muted-foreground">{employee.email_empleado}</p>
                      <div className="text-sm text-muted-foreground mt-1">
                        {employee.trabaja_feriados && (
                          <Badge variant="secondary" className="mr-1 mb-1">Trabaja Feriados</Badge>
                        )}
                        {employee.prefiere_trabajar_fines_semana && (
                          <Badge variant="outline" className="mr-1 mb-1">Prefiere Fines de Semana</Badge>
                        )}
                        {employee.elegible_franco_pos_guardia && (
                          <Badge variant="outline" className="mr-1 mb-1">Franco Post-Guardia</Badge>
                        )}
                      </div>
                    </div>
                    {hasPermission(user, 'MANAGE_ALL_EMPLOYEES') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignEmployee(employee.id_empleado)}
                        disabled={unassignEmployeeMutation.isPending}
                        title="Remover del servicio"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No Hay Empleados Asignados</AlertTitle>
                <AlertDescription>
                  Actualmente no hay empleados asignados al servicio de "{selectedService.nombre_servicio}".
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Empleados sin asignar - solo para administradores */}
        {hasPermission(user, 'MANAGE_ALL_EMPLOYEES') && selectedServiceId && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">
              Empleados Sin Asignar ({unassignedEmployees.length})
            </h3>
            {unassignedEmployees.length > 0 ? (
              <ul className="space-y-4">
                {unassignedEmployees.map(employee => (
                  <li key={employee.id_empleado} className="flex items-center gap-4 p-3 border rounded-lg shadow-sm hover:bg-muted/50 transition-colors bg-yellow-50">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://placehold.co/48x48.png?text=${getInitials(employee.nombre)}`} alt={employee.nombre} data-ai-hint="retrato persona" />
                      <AvatarFallback>{getInitials(employee.nombre)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-medium text-base">{employee.nombre}</p>
                      <p className="text-sm text-muted-foreground">{employee.email_empleado}</p>
                      <div className="text-sm text-muted-foreground mt-1">
                        <Badge variant="secondary" className="mr-1 mb-1">Sin Asignar</Badge>
                        {employee.trabaja_feriados && (
                          <Badge variant="secondary" className="mr-1 mb-1">Trabaja Feriados</Badge>
                        )}
                        {employee.prefiere_trabajar_fines_semana && (
                          <Badge variant="outline" className="mr-1 mb-1">Prefiere Fines de Semana</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAssignEmployee(employee.id_empleado)}
                      disabled={assignEmployeeMutation.isPending}
                      title={`Asignar a ${selectedService?.nombre_servicio}`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Asignar
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No Hay Empleados Sin Asignar</AlertTitle>
                <AlertDescription>
                  Todos los empleados están asignados a servicios.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!selectedServiceId && services.length > 0 && (
           <Alert variant="default" className="mt-4">
            <Users className="h-4 w-4" />
            <AlertTitle>Seleccione un Servicio</AlertTitle>
            <AlertDescription>
              Por favor, elija un servicio del menú desplegable para ver los empleados asignados.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
