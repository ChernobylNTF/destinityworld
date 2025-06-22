'use client';

import { Page } from '@/components/PageLayout';
import { UserInfo } from '@/components/UserInfo';
import { useState, useEffect } from 'react';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';

// Definimos el tipo de dato para un usuario en el ranking
type RankedUser = {
  username: string | null;
  profilePictureUrl: string | null;
  streak: number;
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Función para obtener los datos del ranking desde nuestra API
    const fetchRanking = async () => {
      try {
        const response = await fetch('/api/ranking');
        if (!response.ok) {
          throw new Error('No se pudo cargar la clasificación.');
        }
        const data = await response.json();
        setRanking(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, []); // Se ejecuta solo una vez cuando el componente se monta

  return (
    <Page>
      <Page.Header className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <UserInfo />
      </Page.Header>
      <Page.Main className="p-4 md:p-6 bg-gray-900 text-white">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
            🏆 Ranking de Rachas 🏆
          </h1>

          {/* Estado de Carga */}
          {isLoading && (
            <div className="text-center text-gray-400">Cargando clasificación...</div>
          )}

          {/* Estado de Error */}
          {error && (
            <div className="text-center text-red-500">{error}</div>
          )}

          {/* Tabla de Clasificación */}
          {!isLoading && !error && (
            <div className="space-y-3">
              {ranking.map((user, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-3 bg-gray-800 rounded-lg shadow-md border border-gray-700"
                >
                  <span className="text-xl font-bold w-10 text-center text-gray-400">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 mx-4">
                    <Marble src={user.profilePictureUrl} />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-lg">{user.username || 'Usuario Anónimo'}</p>
                  </div>
                  <div className="flex items-center text-orange-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45.385c-.345.675-.5 1.425-.5 2.182V11a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 00-1-1h-1V6.354c.345-.31.695-.621 1.04-1.002 1.134-1.25.99-2.867-.31-3.995a1 1 0 00-1.45-.385z" clipRule="evenodd" />
                      <path d="M6.354 11.354a1 1 0 010-1.414L9.282 7a1 1 0 011.415 0l2.828 2.828a1 1 0 010 1.415L9.999 15.282a1 1 0 01-1.414 0L6.354 11.354z" />
                    </svg>
                    <span className="text-xl font-bold">{user.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Page.Main>
    </Page>
  );
}
