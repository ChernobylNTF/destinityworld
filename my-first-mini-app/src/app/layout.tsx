import { auth } from '@/auth';
import ClientProviders from '@/providers';
import { SessionProvider } from "@/providers/session-provider";
import '@worldcoin/mini-apps-ui-kit-react/styles.css';
import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider'; // Importa MiniKitProvider
import { ErudaProvider } from "@/providers/eruda-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Destinity World',
  description: 'DWD',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
            <body className={inter.className}>
             <ErudaProvider>
               <SessionProvider>
	       <SpeedInsights>
                 <ClientProviders session={session}>{children}</ClientProviders>
                 <MiniKitProvider>{children}</MiniKitProvider>
	        </SpeedInsights>
	       </SessionProvider>
            </ErudaProvider>
            </body>
    </html>
  );
}
