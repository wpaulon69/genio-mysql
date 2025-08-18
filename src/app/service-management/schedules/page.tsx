"use client";

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UnifiedScheduleManager from '@/components/schedule/UnifiedScheduleManager';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import { PERMISSIONS } from '@/lib/auth/permissions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ServiceSchedulesPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.MANAGE_SERVICE_SCHEDULES}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/service-management">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Mi Servicio
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Horarios de Mi Servicio</h1>
              <p className="text-muted-foreground">Gestiona los horarios de tu servicio</p>
            </div>
          </div>
          <SimpleLogoutButton />
        </div>
        
        <UnifiedScheduleManager 
          title="Gestión de Horarios"
          description="Visualiza y gestiona los horarios de tu servicio"
        />
      </div>
    </ProtectedRoute>
  );
}