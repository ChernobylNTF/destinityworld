import { auth } from '@/auth';
import Navigation from '@/components/Navigation'; // Cambiado a importación por defecto
import { Page } from '@/components/PageLayout';

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If the user is not authenticated, redirect to the login page
  if (!session) {
    console.log('Not authenticated');
    // redirect('/');
  }

  return (
    <Page>
      <Navigation />
      {children}
      <Page.Footer className="px-0 fixed bottom-0 w-full bg-white">

      </Page.Footer>
    </Page>
  );
}
