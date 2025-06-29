'use client';

import { Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { AuthButton } from '@/components/AuthButton'; 
import { MiniKitProvider } from '@/providers/MiniKitProvider'; // O la ruta correcta a tu MiniKitProvider

// Componente Interno que decide qué mostrar
function AuthWrapper({ children }: { children: ReactNode }) {
  const { status } = useSession();

  // Muestra un estado de carga para evitar parpadeos
  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Cargando...</div>;
  }

  // Muestra el botón de login si el usuario NO está autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <AuthButton />
      </div>
    );
  }

  // Solo si está autenticado, muestra el contenido de la página
  return <>{children}</>;
}

interface ClientProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <SessionProvider session={session}>
      <MiniKitProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </MiniKitProvider>
    </SessionProvider>
  );
}
