// src/app/layout.tsx
'use client'; // Next.js 13+ App Router requiere 'use client' en el layout si usa hooks de cliente

import { auth } from '@/auth'; // Importar auth para obtener la sesión en server component
import ClientProviders from '@/providers'; // Asegúrate de que ClientProviders maneje el SessionProvider
import '@worldcoin/mini-apps-ui-kit-react/styles.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Destinity World',
  description: 'DWD',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); // Obtener la sesión en el server component

  return (
    <html lang="en">
      {/* Aplicar las fuentes globales al body */}
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        {/* ClientProviders debería encargarse de envolver todo con SessionProvider y ErudaProvider */}
        {/* Pasamos la sesión obtenida en el server component al cliente */}
        <ClientProviders session={session}>
          {children} {/* Aquí se renderizarán las páginas, incluyendo app/page.tsx */}
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
