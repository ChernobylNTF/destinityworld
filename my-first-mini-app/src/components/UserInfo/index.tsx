'use client';
import { CircularIcon, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckCircleSolid } from 'iconoir-react';
import { useSession } from 'next-auth/react';

/**
 * Minikit is only available on client side. Thus user info needs to be rendered on client side.
 * UserInfo component displays user information including profile picture, username, and verification status.
 * It uses the Marble component from the mini-apps-ui-kit-react library to display the profile picture.
 * The component is client-side rendered.
 */
export const UserInfo = () => {
  // Fetching the user state client side
  const session = useSession();

  return (
    <div className="flex flex-row items-center justify-start gap-4 rounded-m w-full p-4 text-white"> {/* Removed background and border classes, kept padding and rounded corners, ensured text is white */}
      <Marble src={session?.data?.user?.profilePictureUrl?.Racha} className="w-4" />
      <div className="flex flex-row items-center justify-center">
        <span className="text-m font-semibold capitalize text-white"> {/* Ensured text is white */}
          {session?.data?.user?.username}
        </span>
        {session?.data?.user?.profilePictureUrl && (
          <CircularIcon size="sm" className="ml-0">
            <CheckCircleSolid className="text-blue-600" />
          </CircularIcon>
        )}
      </div>
    </div>
  );
};
