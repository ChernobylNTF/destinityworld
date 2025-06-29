'use client';

import { Page } from '@/components/PageLayout';
import { UserInfo } from '@/components/UserInfo';
import { useState, useEffect } from 'react';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';
import clsx from 'clsx';

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
  }, []);

  const getRankingClasses = (index: number) => {
    const position = index + 1;
    if (position === 1) {
      return {
        container: 'bg-gradient-to-r from-yellow-500 to-amber-300 border-yellow-400',
        text: 'text-black',
        position: 'text-amber-800',
        streakText: 'text-yellow-900',
      };
    }
    if (position === 2) {
      return {
        container: 'bg-gradient-to-r from-slate-400 to-slate-200 border-slate-300',
        text: 'text-black',
        position: 'text-slate-600',
        streakText: 'text-slate-800',
      };
    }
    if (position === 3) {
      return {
        container: 'bg-gradient-to-r from-orange-400 to-yellow-500 border-orange-500',
        text: 'text-black',
        position: 'text-orange-800',
        streakText: 'text-orange-900',
      };
    }
    // Estilo por defecto para el resto
    return {
      container: 'bg-gray-800 hover:bg-gray-700 border-gray-700',
      text: 'text-white',
      position: 'text-gray-400',
      streakText: 'text-orange-400',
    };
  };

  return (
    <Page>
      <Page.Header className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <UserInfo />
      </Page.Header>
      <Page.Main className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
            🏆 Ranking de Rachas 🏆
          </h1>

          {isLoading && <div className="text-center text-gray-400">Cargando clasificación...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}

          {!isLoading && !error && (
            <div className="space-y-3">
              {ranking.map((user, index) => {
                const position = index + 1; // <--- LÍNEA AÑADIDA
                const classes = getRankingClasses(index);
                return (
                  <div 
                    key={index} 
                    className={clsx(
                      "flex items-center p-3 rounded-lg shadow-lg border transition-transform duration-300 ease-in-out hover:scale-105",
                      classes.container
                    )}
                  >
                    <span className={clsx("text-xl font-bold w-12 text-center", classes.position)}>
                      {position}
                    </span>
                    <div className="w-12 h-12 mx-4">
                      <Marble src={user.profilePictureUrl} />
                    </div>
                    <div className="flex-grow">
                      <p className={clsx("font-semibold text-lg", classes.text)}>{user.username || 'Usuario Anónimo'}</p>
                    </div>
                    <div className={clsx("flex items-center", classes.streakText)}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45.385c-.345.675-.5 1.425-.5 2.182V11a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 00-1-1h-1V6.354c.345-.31.695-.621 1.04-1.002 1.134-1.25.99-2.867-.31-3.995a1 1 0 00-1.45-.385z" clipRule="evenodd" />
                        <path d="M6.354 11.354a1 1 0 010-1.414L9.282 7a1 1 0 011.415 0l2.828 2.828a1 1 0 010 1.415L9.999 15.282a1 1 0 01-1.414 0L6.354 11.354z" />
                      </svg>
                      <span className="text-xl font-bold">{user.streak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Page.Main>
    </Page>
  );
}
