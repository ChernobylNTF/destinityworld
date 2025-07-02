'use client';
import { walletAuth } from '@/auth/wallet';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useState } from 'react';
import clsx from 'clsx';

export const AuthButton = ({ children, className, ...props }) => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Wallet authentication button error', error);
    } finally {
      setIsPending(false);
    }
  }, [isInstalled, isPending]);

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
