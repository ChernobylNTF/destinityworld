"use client";

import Navigation from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { MiniKit, Permission } from '@worldcoin/minikit-js';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  // useEffect para obtener los permisos de Worldcoin
  useEffect(() => {
    // Esta función se ejecuta solo si el usuario está autenticado
    if (status === "authenticated") {
      const obtenerPermisos = async () => {
        try {
          const payload = await MiniKit.commandsAsync.getPermissions();
          console.log("Permisos obtenidos en TabsLayout:", payload.permissions);
          // Aquí puedes guardar o manejar los permisos si es necesario
        } catch (error) {
          console.error("Error al obtener los permisos en TabsLayout:", error);
        }
      };

      obtenerPermisos();
    }
  }, [status]); // Se ejecuta cuando el estado de la sesión cambia

  // useEffect para manejar la redirección
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/'); // Redirige al inicio si no está logueado
    }
  }, [status, router]);

  // Muestra un estado de carga mientras se verifica la sesión
  if (status === "loading") {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">Cargando...</div>;
  }

  // Si está autenticado, muestra la página
  if (status === "authenticated") {
    return (
      <Page className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        {children}
        <Page.Footer className="px-0 fixed bottom-0 w-full bg-gray-900 z-30">
          <Navigation />
        </Page.Footer>
      </Page>
    );
  }

  // Mientras no esté autenticado (y antes de redirigir), no muestra nada
  return null;
}
