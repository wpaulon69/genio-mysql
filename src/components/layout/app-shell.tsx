
"use client";

import type React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar'; 
import SidebarNav from './sidebar-nav';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from 'next-auth/react';
import { useAuth } from '@/lib/auth/hooks';

/**
 * Props para el componente `AppShell`.
 */
interface AppShellProps {
  /** Los componentes hijos que se renderizarán dentro del área de contenido principal del shell. */
  children: React.ReactNode;
}

/**
 * `AppShell` es el componente principal de la estructura de la aplicación.
 * Proporciona un layout consistente con una barra lateral de navegación (`Sidebar`)
 * y un área de contenido principal donde se renderizan las páginas.
 *
 * Utiliza `SidebarProvider` de `src/components/ui/sidebar` para gestionar el estado
 * de la barra lateral (colapsada/expandida, abierta/cerrada en móviles).
 * El encabezado superior incluye un `SidebarTrigger` para móviles y un menú
 * desplegable para acciones de usuario.
 *
 * @param {AppShellProps} props - Las props del componente.
 * @returns {JSX.Element} El elemento JSX que representa la estructura principal de la aplicación.
 */
export default function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('🔄 Cerrando sesión...');
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // Fallback: redirigir manualmente
      window.location.href = '/auth/signin';
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r">
          <SidebarRail />
          <SidebarHeader className="p-4 flex items-center justify-between">
            <Link href="/" className="font-headline text-2xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              Horarios
            </Link>
             <div className="group-data-[collapsible=icon]:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </div>
            <div className="hidden group-data-[collapsible=icon]:block">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-1 p-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="group-data-[collapsible=icon]:hidden space-y-2">
              {user && (
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium">{user.name}</div>
                  <div>{user.role.displayName}</div>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
              <p className="text-xs text-muted-foreground">&copy; 2024 Horarios</p>
            </div>
            <div className="hidden group-data-[collapsible=icon]:block">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-600 hover:bg-red-50"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Future: Breadcrumbs or page title can go here */}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Avatar Usuario" data-ai-hint="avatar usuario" />
                    <AvatarFallback>SF</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user ? (
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.role.displayName}</div>
                    </div>
                  ) : (
                    'Mi Cuenta'
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
