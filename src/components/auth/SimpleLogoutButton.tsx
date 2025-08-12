'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function SimpleLogoutButton() {
  const handleLogout = () => {
    console.log('🔄 Botón de logout clickeado');
    
    // Método 1: Usar signOut de NextAuth
    signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    }).then(() => {
      console.log('✅ SignOut completado');
    }).catch((error) => {
      console.error('❌ Error en signOut:', error);
      // Método 2: Fallback manual
      window.location.href = '/auth/signin';
    });
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </Button>
  );
}