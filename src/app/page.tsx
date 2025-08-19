
"use client"; // Necesario para useState y useEffect

import Link from 'next/link';
import PageHeader from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsersRound, BriefcaseMedical, CalendarDays, LineChart, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import React, { useState, useEffect } from 'react'; // Importar useState y useEffect

/**
 * `DashboardPage` es el componente de la página principal o panel de control de la aplicación.
 * Muestra una bienvenida y tarjetas de acceso rápido a las principales funcionalidades
 * de ShiftFlow, como la gestión de servicios, empleados, horarios e informes.
 * También incluye un saludo dinámico basado en la hora del día.
 *
 * Cada tarjeta de funcionalidad incluye:
 * - Una imagen representativa (placeholder por ahora).
 * - Un icono.
 * - Un título y una descripción.
 * - Un botón que enlaza a la sección correspondiente.
 *
 * @returns {JSX.Element} El elemento JSX que representa la página del panel de control.
 */
export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth(); // Get user, isAuthenticated, isLoading from useAuth

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting("¡Buenos días, planificador estrella! ☀️");
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting("¡Buenas tardes! ¿Listo para organizar el día? 📅");
    } else {
      setGreeting("¡Buenas noches! Que la planificación te acompañe. 🌙");
    }
  }, []);

  // Add new useEffect for redirection
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role?.name === 'jefe_servicio') {
      router.replace('/service-management'); // Use replace to prevent going back to dashboard
    }
  }, [isLoading, isAuthenticated, user, router]); // Dependencies for the effect


  /**
   * Array de objetos que define las características principales accesibles desde el dashboard.
   * Cada objeto contiene título, descripción, icono, enlace, imagen y una pista para IA (data-ai-hint).
   */
  const features = [
    {
      title: 'Administrar Servicios',
      description: 'Define y organiza los servicios del hospital.',
      icon: BriefcaseMedical,
      href: '/services',
      img: 'https://placehold.co/600x400.png',
      aiHint: 'servicios medicos',
      label: 'Servicios'
    },
    {
      title: 'Administrar Empleados',
      description: 'Mantén un registro de todo el personal y sus roles.',
      icon: UsersRound,
      href: '/employees',
      img: 'https://placehold.co/600x400.png',
      aiHint: 'personal hospital',
      label: 'Empleados'
    },
    {
      title: 'Horario de Turnos',
      description: 'Visualiza y genera horarios de turnos de forma inteligente.',
      icon: CalendarDays,
      href: '/schedule',
      img: 'https://placehold.co/600x400.png',
      aiHint: 'calendario horario',
      label: 'Horario'
    },
    {
      title: 'Informes y Analíticas',
      description: 'Obtén información sobre la utilización del personal y las operaciones.',
      icon: LineChart,
      href: '/reports',
      img: 'https://placehold.co/600x400.png',
      aiHint: 'graficos datos',
      label: 'Informes'
    },
  ];

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Bienvenido al Genio del horario"
        description="Su solución inteligente para la planificación de turnos en hospitales."
      />
      {greeting && (
        <p className="text-lg text-muted-foreground mb-6 -mt-4 text-center md:text-left">
          {greeting}
        </p>
      )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.href} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center mb-3">
                <feature.icon className="h-8 w-8 text-primary mr-3" />
                <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={feature.href}>
                  Ir a {feature.label || feature.title.split(' ')[1]}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
