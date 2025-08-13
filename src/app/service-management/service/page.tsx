"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageHeader from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, ArrowLeft } from 'lucide-react';
import ServiceConfigurationForm from '@/components/service-management/ServiceConfigurationForm';
import type { Service } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PERMISSIONS } from '@/lib/auth/permissions';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceConfigurationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Obtener la configuración actual del servicio
  const { data: service, isLoading, error } = useQuery<Service>({
    queryKey: ['service-config', user?.serviceId],
    queryFn: async () => {
      if (!user?.serviceId) throw new Error('No service assigned');
      const response = await fetch(`/api/services/${user.serviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service configuration');
      }
      return response.json();
    },
    enabled: !!user?.serviceId
  });

  // Mutación para actualizar la configuración del servicio
  const updateServiceMutation = useMutation({
    mutationFn: async (serviceData: Service) => {
      const response = await fetch(`/api/services/${user?.serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) {
        throw new Error('Failed to update service configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-config', user?.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['service-stats', user?.serviceId] });
      toast({ 
        title: "Configuración Actualizada", 
        description: "La configuración de tu servicio ha sido actualizada exitosamente." 
      });
      setIsFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: `No se pudo actualizar la configuración: ${err.message}` 
      });
    },
  });

  const handleFormSubmit = (serviceData: Service) => {
    updateServiceMutation.mutate(serviceData);
  };

  if (!user?.serviceId) {
    return (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
        <div className="container mx-auto">
          <PageHeader
            title="Configurar Servicio"
            description="Configura las reglas y parámetros de tu servicio"
          />
          <Alert>
            <AlertTitle>Servicio No Asignado</AlertTitle>
            <AlertDescription>
              Tu usuario no tiene un servicio asignado. Contacta al administrador para que te asigne a un servicio específico.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  if (isLoading) {
    return (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
        <div className="container mx-auto flex justify-center items-center h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
        <div className="container mx-auto">
          <PageHeader
            title="Configurar Servicio"
            description="Configura las reglas y parámetros de tu servicio"
          />
          <Alert variant="destructive">
            <AlertTitle>Error al Cargar Configuración</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
      <div className="container mx-auto">
        <PageHeader
          title={`Configurar Servicio: ${service?.nombre_servicio || 'Mi Servicio'}`}
          description="Ajusta las configuraciones, dotaciones objetivo y reglas de trabajo de tu servicio"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/service-management">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Dashboard
                </Link>
              </Button>
              <Button 
                onClick={() => setIsFormOpen(true)} 
                disabled={updateServiceMutation.isPending}
              >
                <Settings className="mr-2 h-4 w-4" /> 
                Editar Configuración
              </Button>
            </div>
          }
        />

        {/* Mostrar configuración actual */}
        {service && (
          <div className="space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre del Servicio</p>
                    <p className="text-lg">{service.nombre_servicio}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Turno Noche Habilitado</p>
                    <p className="text-lg">{service.habilitar_turno_noche ? 'Sí' : 'No'}</p>
                  </div>
                  {service.descripcion && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                      <p className="text-lg">{service.descripcion}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dotación objetivo */}
            <Card>
              <CardHeader>
                <CardTitle>Dotación Objetivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Lunes a Viernes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mañanas:</span>
                        <span className="font-medium">{service.dotacion_objetivo_lunes_a_viernes_mananas || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tardes:</span>
                        <span className="font-medium">{service.dotacion_objetivo_lunes_a_viernes_tardes || 0}</span>
                      </div>
                      {service.habilitar_turno_noche && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Noches:</span>
                          <span className="font-medium">{service.dotacion_objetivo_lunes_a_viernes_noche || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Sábados, Domingos y Feriados</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mañanas:</span>
                        <span className="font-medium">{service.dotacion_objetivo_sab_dom_feriados_mananas || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tardes:</span>
                        <span className="font-medium">{service.dotacion_objetivo_sab_dom_feriados_tardes || 0}</span>
                      </div>
                      {service.habilitar_turno_noche && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Noches:</span>
                          <span className="font-medium">{service.dotacion_objetivo_sab_dom_feriados_noche || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reglas de planificación */}
            <Card>
              <CardHeader>
                <CardTitle>Reglas de Planificación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Máx. Días Trabajo Consecutivos</p>
                    <p className="text-lg font-medium">{service.max_dias_trabajo_consecutivos || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Días Trabajo Consecutivos Preferidos</p>
                    <p className="text-lg font-medium">{service.dias_trabajo_consecutivos_preferidos || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Máx. Descansos Consecutivos</p>
                    <p className="text-lg font-medium">{service.max_descansos_consecutivos || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Días Descanso Consecutivos Preferidos</p>
                    <p className="text-lg font-medium">{service.dias_descanso_consecutivos_preferidos || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mín. Descansos Antes de Trabajar</p>
                    <p className="text-lg font-medium">{service.min_descansos_requeridos_antes_de_trabajar || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">FDS Descanso Completo Objetivo</p>
                    <p className="text-lg font-medium">{service.fds_descanso_completo_objetivo || 0}</p>
                  </div>
                </div>
                {service.notas_adicionales && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Notas Adicionales</p>
                    <p className="text-sm mt-1">{service.notas_adicionales}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulario de edición */}
        <ServiceConfigurationForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          service={service}
          isLoading={updateServiceMutation.isPending}
        />
      </div>
    </ProtectedRoute>
  );
}