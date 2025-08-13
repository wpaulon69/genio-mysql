'use client';

import { useAuth, usePermission } from '@/lib/auth/hooks';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import PageHeader from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, Settings, Activity, UserPlus, Key } from 'lucide-react';
import Link from 'next/link';
import { PERMISSIONS } from '@/lib/auth/permissions';

export default function AdminPage() {
  const { user } = useAuth();

  const adminFeatures = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear, editar y administrar usuarios del sistema',
      icon: Users,
      href: '/admin/users',
      permission: PERMISSIONS.MANAGE_USERS,
      color: 'bg-blue-500'
    },
    {
      title: 'Roles y Permisos',
      description: 'Configurar roles y asignar permisos específicos',
      icon: Shield,
      href: '/admin/roles',
      permission: PERMISSIONS.SYSTEM_SETTINGS,
      color: 'bg-green-500'
    },
    {
      title: 'Configuración del Sistema',
      description: 'Ajustes generales y configuraciones avanzadas',
      icon: Settings,
      href: '/admin/settings',
      permission: PERMISSIONS.SYSTEM_SETTINGS,
      color: 'bg-purple-500'
    },
    {
      title: 'Auditoría y Logs',
      description: 'Revisar actividad del sistema y sesiones de usuario',
      icon: Activity,
      href: '/admin/audit',
      permission: PERMISSIONS.SYSTEM_SETTINGS,
      color: 'bg-orange-500'
    },
    {
      title: 'Crear Usuario Rápido',
      description: 'Asistente para crear nuevos usuarios rápidamente',
      icon: UserPlus,
      href: '/admin/users/create',
      permission: PERMISSIONS.MANAGE_USERS,
      color: 'bg-indigo-500'
    },
    {
      title: 'Cambiar Contraseñas',
      description: 'Resetear contraseñas de usuarios del sistema',
      icon: Key,
      href: '/admin/passwords',
      permission: PERMISSIONS.MANAGE_USERS,
      color: 'bg-red-500'
    }
  ];

  return (
    <ProtectedRoute permission={PERMISSIONS.MANAGE_USERS}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Panel de Administración"
            description="Gestión completa del sistema de usuarios y configuraciones"
          />
          <SimpleLogoutButton />
        </div>

        {/* Información del usuario actual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Sesión Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Usuario</p>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="font-medium">{user?.role.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Permisos</p>
                <p className="font-medium">{user?.permissions.length} permisos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <AdminFeatureCard key={feature.href} feature={feature} />
          ))}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Estadísticas del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Usuarios Activos" value="1" description="En el sistema" />
            <StatCard title="Roles Configurados" value="5" description="Niveles de acceso" />
            <StatCard title="Permisos Totales" value="10" description="Funcionalidades" />
            <StatCard title="Sesiones Hoy" value="1" description="Inicios de sesión" />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function AdminFeatureCard({ feature }: { feature: any }) {
  const hasPermission = usePermission(feature.permission);

  if (!hasPermission) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center text-muted-foreground">
            <div className={`p-2 rounded-md ${feature.color} mr-3 opacity-50`}>
              <feature.icon className="h-5 w-5 text-white" />
            </div>
            {feature.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
          <Button disabled variant="outline" className="w-full">
            Sin Permisos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className={`p-2 rounded-md ${feature.color} mr-3`}>
            <feature.icon className="h-5 w-5 text-white" />
          </div>
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
        <Button asChild className="w-full">
          <Link href={feature.href}>Acceder</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}