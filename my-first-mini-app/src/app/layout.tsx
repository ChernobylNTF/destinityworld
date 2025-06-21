// src/app/layout.tsx
// ¡Este DEBE SER un Server Component! NO DEBE TENER 'use client'; al principio.

import ClientProviders from '@/providers'; // ClientProviders envuelve SessionProvider y MiniKitProvider
import '@worldcoin/mini-apps-ui-kit-react/styles.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Fuentes
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

// Definición de fuentes
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Exportamos metadata desde aquí
export const metadata: Metadata = {
  title: 'Destinity World',
  description: 'DWD',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtenemos la sesión aquí, en el Server Component del layout raíz.
  // Esto es fundamental para que la sesión esté disponible globalmente.
  const session = await auth();

  return (
    <html lang="en">
      {/* Aplicamos las fuentes globales al body */}
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        {/* ClientProviders recibe la sesión y la pasa a SessionProvider */}
        {/* Asegura que SessionProvider esté disponible para todos los componentes cliente */}
        <ClientProviders session={session}>
          {children} {/* Aquí se renderizarán las páginas, como app/page.tsx */}
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
