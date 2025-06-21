// src/providers/index.tsx
'use client';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react'; // Importa SessionProvider
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const ErudaProvider = dynamic(
  () => import('@/providers/Eruda').then((c) => c.ErudaProvider),
  { ssr: false },
);

interface ClientProvidersProps {
  children: ReactNode;
  session: Session | null; // La sesión obtenida del server component
}

export default function ClientProviders({
  children,
  session,
}: ClientProvidersProps) {
  return (
    <ErudaProvider>
      {/* SessionProvider debe envolver todo lo que necesite acceder a la sesión */}
      <SessionProvider session={session}>
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </SessionProvider>
    </ErudaProvider>
  );
}
