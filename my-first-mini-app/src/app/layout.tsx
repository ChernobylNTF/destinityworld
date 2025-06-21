'use client';

import ClientProviders from '@/providers'; // Asegúrate de que ClientProviders envuelva SessionProvider
// ¡IMPORTANTE! La importación de auth DEBE estar aquí para obtener la sesión
import { auth } from '@/auth';
import '@worldcoin/mini-apps-ui-kit-react/styles.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

// Definición de fuentes (pueden estar aquí o en un archivo metadata.tsx separado)
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Exportamos metadata
export const metadata: Metadata = {
  title: 'Destinity World',
  description: 'DWD',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtenemos la sesión aquí, en el Server Component del layout raíz
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        {/* ClientProviders recibe la sesión y la pasa a SessionProvider */}
        {/* Esto asegura que la sesión esté disponible para todos los componentes cliente */}
        <ClientProviders session={session}>
          {children} {/* Aquí se renderizará app/page.tsx */}
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
