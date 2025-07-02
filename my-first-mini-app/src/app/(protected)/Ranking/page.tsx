'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

type RankedUser = {
  username: string | null;
  profilePictureUrl: string | null;
  streak: number;
};

export default function RankingPage() {
  const { data: session } = useSession();
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
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
        container: 'bg-yellow-400/20 border-yellow-300/30',
        text: 'text-yellow-200',
        position: 'text-yellow-300',
        streakText: 'text-yellow-400',
      };
    }
    if (position === 2) {
      return {
        container: 'bg-slate-300/20 border-slate-200/30',
        text: 'text-slate-200',
        position: 'text-slate-300',
        streakText: 'text-slate-400',
      };
    }
    if (position === 3) {
      return {
        container: 'bg-orange-500/20 border-orange-400/30',
        text: 'text-orange-200',
        position: 'text-orange-300',
        streakText: 'text-orange-400',
      };
    }
    // Estilo por defecto con transparencia
    return {
      container: 'bg-black/20 border-white/10 hover:bg-white/25',
      text: 'text-white',
      position: 'text-gray-400',
      streakText: 'text-orange-400',
    };
  };

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
        <TopBar
          title="Ranking"
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
      <Page.Main className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
            🏆 Ranking de Rachas 🏆
          </h1>

          {isLoading && <div className="text-center text-gray-400">Cargando clasificación...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}

          {!isLoading && !error && (
            <div className="space-y-2">
              {ranking.map((user, index) => {
                const position = index + 1;
                const classes = getRankingClasses(index);
                return (
                  <div 
                    key={index} 
                    className={clsx(
                      "flex items-center p-2 rounded-lg shadow-lg border backdrop-blur-lg transition-transform duration-200 ease-in-out hover:scale-105",
                      classes.container
                    )}
                  >
                    <span className={clsx("text-lg font-bold w-10 text-center", classes.position)}>
                      {position}
                    </span>
                    <div className="w-10 h-10 mx-2">
                      <Marble src={user.profilePictureUrl || 'https://placehold.co/40x40/FFFFFF/000000?text=U'} />
                    </div>
                    <div className="flex-grow">
                      <p className={clsx("font-semibold text-base", classes.text)}>{user.username || 'Usuario Anónimo'}</p>
                    </div>
                    <div className={clsx("flex items-center font-bold", classes.streakText)}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45.385c-.345.675-.5 1.425-.5 2.182V11a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 00-1-1h-1V6.354c.345-.31.695-.621 1.04-1.002 1.134-1.25.99-2.867-.31-3.995a1 1 0 00-1.45-.385z" clipRule="evenodd" />
                        <path d="M6.354 11.354a1 1 0 010-1.414L9.282 7a1 1 0 011.415 0l2.828 2.828a1 1 0 010 1.415L9.999 15.282a1 1 0 01-1.414 0L6.354 11.354z" />
                      </svg>
                      <span className="text-lg">{user.streak}</span>
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
