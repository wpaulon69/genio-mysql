'use client';

import { useState, useEffect } from 'react';
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
import { UserPlus, Search, Edit, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import * as AuthPermissions from '@/lib/auth/permissions';
import { useToast } from '@/hooks/use-toast';
import SimpleUserForm from '@/components/admin/SimpleUserForm';

import { User } from '@/lib/types';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Error fetching users');
      return response.json();
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error deleting user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al eliminar usuario'
      });
    }
  });

  // Toggle user status mutation
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Error updating user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado del usuario ha sido actualizado.'
      });
    }
  });

  const filteredUsers = users.filter((user: User) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = (user: User) => {
    if (confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleToggleUser = (user: User) => {
    toggleUserMutation.mutate({
      userId: user.id,
      isActive: !user.isActive
    });
  };

  return (
    <ProtectedRoute permission={AuthPermissions.PERMISSIONS.MANAGE_USERS}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Gestión de Usuarios"
            description="Administrar usuarios del sistema, roles y permisos"
          />
          <SimpleLogoutButton />
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Usuarios del Sistema
              </CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  </DialogHeader>
                  <SimpleUserForm
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="flex items-center space-x-2 mb-6">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios por nombre, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="text-center py-8">Cargando usuarios...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">Error cargando usuarios</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role.name === 'super_admin' ? 'destructive' : 'secondary'}>
                          {user.role.displayName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.serviceName || (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          new Date(user.lastLogin).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUser(user)}
                          >
                            {user.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.role.name === 'super_admin'} // No eliminar super admin
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron usuarios
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <SimpleUserForm
                user={selectedUser}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                  queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
