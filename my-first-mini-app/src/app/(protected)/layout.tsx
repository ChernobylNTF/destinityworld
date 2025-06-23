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
  const session = auth(); // No necesitas el await aquí si auth() ya devuelve la sesión directamente

  useEffect(() => {
    const obtenerPermisos = async () => {
      try {
        const payload = await MiniKit.commandsAsync.getPermissions();
        console.log("Permisos obtenidos:", payload.permissions);
        // Aquí puedes verificar si tienes los permisos necesarios para las funcionalidades de esta sección
        const tieneNotificaciones = payload.permissions.some(permiso => permiso === Permission.Notifications);
        const tieneMicrofono = payload.permissions.some(permiso => permiso === Permission.Microphone);
        // ... realiza las verificaciones necesarias y actualiza el estado o la interfaz de usuario según los permisos
        if (!tieneNotificaciones) {
          console.warn("Permiso de notificaciones no concedido.");
          // Podrías mostrar un mensaje al usuario o solicitar el permiso si es necesario
        }
        if (!tieneMicrofono) {
          console.warn("Permiso de micrófono no concedido.");
        }
      } catch (error) {
        console.error("Error al obtener los permisos:", error);
      }
    };

    obtenerPermisos();
  }, []); // Se ejecuta solo una vez al montar el componente

  // If the user is not authenticated, redirect to the login page
  if (!session) {
    console.log('Not authenticated, redirecting...');
    redirect('/');
  }

  return (
    <SessionProvider session={session}>
      <Page className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        {/* Aquí van los children (las páginas como Home, Wallet, Info) */}
        {children}
        {/* La navegación va en el footer */}
        <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50">
          <Navigation />
        </Page.Footer>
      </Page>
    </SessionProvider>
  );
}
