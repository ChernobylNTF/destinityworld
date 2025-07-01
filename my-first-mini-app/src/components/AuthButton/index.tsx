'use client';
import { walletAuth } from '@/auth/wallet';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
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
      return;
    }
    // No es necesario setIsPending(false) aquí, porque la página cambiará de estado al loguearse.
    // Pero no hace daño dejarlo por si el login no causa un re-renderizado completo.
    setIsPending(false);
  }, [isInstalled, isPending]);

  // EL useEffect HA SIDO ELIMINADO

  return (
    <LiveFeedback
      label={{
        failed: 'Failed to login',
        pending: 'Logging in',
        success: 'Logged in',
      }}
      state={isPending ? 'pending' : undefined}
    >
      <Button
        onClick={onClick}
        disabled={isPending || !isInstalled} // <- Buena idea deshabilitarlo si no está instalado
        size="lg"
        variant="primary"
      >
        Login with Wallet
      </Button>
    </LiveFeedback>
  );
};
