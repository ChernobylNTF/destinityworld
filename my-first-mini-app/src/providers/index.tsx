'use client';

import { Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { AuthButton } from '@/components/AuthButton'; // Asegúrate que la ruta sea correcta
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import dynamic from 'next/dynamic';

const ErudaProvider = dynamic(
  () => import('@/providers/Eruda').then((c) => c.ErudaProvider),
  { ssr: false },
);

// --- Componente Interno que Maneja la Lógica ---
function AuthWrapper({ children }: { children: ReactNode }) {
  // Obtenemos el estado de la sesión EN VIVO en el cliente
  const { status } = useSession();

  // 1. Mientras se verifica la sesión, mostramos un mensaje de carga
  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Cargando...</div>;
  }

  // 2. Si el usuario NO está autenticado, mostramos el botón de login
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <AuthButton />
      </div>
    );
  }

  // 3. Si el usuario SÍ está autenticado, mostramos la aplicación
  return <>{children}</>;
}


// --- Componente Principal ---
interface ClientProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <ErudaProvider>
      <MiniKitProvider>
        {/* SessionProvider envuelve todo para dar el contexto */}
        <SessionProvider session={session}>
          {/* AuthWrapper contiene la lógica para decidir qué mostrar */}
          <AuthWrapper>{children}</AuthWrapper>
        </SessionProvider>
      </MiniKitProvider>
    </ErudaProvider>
  );
}
