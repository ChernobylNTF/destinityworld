'use client';
import { CircularIcon, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckCircleSolid } from 'iconoir-react';
import { useSession } from 'next-auth/react';

/**
 * Muestra la información del usuario, incluyendo la racha desde la sesión.
 */
export const UserInfo = () => {
  // Obtenemos el objeto de la sesión del usuario
  const session = useSession();

  // Lee el valor de la racha desde la sesión. Si no existe, usa 0 por defecto.
  const userStreak = session?.data?.user?.streak ?? 0;

  return (
    <div className="flex flex-row items-center justify-start gap-4 rounded-m w-full p-4 text-white">
      <Marble src={session?.data?.user?.profilePictureUrl} className="w-4" />
      
      <div className="flex flex-col">
        <div className="flex flex-row items-center justify-center">
          <span className="text-m font-semibold capitalize text-white">
            {session?.data?.user?.username || 'Username'}
          </span>
          {session?.data?.user?.profilePictureUrl && (
            <CircularIcon size="sm" className="ml-0">
              <CheckCircleSolid className="text-blue-600" />
            </CircularIcon>
          )}
        </div>
        
        {/* La racha ahora se toma dinámicamente */}
        <div className="flex items-center gap-1 mt-1 text-orange-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45.385c-.345.675-.5 1.425-.5 2.182V11a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 00-1-1h-1V6.354c.345-.31.695-.621 1.04-1.002 1.134-1.25.99-2.867-.31-3.995a1 1 0 00-1.45-.385z" clipRule="evenodd" />
            <path d="M6.354 11.354a1 1 0 010-1.414L9.282 7a1 1 0 011.415 0l2.828 2.828a1 1 0 010 1.415L9.999 15.282a1 1 0 01-1.414 0L6.354 11.354z" />
          </svg>
          <p className="text-sm font-semibold">{userStreak} días de racha</p>
        </div>
      </div>
    </div>
  );
};
