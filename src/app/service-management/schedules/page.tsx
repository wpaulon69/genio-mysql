"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import PageHeader from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CalendarSearch, 
  AlertTriangle, 
  Info, 
  UploadCloud, 
  ArrowLeft,
  Calendar,
  Eye,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { useToast } from '@/hooks/use-toast';

import type { Employee, Service, MonthlySchedule, Holiday } from '@/lib/types';
import type { AIShift } from '@/ai/flows/suggest-shift-schedule';
import ScheduleEvaluationDisplay from '@/components/schedule/schedule-evaluation-display';
import InteractiveScheduleGrid from '@/components/schedule/InteractiveScheduleGrid';
import ServiceScheduleGenerator from '@/components/service-management/ServiceScheduleGenerator';
import Link from 'next/link';

const currentYear = new Date().getFullYear();
const scheduleYears = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
const scheduleMonths = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: format(new Date(currentYear, i), 'MMMM', { locale: es }),
}));

export default function ServiceSchedulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedYearView, setSelectedYearView] = useState<string>(currentYear.toString());
  const [selectedMonthView, setSelectedMonthView] = useState<string>((new Date().getMonth() + 1).toString());
  const [activeTab, setActiveTab] = useState<string>("view-schedule");
  const [selectedScheduleToDisplay, setSelectedScheduleToDisplay] = useState<MonthlySchedule | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<MonthlySchedule | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);



  // Fetch employees of the service
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['service-employees', user?.serviceId],
    queryFn: async () => {
      const response = await fetch('/api/service-management/employees');
      if (!response.ok) throw new Error('Error fetching employees');
      return response.json();
    },
    enabled: !!user?.serviceId
  });

  // Fetch service info
  const { data: serviceInfo, isLoading: isLoadingService, error: serviceInfoError } = useQuery<Service>({
    queryKey: ['service-info', user?.serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/services/${user?.serviceId}`);
      if (!response.ok) {
        throw new Error(`Error fetching service info: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.serviceId
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

  // Fetch schedules for the service
  const {
    data: availableSchedules = [],
    isLoading: isLoadingSchedules,
    error: errorSchedules,
    refetch: refetchSchedules,
  } = useQuery<MonthlySchedule[]>({
    queryKey: ['service-schedules', user?.serviceId, selectedYearView, selectedMonthView],
    queryFn: async () => {
      if (!user?.serviceId) return [];
      const url = `/api/monthlySchedules?year=${selectedYearView}&month=${selectedMonthView}&serviceId=${user.serviceId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      return data;
    },
    enabled: !!(user?.serviceId && selectedMonthView && selectedYearView),
  });

  const isLoading = isLoadingEmployees || isLoadingService || isLoadingHolidays;

  const handleLoadRefreshSchedule = () => {
    if (user?.serviceId && selectedYearView && selectedMonthView) {
      refetchSchedules();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el horario. Verifique que tenga un servicio asignado.",
      });
    }
  };

  const handleEditSchedule = (schedule: MonthlySchedule) => {
    setScheduleToEdit(schedule);
    setIsEditMode(true);
    setActiveTab("edit-schedule");
    toast({
      title: "Modo de edición activado",
      description: `Editando: ${schedule.horario_nombre || `Horario ${schedule.id}`}`,
    });
  };

  const handleCancelEdit = () => {
    setScheduleToEdit(null);
    setIsEditMode(false);
    setActiveTab("view-schedule");
  };

  const handleSaveEditedSchedule = async (editedShifts: AIShift[], status: 'published' | 'draft', evaluationResult: any | null) => {
    if (!scheduleToEdit) return;

    try {
      // Crear el objeto de horario actualizado con la estructura correcta
      const updatedSchedule: MonthlySchedule = {
        ...scheduleToEdit,
        shifts: editedShifts,
        status,
        version: scheduleToEdit.version + 1,
        updatedAt: Date.now(),
        score: evaluationResult?.score || scheduleToEdit.score,
        violations: evaluationResult?.violations || scheduleToEdit.violations,
        scoreBreakdown: evaluationResult?.scoreBreakdown || scheduleToEdit.scoreBreakdown,
        responseText: evaluationResult?.responseText || scheduleToEdit.responseText
      };

      const response = await fetch('/api/monthlySchedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule)
      });

      if (!response.ok) {
        throw new Error('Error al guardar el horario editado');
      }

      toast({
        title: "Horario actualizado",
        description: `El horario ha sido ${status === 'published' ? 'publicado' : 'guardado como borrador'} exitosamente.`,
      });

      // Refrescar la lista de horarios
      refetchSchedules();
      
      // Salir del modo de edición
      handleCancelEdit();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al guardar el horario editado",
      });
    }
  };

  if (!user?.serviceId) {
    return (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
        <div className="container mx-auto">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Tu usuario no tiene un servicio asignado.
              </p>
            </CardContent>
          </Card>
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

  return (
    <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/service-management">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <PageHeader
              title="Gestionar Horarios"
              description={`Visualiza y gestiona los horarios de ${serviceInfo?.nombre_servicio || 'tu servicio'}`}
            />
          </div>
          <SimpleLogoutButton />
        </div>

        {/* Service Info */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <Calendar className="inline mr-2 h-4 w-4" />
              Horarios de {serviceInfo?.nombre_servicio}
            </h3>
            <p className="text-sm text-blue-700">
              Aquí puedes visualizar los horarios existentes y generar nuevos horarios para tu servicio. 
              Usa las pestañas para navegar entre ver horarios existentes y generar nuevos.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isEditMode ? 'grid-cols-3' : 'grid-cols-2'} md:w-2/3 mb-6`}>
            <TabsTrigger value="view-schedule">Ver Horarios</TabsTrigger>
            <TabsTrigger value="generate-schedule">Generar Horarios</TabsTrigger>
            {isEditMode && (
              <TabsTrigger value="edit-schedule" className="bg-blue-50 text-blue-700">
                Editar Horario
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="view-schedule" className="mt-6">
            <Card className="mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CalendarSearch className="mr-3 h-6 w-6 text-primary"/>
                  Visualizar Horarios
                </CardTitle>
                <CardDescription>
                  Seleccione el mes y año para cargar los horarios de {serviceInfo?.nombre_servicio}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={selectedMonthView} onValueChange={setSelectedMonthView}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar Mes" /></SelectTrigger>
                    <SelectContent>
                      {scheduleMonths.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYearView} onValueChange={setSelectedYearView}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar Año" /></SelectTrigger>
                    <SelectContent>
                      {scheduleYears.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleLoadRefreshSchedule}
                  disabled={!selectedMonthView || !selectedYearView || isLoadingSchedules}
                  className="w-full md:w-auto mt-2"
                >
                  {isLoadingSchedules ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  Cargar/Refrescar Horarios
                </Button>
              </CardContent>
            </Card>

            {isLoadingSchedules && (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Cargando horarios...</p>
              </div>
            )}

            {errorSchedules && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-5 w-5 mr-2"/>
                <AlertTitle>Error al Cargar Horarios</AlertTitle>
                <AlertDescription>
                  {(errorSchedules as Error).message || "No se pudieron cargar los horarios."}
                </AlertDescription>
              </Alert>
            )}

            {!isLoadingSchedules && !errorSchedules && selectedMonthView && selectedYearView && (
              <>
                {availableSchedules.length > 0 ? (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Horarios Disponibles</CardTitle>
                      <CardDescription>
                        {scheduleMonths.find(m => m.value === selectedMonthView)?.label} {selectedYearView} - {serviceInfo?.nombre_servicio}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {availableSchedules.map(schedule => (
                          <div 
                            key={schedule.id} 
                            className={`p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                              selectedScheduleToDisplay?.id === schedule.id ? 'bg-accent border-primary' : ''
                            }`}
                            onClick={() => setSelectedScheduleToDisplay(schedule)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">
                                  {schedule.horario_nombre || `Horario ${schedule.id}`}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    schedule.status === 'published' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {schedule.status === 'published' ? 'Publicado' : 'Borrador'}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    Puntaje: <span className="font-medium">{schedule.score ?? 'N/A'}</span>
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Actualizado: {format(new Date(schedule.updatedAt), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedScheduleToDisplay(schedule);
                                  }}
                                  className="flex items-center"
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSchedule(schedule);
                                  }}
                                  className="flex items-center"
                                >
                                  <Edit className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert className="mt-4">
                    <Info className="h-5 w-5 mr-2"/>
                    <AlertTitle>No se encontraron horarios</AlertTitle>
                    <AlertDescription>
                      No hay horarios para {serviceInfo?.nombre_servicio} en{' '}
                      {scheduleMonths.find(m => m.value === selectedMonthView)?.label} {selectedYearView}.
                      Los horarios son creados por el administrador del hospital.
                    </AlertDescription>
                  </Alert>
                )}



                {selectedScheduleToDisplay && (serviceInfo || selectedScheduleToDisplay.serviceName) && (
                  <div className="mt-4">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">
                        {selectedScheduleToDisplay.horario_nombre || `Horario ${selectedScheduleToDisplay.id}`}
                        <span className={`ml-3 px-3 py-1 text-sm rounded-full ${
                          selectedScheduleToDisplay.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedScheduleToDisplay.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </h3>
                      <p className="text-muted-foreground">
                        {serviceInfo?.nombre_servicio || selectedScheduleToDisplay.serviceName} - {scheduleMonths.find(m=>m.value === selectedMonthView)?.label} {selectedYearView}
                      </p>
                    </div>
                    
                    <InteractiveScheduleGrid
                      initialShifts={selectedScheduleToDisplay.shifts || []}
                      initialScheduleName={selectedScheduleToDisplay.horario_nombre || ''}
                      allEmployees={employees}
                      targetService={serviceInfo || {
                        id_servicio: parseInt(selectedScheduleToDisplay.serviceId),
                        nombre_servicio: selectedScheduleToDisplay.serviceName
                      }}
                      month={selectedMonthView}
                      year={selectedYearView}
                      holidays={holidays}
                      onShiftsChange={() => {}} // No-op para solo lectura
                      onScheduleNameChange={() => {}} // No-op para solo lectura
                      onBackToConfig={() => {}} // No-op
                      isReadOnly={true}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="generate-schedule" className="mt-6">
            {(serviceInfo || user?.serviceId) && (
              <ServiceScheduleGenerator
                service={serviceInfo || {
                  id_servicio: user?.serviceId || 1,
                  nombre_servicio: 'Mi Servicio',
                  descripcion: '',
                  habilitar_turno_noche: true
                }}
                employees={employees}
                holidays={holidays}
              />
            )}
            
            {!serviceInfo && !user?.serviceId && (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <Info className="h-5 w-5 mr-2"/>
                    <AlertTitle>Información del servicio requerida</AlertTitle>
                    <AlertDescription>
                      Se necesita cargar la información del servicio para generar horarios.
                      <br />
                      <small>Debug: user.serviceId = {user?.serviceId || 'NULL'}</small>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="edit-schedule" className="mt-6">
            {isEditMode && scheduleToEdit && serviceInfo && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Edit className="mr-2 h-5 w-5 text-blue-500" />
                        Editando Horario
                      </CardTitle>
                      <CardDescription>
                        {scheduleToEdit.horario_nombre || `Horario ${scheduleToEdit.id}`} - {serviceInfo.nombre_servicio}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancelar Edición
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      <Info className="inline mr-1 h-4 w-4" />
                      Está editando un horario existente. Los cambios se guardarán sobre el horario actual.
                    </p>
                  </div>
                  
                  <InteractiveScheduleGrid
                    initialShifts={scheduleToEdit.shifts || []}
                    initialScheduleName={scheduleToEdit.horario_nombre || `Horario ${scheduleToEdit.id}`}
                    allEmployees={employees}
                    targetService={serviceInfo}
                    month={selectedMonthView}
                    year={selectedYearView}
                    holidays={holidays}
                    onShiftsChange={() => {}} // Los cambios se manejan internamente
                    onScheduleNameChange={() => {}} // El nombre se mantiene
                    onBackToConfig={handleCancelEdit}
                    isReadOnly={false}
                    onSave={handleSaveEditedSchedule}
                    isSaving={false}
                    onEvaluationComplete={() => {}}
                  />
                </CardContent>
              </Card>
            )}
            
            {!isEditMode && (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <Info className="h-5 w-5 mr-2"/>
                    <AlertTitle>No hay horario en edición</AlertTitle>
                    <AlertDescription>
                      Seleccione un horario de la pestaña "Ver Horarios" y haga clic en "Editar" para comenzar.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}