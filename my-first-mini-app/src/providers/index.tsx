// src/providers/index.tsx
'use client'; // Este SÍ es un Client Component
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react'; // Importado correctamente
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const ErudaProvider = dynamic(
  () => import('@/providers/Eruda').then((c) => c.ErudaProvider),
  { ssr: false },
);

interface ClientProvidersProps {
  children: ReactNode;
  session: Session | null; // La sesión se pasa desde el layout raíz
}

export default function ClientProviders({
  children,
  session,
}: ClientProvidersProps) {
  return (
    <ErudaProvider>
      {/* SessionProvider es crucial aquí para que useSession() funcione en los componentes cliente */}
      <SessionProvider session={session}>
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </SessionProvider>
    </ErudaProvider>
  );
}
