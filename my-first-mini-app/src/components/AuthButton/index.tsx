'use client';
import { walletAuth } from '@/auth/wallet';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useState } from 'react';

export const AuthButton = () => {
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
      setIsPending(false);
    }
  }, [isInstalled, isPending]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
      <Button
        onClick={onClick}
        disabled={isPending || !isInstalled}
        size="lg"
        variant="primary"
        className="w-full text-lg py-3 font-semibold rounded-xl shadow-lg"
      >
        {isPending ? 'Iniciando...' : 'Iniciar Sesión'}
      </Button>
    </div>
  );
};
