'use client';
import { walletAuth } from '@/auth/wallet'; // Esta es la función que también modificamos
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useState } from 'react';
import clsx from 'clsx';

// 1. Añadimos `onConnectSuccess` a las props que recibe el componente.
export const AuthButton = ({ children, className, onConnectSuccess, ...props }) => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      // 2. Pasamos la función `onConnectSuccess` directamente a `walletAuth`.
      await walletAuth(onConnectSuccess);
    } catch (error) {
      console.error('Wallet authentication button error', error);
    } finally {
      setIsPending(false);
    }
    // 3. Añadimos `onConnectSuccess` a las dependencias del `useCallback`.
  }, [isInstalled, isPending, onConnectSuccess]);

  return (
    <Button
      onClick={onClick}
      disabled={isPending || !isInstalled}
      className={clsx("w-full", className)}
      {...props}
    >
      {children || (isPending ? 'Iniciando...' : 'Iniciar Sesión')}
    </Button>
  );
};
