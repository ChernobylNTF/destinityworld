import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Importamos los Providers que necesitamos
import { SessionProvider } from 'next-auth/react';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Destinity World App',
  description: 'Tu Mini App en Worldcoin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Envolvemos toda la aplicación en los providers necesarios */}
      <SessionProvider>
        <MiniKitProvider>
          <body className={inter.className}>{children}</body>
        </MiniKitProvider>
      </SessionProvider>
    </html>
  );
}
