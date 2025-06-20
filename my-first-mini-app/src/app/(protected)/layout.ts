'use client';

import { auth } from '@/auth';
import Navigation from '@/components/Navigation'; // Importación por defecto
import { Page } from '@/components/PageLayout';
import { redirect } from 'next/navigation';

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Si el usuario no está autenticado, redirigir a la página de inicio
  if (!session) {
    console.log('Not authenticated');
    // La redirección se maneja mejor en el lado del cliente si es necesario,
    // pero para este layout protegido, es mejor asegurarse de que el contenido solo se renderice si hay sesión.
    // O, como se hacía antes, podrías redirigir:
    // redirect('/');
    // Sin embargo, para permitir que la página de inicio maneje la autenticación, es mejor dejar que el componente de la página principal decida.
  }

  return (
    <Page>
      {/* Navigation ahora está en el footer */}
      {children}
      <Page.Footer className="px-0 fixed bottom-0 w-full bg-white">
        <Navigation />
      </Page.Footer>
    </Page>
  );
}
