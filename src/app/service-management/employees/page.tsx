'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import PageHeader from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Edit, 
  UserMinus, 
  UserPlus, 
  ArrowLeft,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import * as AuthPermissions from '@/lib/auth/permissions';
import { useToast } from '@/hooks/use-toast';
import EmployeeEditForm from '@/components/service-management/EmployeeEditForm';
import EmployeePreferencesForm from '@/components/employees/employee-preferences-form';
import Link from 'next/link';
import { Employee } from '@/lib/types';



interface TipoAsignacion {
  id_tipo_asignacion: number;
  nombre_tipo: string;
}

interface AvailableEmployee {
  id_empleado: number;
  nombre: string;
  email_empleado: string;
  id_servicio: number | null;
}

export default function ServiceEmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assigned employees
  const { data: assignedEmployees = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ['service-employees', user?.serviceId],
    queryFn: async () => {
      const response = await fetch('/api/service-management/employees');
      if (!response.ok) throw new Error('Error fetching employees');
      return response.json();
    },
    enabled: !!user?.serviceId
  });

  // Fetch assignment types for preferences
  const { data: assignmentTypes = [] } = useQuery({
    queryKey: ['assignment-types'],
    queryFn: async () => {
      const response = await fetch('/api/assignment-types');
      if (!response.ok) throw new Error('Error fetching assignment types');
      return response.json();
    }
  });



  // Filter employees based on search
  const filteredAssigned = assignedEmployees.filter((employee: Employee) =>
    employee.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email_empleado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleEditPreferences = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPreferencesDialogOpen(true);
  };

  const handlePreferencesSubmit = async (data: any) => {
    if (!selectedEmployee) return;
    
    try {
      const response = await fetch(`/api/service-management/employees/${selectedEmployee.id_empleado}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Error updating preferences');
      }
      
      toast({
        title: 'Preferencias actualizadas',
        description: 'Las preferencias del empleado han sido actualizadas exitosamente.'
      });
      
      setIsPreferencesDialogOpen(false);
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['service-employees'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar preferencias'
      });
    }
  };

  if (!user?.serviceId) {
    return (
      <ProtectedRoute requiredPermissions={[AuthPermissions.PERMISSIONS.MANAGE_SERVICE_EMPLOYEES]}>
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

  return (
    <ProtectedRoute requiredPermissions={[AuthPermissions.PERMISSIONS.MANAGE_SERVICE_EMPLOYEES]}>
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
              title="Gestión de Empleados"
              description="Administra los empleados de tu servicio"
            />
          </div>
          <SimpleLogoutButton />
        </div>

        {/* Header info */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Mi Equipo de Trabajo</h3>
            <p className="text-sm text-blue-700">
              Aquí puedes gestionar la información de los empleados asignados a tu servicio. 
              Para asignar nuevos empleados, contacta al administrador del hospital.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-500" />
                Empleados de Mi Servicio ({assignedEmployees.length})
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Employees Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Preferencias</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAssigned ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Cargando empleados...
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssigned.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          {searchTerm ? 'No se encontraron empleados' : 'No hay empleados asignados a tu servicio'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssigned.map((employee: Employee) => (
                        <TableRow key={employee.id_empleado}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {employee.id_empleado}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{employee.email_empleado}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {employee.trabaja_feriados && (
                                <Badge variant="secondary" className="text-xs">
                                  Trabaja Feriados
                                </Badge>
                              )}
                              {employee.prefiere_trabajar_fines_semana && (
                                <Badge variant="outline" className="text-xs">
                                  Prefiere Fines de Semana
                                </Badge>
                              )}
                              {employee.elegible_franco_pos_guardia && (
                                <Badge variant="outline" className="text-xs">
                                  Franco Post-Guardia
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                                title="Editar información básica"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditPreferences(employee)}
                                title="Editar preferencias y horarios"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Empleado</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <EmployeeEditForm
                employee={selectedEmployee}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedEmployee(null);
                  queryClient.invalidateQueries({ queryKey: ['service-employees'] });
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedEmployee(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Employee Preferences Dialog */}
        {selectedEmployee && (
          <EmployeePreferencesForm
            isOpen={isPreferencesDialogOpen}
            onClose={() => {
              setIsPreferencesDialogOpen(false);
              setSelectedEmployee(null);
            }}
            onSubmit={handlePreferencesSubmit}
            employee={selectedEmployee}
            availableAssignmentTypes={assignmentTypes}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}