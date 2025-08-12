'use client';

import { useAuth } from '@/lib/auth/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 p-3 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-destructive">
            Acceso Denegado
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta sección del sistema.
            </p>
            
            {user && (
              <div className="bg-muted p-4 rounded-md text-sm">
                <div className="space-y-1">
                  <p><strong>Usuario:</strong> {user.name}</p>
                  <p><strong>Rol:</strong> {user.role.displayName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Si necesitas acceso a esta funcionalidad, contacta a:
            </p>
            
            <div className="bg-blue-50 p-3 rounded-md text-sm">
              <p className="font-medium text-blue-900">Tu supervisor directo</p>
              <p className="text-blue-700">o</p>
              <p className="font-medium text-blue-900">Administrador del sistema</p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Página Anterior
            </Button>

            <div className="pt-2 border-t">
              <SimpleLogoutButton variant="destructive" />
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>
              Este incidente ha sido registrado por seguridad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}