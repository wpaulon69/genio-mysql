'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CalendarSearch, 
  AlertTriangle, 
  Info, 
  Calendar,
  Eye,
  Edit,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions';

import type { Employee, Service, MonthlySchedule, Holiday } from '@/lib/types';
import InteractiveScheduleGrid from '@/components/schedule/InteractiveScheduleGrid';
import ServiceScheduleGenerator from '@/components/service-management/ServiceScheduleGenerator';

const currentYear = new Date().getFullYear();
const scheduleYears = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
const scheduleMonths = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: format(new Date(currentYear, i), 'MMMM', { locale: es }),
}));

interface UnifiedScheduleManagerProps {
  title?: string;
  description?: string;
}

export default function UnifiedScheduleManager({ 
  title = "Gestión de Horarios",
  description = "Visualiza y gestiona los horarios del hospital"
}: UnifiedScheduleManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedYearView, setSelectedYearView] = useState<string>(currentYear.toString());
  const [selectedMonthView, setSelectedMonthView] = useState<string>((new Date().getMonth() + 1).toString());
  // Determinar si es jefe de servicio (solo puede ver su servicio)
  const isJefeServicio = user?.role?.name === 'jefe_servicio';
  const canManageAllServices = user ? hasPermission(user, PERMISSIONS.MANAGE_ALL_SERVICES) : false;

  const [selectedServiceIdView, setSelectedServiceIdView] = useState<string | undefined>(
    isJefeServicio && !canManageAllServices ? user?.serviceId?.toString() : undefined
  );
  const [selectedScheduleToDisplay, setSelectedScheduleToDisplay] = useState<MonthlySchedule | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<MonthlySchedule | null>(null);

  // Fetch services (solo si puede gestionar todos los servicios)
  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Error fetching services');
      return response.json();
    },
    enabled: canManageAllServices
  });

  // Fetch employees (basado en el servicio seleccionado o del usuario)
  const targetServiceId = isJefeServicio ? user?.serviceId : selectedServiceIdView;
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['service-employees', targetServiceId],
    queryFn: async () => {
      if (isJefeServicio) {
        // Jefe de servicio usa su endpoint específico
        const response = await fetch('/api/service-management/employees');
        if (!response.ok) throw new Error('Error fetching employees');
        return response.json();
      } else {
        // Admin hospital obtiene empleados de todos los servicios y filtra
        const response = await fetch('/api/employees');
        if (!response.ok) throw new Error('Error fetching employees');
        const allEmployees = await response.json();
        
        // Filtrar empleados del servicio seleccionado
        return allEmployees.filter((emp: any) => 
          emp.id_servicio === parseInt(targetServiceId as string)
        );
      }
    },
    enabled: !!targetServiceId
  });

  // Fetch service info
  const { data: serviceInfo, isLoading: isLoadingService, error: serviceError } = useQuery<Service>({
    queryKey: ['service', targetServiceId],
    queryFn: async () => {
      console.log('🔍 Fetching service info for ID:', targetServiceId);
      const response = await fetch(`/api/services/${targetServiceId}`);
      console.log('🔍 Service API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Service API error:', errorText);
        throw new Error(`Error fetching service: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('🔍 Service data received:', data);
      return data;
    },
    enabled: !!targetServiceId
  });

  // Fetch holidays
  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const response = await fetch('/api/holidays');
      if (!response.ok) throw new Error('Error fetching holidays');
      return response.json();
    }
  });

  // Fetch schedules for selected month/year/service
  const { data: schedules = [], isLoading: isLoadingSchedules, refetch: refetchSchedules } = useQuery<MonthlySchedule[]>({
    queryKey: ['schedules', selectedYearView, selectedMonthView, targetServiceId],
    queryFn: async () => {
      const params = new URLSearchParams({
        year: selectedYearView,
        month: selectedMonthView,
        ...(targetServiceId && { serviceId: targetServiceId.toString() })
      });
      
      const response = await fetch(`/api/monthlySchedules?${params}`);
      if (!response.ok) throw new Error('Error fetching schedules');
      return response.json();
    },
    enabled: !!targetServiceId
  });

  const isLoading = isLoadingEmployees || isLoadingService || isLoadingHolidays || isLoadingSchedules;

  // Debug logs
  console.log('🔍 Debug UnifiedScheduleManager:', {
    isJefeServicio,
    canManageAllServices,
    userServiceId: user?.serviceId,
    selectedServiceIdView,
    targetServiceId,
    servicesCount: services.length,
    serviceInfo: serviceInfo ? 'loaded' : 'null',
    isLoadingService,
    serviceError: serviceError?.message
  });

  // Efecto para debug cuando cambia el servicio seleccionado
  useEffect(() => {
    console.log('🔄 Efecto: selectedServiceIdView cambió a:', selectedServiceIdView);
    console.log('🔄 Efecto: targetServiceId es ahora:', targetServiceId);
  }, [selectedServiceIdView, targetServiceId]);

  // Si es jefe de servicio pero no tiene servicio asignado
  if (isJefeServicio && !user?.serviceId) {
    return (
      <div className="container mx-auto">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Servicio No Asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tu usuario no tiene un servicio asignado. Contacta al administrador para que te asigne a un servicio específico.
            </p>
            <div className="bg-blue-50 p-3 rounded-md text-sm">
              <p><strong>Usuario:</strong> {user?.name}</p>
              <p><strong>Rol:</strong> {user?.role?.displayName}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Service Selector (solo para admin/super admin) */}
      {canManageAllServices && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Seleccionar Servicio
            </CardTitle>
            <CardDescription>
              Selecciona el servicio para gestionar sus horarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedServiceIdView} 
              onValueChange={(value) => {
                console.log('🔄 Servicio seleccionado:', value);
                setSelectedServiceIdView(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un servicio..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id_servicio} value={service.id_servicio.toString()}>
                    {service.nombre_servicio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Service Info Display */}
      {serviceInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {serviceInfo.nombre_servicio}
            </CardTitle>
            <CardDescription>
              Gestión de horarios - {format(new Date(parseInt(selectedYearView), parseInt(selectedMonthView) - 1), 'MMMM yyyy', { locale: es })}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Month/Year Selectors */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Año</label>
              <Select value={selectedYearView} onValueChange={setSelectedYearView}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mes</label>
              <Select value={selectedMonthView} onValueChange={setSelectedMonthView}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {!targetServiceId ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CalendarSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {canManageAllServices 
                  ? "Selecciona un servicio para ver y gestionar sus horarios"
                  : "Cargando información del servicio..."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando horarios...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="view" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view" className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              Ver Horarios
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Generar Horario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            {schedules.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay horarios disponibles para el período seleccionado</p>
                    <p className="text-sm mt-2">Usa la pestaña &quot;Generar Horario&quot; para crear uno nuevo</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{schedule.horario_nombre || `Horario ${schedule.id}`}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedScheduleToDisplay(schedule)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalle
                        </Button>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Schedule Display Modal/Detail */}
            {selectedScheduleToDisplay && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedScheduleToDisplay.horario_nombre || `Horario ${selectedScheduleToDisplay.id}`}
                  </CardTitle>
                  <CardDescription>
                    Vista de solo lectura - Usa el botón &quot;Editar&quot; para hacer cambios
                  </CardDescription>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedScheduleToDisplay(null)}
                    >
                      Cerrar
                    </Button>
                    <Button
                      onClick={() => {
                        setScheduleToEdit(selectedScheduleToDisplay);
                        setSelectedScheduleToDisplay(null);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700 flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      <strong>Modo Solo Lectura:</strong> Esta vista es solo para consulta. Para hacer cambios, usa el botón &quot;Editar&quot;.
                    </p>
                  </div>
                  <InteractiveScheduleGrid
                    initialShifts={selectedScheduleToDisplay.shifts || []}
                    initialScheduleName={selectedScheduleToDisplay.horario_nombre || ''}
                    allEmployees={employees}
                    targetService={serviceInfo}
                    month={selectedMonthView}
                    year={selectedYearView}
                    holidays={holidays}
                    isReadOnly={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* Schedule Edit Modal */}
            {scheduleToEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Editar: {scheduleToEdit.horario_nombre || `Horario ${scheduleToEdit.id}`}
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setScheduleToEdit(null)}
                  >
                    Cancelar
                  </Button>
                </CardHeader>
                <CardContent>
                  <InteractiveScheduleGrid
                    initialShifts={scheduleToEdit.shifts || []}
                    initialScheduleName={scheduleToEdit.horario_nombre || `Horario ${scheduleToEdit.id}`}
                    allEmployees={employees}
                    targetService={serviceInfo}
                    month={selectedMonthView}
                    year={selectedYearView}
                    holidays={holidays}
                    onSave={() => {
                      setScheduleToEdit(null);
                      refetchSchedules();
                      toast({
                        title: "Horario actualizado",
                        description: "Los cambios se han guardado correctamente"
                      });
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {isLoadingService ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando información del servicio...</p>
                  </div>
                </CardContent>
              </Card>
            ) : serviceError ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-red-600">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-semibold">Error al cargar el servicio</p>
                    <p className="text-sm mt-2">{serviceError.message}</p>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 p-3 bg-red-50 rounded text-xs text-left">
                        <p><strong>Debug Info:</strong></p>
                        <p>targetServiceId: {targetServiceId}</p>
                        <p>API URL: /api/services/{targetServiceId}</p>
                        <p>Error: {serviceError.message}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : !serviceInfo ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {canManageAllServices 
                        ? "Selecciona un servicio para generar horarios"
                        : "Información del servicio no disponible"
                      }
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                        <p><strong>Debug Info:</strong></p>
                        <p>canManageAllServices: {canManageAllServices.toString()}</p>
                        <p>selectedServiceIdView: {selectedServiceIdView || 'undefined'}</p>
                        <p>targetServiceId: {targetServiceId || 'undefined'}</p>
                        <p>services.length: {services.length}</p>
                        <p>serviceInfo: {serviceInfo ? 'loaded' : 'null'}</p>
                        <p>isLoadingService: {isLoadingService.toString()}</p>
                        {serviceError && <p style={{color: 'red'}}>serviceError: {serviceError.message}</p>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ServiceScheduleGenerator
                service={serviceInfo}
                employees={employees}
                holidays={holidays}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}