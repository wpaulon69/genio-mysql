'use client';

import { useState } from 'react';
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
import { Shield, Search, Edit, Trash2, Plus, Users, Settings } from 'lucide-react';
import { PERMISSIONS } from '@/lib/types/auth';
import { useToast } from '@/hooks/use-toast';
import RoleForm from '@/components/admin/RoleForm';
import RoleExplanation from '@/components/admin/RoleExplanation';

interface Role {
  id: string;
  name: string;
  displayName: string;
  level: number;
  description: string;
  permissionsCount: number;
  usersCount: number;
  createdAt: string;
}

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles/management');
      if (!response.ok) throw new Error('Error fetching roles');
      return response.json();
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error deleting role');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rol eliminado',
        description: 'El rol ha sido eliminado exitosamente.'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al eliminar rol'
      });
    }
  });

  // Filter roles based on search
  const filteredRoles = roles.filter((role: Role) =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (role.usersCount > 0) {
      toast({
        variant: 'destructive',
        title: 'No se puede eliminar',
        description: `Este rol tiene ${role.usersCount} usuarios asignados. Reasigna los usuarios antes de eliminar el rol.`
      });
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar el rol "${role.displayName}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const getRoleBadgeColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ProtectedRoute permission={PERMISSIONS.SYSTEM_SETTINGS}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Gestión de Roles"
            description="Administrar roles del sistema y sus permisos"
          />
          <SimpleLogoutButton />
        </div>

        {/* Explanation Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Sistema de Roles
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? 'Ocultar' : 'Ver'} Explicación
              </Button>
            </div>
          </CardHeader>
          {showExplanation && (
            <CardContent>
              <RoleExplanation showAll={true} />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Roles del Sistema
              </CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Rol
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Rol</DialogTitle>
                  </DialogHeader>
                  <RoleForm
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Roles Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Cargando roles...
                      </TableCell>
                    </TableRow>
                  ) : filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm ? 'No se encontraron roles' : 'No hay roles configurados'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles.map((role: Role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getRoleBadgeColor(role.level)}`} />
                            <div>
                              <div className="font-medium">{role.displayName}</div>
                              <div className="text-sm text-muted-foreground">{role.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Nivel {role.level}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={role.description}>
                            {role.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {role.permissionsCount} permisos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{role.usersCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(role.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(role)}
                              disabled={role.usersCount > 0}
                              className="text-red-600 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Editar Rol</DialogTitle>
            </DialogHeader>
            {selectedRole && (
              <RoleForm
                role={selectedRole}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRole(null);
                  queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}