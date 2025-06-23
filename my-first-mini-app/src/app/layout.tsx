import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider'; 
import { auth } from '@/auth';
import ClientProviders from '@/providers';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SpeedInsights } from "@vercel/speed-insights/next";
// Importa MiniKitProvider

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

export default async function Root({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<MiniKitProvider>
				<body className={inter.className}>{children}</body>
			</MiniKitProvider>
		</html>
		)
}
