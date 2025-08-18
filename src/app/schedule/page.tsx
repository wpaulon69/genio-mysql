"use client";

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UnifiedScheduleManager from '@/components/schedule/UnifiedScheduleManager';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import { PERMISSIONS } from '@/lib/auth/permissions';

export default function SchedulePage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.VIEW_SERVICE_SCHEDULES}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Horarios</h1>
            <p className="text-muted-foreground">Gestión centralizada de horarios del hospital</p>
          </div>
          <SimpleLogoutButton />
        </div>
        
        <UnifiedScheduleManager 
          title="Gestión de Horarios"
          description="Visualiza y gestiona los horarios de todos los servicios del hospital"
        />
      </div>
    </ProtectedRoute>
  );
}