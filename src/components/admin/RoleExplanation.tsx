'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building, Eye, Settings } from 'lucide-react';

const roleExplanations = {
  super_admin: {
    title: 'Super Administrador',
    level: 1,
    icon: Settings,
    color: 'bg-red-500',
    description: 'Desarrollador o administrador técnico del sistema',
    permissions: [
      'Acceso total al sistema',
      'Configuraciones técnicas',
      'Gestión de todos los usuarios',
      'Resolución de problemas'
    ],
    example: 'Administrador del sistema ShiftFlow'
  },
  admin_hospital: {
    title: 'Administrador Hospital',
    level: 2,
    icon: Building,
    color: 'bg-blue-500',
    description: 'Director o administrador general del hospital',
    permissions: [
      'Gestión de todos los servicios',
      'Creación de usuarios',
      'Reportes generales',
      'Configuración de feriados'
    ],
    example: 'Director del Hospital San Juan'
  },
  jefe_servicio: {
    title: 'Jefe de Servicio',
    level: 3,
    icon: Users,
    color: 'bg-green-500',
    description: 'Jefe de un servicio específico (ej: Jefe de Mucamas, Jefe de Cocina)',
    permissions: [
      'Gestión de SU servicio únicamente',
      'Horarios de SU equipo',
      'Aprobación de cambios de SU servicio',
      'NO puede ver otros servicios'
    ],
    example: 'Jefe de Mucamas, Jefe de Cocina, Jefe de Enfermería'
  },
  
  empleado: {
    title: 'Empleado',
    level: 5,
    icon: Shield,
    color: 'bg-gray-500',
    description: 'Empleado regular del hospital',
    permissions: [
      'Ver su propio horario',
      'Solicitar intercambios',
      'Ver información personal',
      'NO puede ver otros empleados'
    ],
    example: 'Mucama, Cocinero, Auxiliar'
  }
};

interface RoleExplanationProps {
  roleId?: string;
  showAll?: boolean;
}

export default function RoleExplanation({ roleId, showAll = false }: RoleExplanationProps) {
  const rolesToShow = showAll 
    ? Object.entries(roleExplanations)
    : roleId 
      ? [[roleId, roleExplanations[roleId as keyof typeof roleExplanations]]]
      : [];

  if (rolesToShow.length === 0) return null;

  return (
    <div className="space-y-4">
      {showAll && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">🏥 Roles del Sistema Hospitalario</h3>
          <p className="text-sm text-muted-foreground">
            Sistema jerárquico para gestión de horarios por servicios
          </p>
        </div>
      )}
      
      {rolesToShow.map(([key, role]) => {
        if (!role) return null;
        
        const IconComponent = role.icon;
        
        return (
          <Card key={key} className="border-l-4" style={{ borderLeftColor: role.color.replace('bg-', '#') }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-md ${role.color} mr-3`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  {role.title}
                </div>
                <Badge variant="outline">Nivel {role.level}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {role.description}
              </p>
              
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Permisos:</h4>
                <ul className="text-sm space-y-1">
                  {role.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-muted p-2 rounded text-sm">
                <strong>Ejemplo:</strong> {role.example}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {showAll && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">💡 Ejemplo de Flujo:</h4>
            <div className="text-sm space-y-1">
              <p>1. <strong>Admin Hospital</strong> crea el servicio &quot;Mucamas&quot;</p>
              <p>2. <strong>Admin Hospital</strong> crea usuario &quot;Jefe de Mucamas&quot;</p>
              <p>3. <strong>Jefe de Mucamas</strong> gestiona solo empleados de mucamas</p>
              <p>4. <strong>Empleados</strong> ven solo su horario personal</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}