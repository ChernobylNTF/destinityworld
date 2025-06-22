'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { auth } from '@/auth'; // Importar auth para obtener la sesión
import { useSession } from 'next-auth/react';

const InfoPage = () => {
  const { data: session } = useSession();

  return (
    <>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <TopBar
          title="Novedades"
          endAdornment={
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-4" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <div className="grid w-full gap-4">
          <p className="text-lg font-semibold">Información de la Aplicación</p>
          <div className="p-4 border border-gray-700 rounded-lg">
            <p>Bienvenido a Destinity.</p>
            <p>Inicia sección todos los dias y acumula token DWD.</p>
            <br />
            <p>
              <strong>AIRDROP:</strong> Preparate para recibir nuestro Airdrop, completa tareas y sigue nuestras redes
            </p>
            <br />
            {/* Puedes añadir más información aquí */}
            <div className="grip w-full gap-4">
              <p>
                <strong>Redes Sociales</strong>
              </p>
              <br />
            <a href="https://t.me/+Q6FBHtiGMdU1N2Zh" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Telegram</a>
               <p></p>
              <br />
            <a href="#" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Twitter</a>
             </div> 
         </div>       
        </div>
      </Page.Main>
    </>
  );
};

export default InfoPage;
