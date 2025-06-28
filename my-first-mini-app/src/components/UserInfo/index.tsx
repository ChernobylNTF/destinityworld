'use client';
import { useState } from 'react';
import { CircularIcon, Marble } from '@worldcoin/mini-apps-ui-kit-react';
// 1. Importar el ícono de LogOut y la función signOut
import { CheckCircleSolid, LogOut } from 'iconoir-react';
import { useSession, signOut } from 'next-auth/react';

export const UserInfo = () => {
  const [isCopied, setIsCopied] = useState(false);
  const { data: sessionData } = useSession(); // Renombramos a sessionData para mayor claridad

  // Obtenemos los datos de la sesión con valores por defecto
  const userStreak = sessionData?.user?.streak ?? 0;
  const walletAddress = sessionData?.user?.walletAddress;
  const profilePictureUrl = sessionData?.user?.profilePictureUrl;
  const username = sessionData?.user?.username || 'Username';

  // Función para acortar la dirección
  const formatAddress = (address: string | undefined) => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Función para copiar la dirección
  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-row items-center justify-start gap-4 rounded-m w-full p-4 text-white">
      <Marble src={profilePictureUrl} className="w-10 h-10" />
      
      <div className="flex flex-col flex-grow">
        {/* Nombre de usuario y verificación */}
        <div className="flex flex-row items-center">
          <span className="text-m font-semibold capitalize text-white">
            {username}
          </span>
          {profilePictureUrl && (
            <CircularIcon size="sm" className="ml-1">
              <CheckCircleSolid className="text-blue-600" />
            </CircularIcon>
          )}
        </div>

        {/* Sección de Billetera */}
        {walletAddress && (
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-gray-400" title={walletAddress}>
              {formatAddress(walletAddress)}
            </span>
            <button onClick={handleCopy} title="Copiar dirección" className="text-gray-400 hover:text-white transition-colors">
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              )}
            </button>
          </div>
        )}
        
        {/* Sección de Racha */}
        <div className="flex items-center gap-1 mt-1 text-orange-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M12.395 2.553a1 1 0 00-1.45.385c-.345.675-.5 1.425-.5 2.182V11a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 00-1-1h-1V6.354c.345-.31.695-.621 1.04-1.002 1.134-1.25.99-2.867-.31-3.995a1 1 0 00-1.45-.385z" /><path d="M6.354 11.354a1 1 0 010-1.414L9.282 7a1 1 0 011.415 0l2.828 2.828a1 1 0 010 1.415L9.999 15.282a1 1 0 01-1.414 0L6.354 11.354z" /></svg>
          <p className="text-sm font-semibold">{userStreak} días de racha</p>
        </div>
      </div>

      {/* 2. Botón para cerrar sesión */}
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        title="Cerrar sesión"
        className="ml-auto p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <LogOut className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
      </button>
    </div>
  );
};
