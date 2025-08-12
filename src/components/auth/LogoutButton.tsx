'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function LogoutButton({ 
  variant = 'outline', 
  size = 'default',
  showIcon = true,
  children 
}: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      console.log('🔄 Iniciando logout...');
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Fallback: redirigir manualmente
      window.location.href = '/auth/signin';
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {children || 'Cerrar Sesión'}
    </Button>
  );
}