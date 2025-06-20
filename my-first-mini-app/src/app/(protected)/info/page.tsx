'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { auth } from '@/auth'; // Importar auth para obtener la sesión
import { useSession } from 'next-auth/react';

const InfoPage = () => {
  const { data: session } = useSession();

  return (
    <>
      <Page.Header className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <TopBar
          title="Info"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <div className="grid w-full gap-4">
          <p className="text-lg font-semibold">Información de la Aplicación</p>
          <div className="p-4 border border-gray-700 rounded-lg">
            <p>Bienvenido a Destinity World.</p>
            <p>Aquí encontrarás información relevante sobre la aplicación.</p>
            <br />
            <p>
              <strong>Proyecto:</strong> Destinity World Mini App
            </p>
            <p>
              <strong>Tecnología:</strong> Next.js, React, Worldcoin Minikit, Three.js
            </p>
            <p>
              <strong>Blockchain:</strong> Worldchain (Sepolia Testnet)
            </p>
            {/* Puedes añadir más información aquí */}
          </div>
        </div>
      </Page.Main>
    </>
  );
};

export default InfoPage;
