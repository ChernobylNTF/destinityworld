'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';

const InfoPage = () => {
  const { data: session } = useSession();

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
        <TopBar
          title="Novedades"
          endAdornment={
            session?.user && (
              <div className="flex items-center gap-2 pr-2">
                <p className="text-sm font-semibold capitalize text-white">
                  {session.user.username}
                </p>
                <Marble src={session.user.profilePictureUrl} className="w-8 h-8 rounded-full" />
              </div>
            )
          }
        />
      </Page.Header>
      <Page.Main className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-center">Información</h1>
          
          <div className="p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg space-y-4 text-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Bienvenido a Destinity</h2>
              <p>Inicia sesión todos los días y acumula tokens CHRN. La fecha del lanzamiento oficial del token DWD estará disponible muy pronto. ¡Podrás cambiar tus CHRN por DWD!</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">🚀 AIRDROP</h2>
              <p>Prepárate para recibir nuestro Airdrop. Completa tareas y síguenos en nuestras redes para no perderte nada.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Redes Sociales</h2>
              <div className="flex items-center gap-4 mt-2">
                <a 
                  href="https://t.me/+Q6FBHtiGMdU1N2Zh" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Telegram
                </a>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Twitter
                </a>
              </div> 
            </div>
         </div>       
        </div>
      </Page.Main>
    </Page>
  );
};

export default InfoPage;
