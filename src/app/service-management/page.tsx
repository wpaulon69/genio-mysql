'use client';

import { useAuth } from '@/lib/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import PageHeader from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Settings, 
  BarChart3, 
  UserPlus, 
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Star
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/auth/permissions';
import Link from 'next/link';

interface ServiceStats {
  serviceName: string;
  assignedEmployees: number;
  currentMonth: string;
  pendingRequests: number;
  activeSchedule: boolean;
  totalSchedules: number;
  publishedSchedules: number;
  nextScheduleMonth: string;
  nextScheduleYear: number;
  averageScheduleScore: number | null;
}

export default function ServiceManagementDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch service statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['service-stats', user?.serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/service-management/stats`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user?.serviceId && !authLoading,
    retry: 2,
    retryDelay: 1000
  });

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <div>Cargando...</div>;
  }

  // Si no hay usuario, no renderizar nada (ProtectedRoute se encargará)
  if (!user) {
    return null;
  }

  if (!user?.serviceId) {
    return (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
        <div className="container mx-auto">
          <div className="flex justify-between items-start mb-6">
            <PageHeader
              title="Gestión de Servicio"
              description="Panel de control para jefes de servicio"
            />
            <SimpleLogoutButton />
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <AlertCircle className="mr-2 h-5 w-5" />
                Servicio No Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Tu usuario no tiene un servicio asignado. Contacta al administrador para que te asigne a un servicio específico.
              </p>
              <div className="bg-blue-50 p-3 rounded-md text-sm">
                <p><strong>Usuario:</strong> {user?.name || 'N/A'}</p>
                <p><strong>Rol:</strong> {user?.role?.displayName || 'N/A'}</p>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_EMPLOYEES}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title={`Gestión de Servicio${stats ? `: ${stats.serviceName}` : ''}`}
            description="Panel de control para la gestión completa de tu servicio"
          />
          <SimpleLogoutButton />
        </div>

        {/* Service Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Resumen del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando estadísticas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  Error al cargar estadísticas
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {error.message || 'Error desconocido'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </Button>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.assignedEmployees}</div>
                  <div className="text-sm text-muted-foreground">Empleados Asignados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
                  <div className="text-sm text-muted-foreground">Solicitudes Pendientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalSchedules}</div>
                  <div className="text-sm text-muted-foreground">Horarios Generados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.publishedSchedules}</div>
                  <div className="text-sm text-muted-foreground">Horarios Publicados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.nextScheduleMonth}</div>
                  <div className="text-sm text-muted-foreground">Próximo Horario</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se pudieron cargar las estadísticas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-500" />
                Mi Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Administra la información y configuraciones de los empleados asignados a tu servicio.
              </p>
              <Button asChild className="w-full">
                <Link href="/service-management/employees">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar Mi Equipo
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-green-500" />
                Horarios de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gestiona los horarios mensuales de tu servicio. Puedes ver horarios existentes y generar nuevos usando IA.
              </p>
              <Button asChild className="w-full">
                <Link href="/service-management/schedules">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ir a Horarios
                </Link>
              </Button>
              <div className="mt-3 p-2 bg-green-50 rounded-md">
                <p className="text-xs text-green-700 text-center">
                  ✨ <strong>Nuevo:</strong> Generación automática de horarios con IA
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-purple-500" />
                Configurar Servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ajusta las configuraciones de tu servicio, dotaciones objetivo y reglas de trabajo.
              </p>
              <Button asChild className="w-full">
                <Link href="/service-management/service">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Estado Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Horario Activo:</span>
                  <Badge variant={stats?.activeSchedule ? "default" : "secondary"}>
                    {stats?.activeSchedule ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mes Actual:</span>
                  <Badge variant="outline">{stats?.currentMonth || "N/A"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Puntaje Promedio Horarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.averageScheduleScore !== null ? (
                <div className="text-2xl font-bold text-yellow-600">
                  {stats?.averageScheduleScore?.toFixed(2)}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No hay puntajes disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Acciones Requeridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.pendingRequests > 0 && (
                  <div className="flex items-center text-sm text-orange-600">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {stats.pendingRequests} solicitudes pendientes de revisión
                  </div>
                )}
                {(!stats?.pendingRequests && stats?.activeSchedule) && (
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Todo funcionando correctamente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}