"use client"; // Agrega esta línea al inicio del archivo

import { auth } from '@/auth';
import Navigation from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import React, { useEffect } from 'react';
import { MiniKit, Permission } from '@worldcoin/minikit-js';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = auth();

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

  if (!session) {
    console.log('Not authenticated, redirecting...');
    redirect('/');
  }

  return (
    <SessionProvider session={session}>
      <Page className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        {children}
        <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50">
          <Navigation />
        </Page.Footer>
      </Page>
    </SessionProvider>
  );
}
