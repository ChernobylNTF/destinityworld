"use client";

import Navigation from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { redirect } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react'; // Importa useSession
import React, { useEffect } from 'react';
import { MiniKit, Permission } from '@worldcoin/minikit-js';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession(); // Utiliza el hook useSession

  useEffect(() => {
    const obtenerPermisos = async () => {
      try {
        const payload = await MiniKit.commandsAsync.getPermissions();
        console.log("Permisos obtenidos:", payload.permissions);
        const tieneNotificaciones = payload.permissions.some(permiso => permiso === Permission.Notifications);
        const tieneMicrofono = payload.permissions.some(permiso => permiso === Permission.Microphone);
        if (!tieneNotificaciones) {
          console.warn("Permiso de notificaciones no concedido.");
        }
        if (!tieneMicrofono) {
          console.warn("Permiso de micrófono no concedido.");
        }
      } catch (error) {
        console.error("Error al obtener los permisos:", error);
      }
    };

    obtenerPermisos();
  }, []);

  if (status === "loading") {
    return <div>Cargando sesión...</div>; // O un componente de carga
  }

  if (status === "unauthenticated") {
    console.log('No autenticado, redirigiendo...');
    redirect('/');
  }

  return (
    <SessionProvider session={session}> {/* La sesión ya está disponible a través del contexto */}
      <Page className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        {children}
        <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50">
          <Navigation />
        </Page.Footer>
      </Page>
    </SessionProvider>
  );
}
