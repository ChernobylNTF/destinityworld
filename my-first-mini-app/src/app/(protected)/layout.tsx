import { auth } from '@/auth';
import Navigation from '@/components/Navigation'; // Cambiado a importación por defecto
import { Page } from '@/components/PageLayout';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If the user is not authenticated, redirect to the login page
  if (!session) {
    console.log('Not authenticated, redirecting...');
    redirect('/');
  }

  return (
    <SessionProvider session={session}>
    <Page className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Aquí van los children (las páginas como Home, Wallet, Info) */}
      {children}
      {/* La navegación va en el footer */}
      <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50">
        <Navigation />
      </Page.Footer>
    </Page>
  </SessionProvider>
  );
}
