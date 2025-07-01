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
    // El contenedor sigue sirviendo para centrar todo en la pantalla
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <Button
        onClick={onClick}
        disabled={isPending || !isInstalled}
        size="lg"
        variant="primary"
        // Clases para un botón de tamaño compacto
        className="text-lg px-8 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
      >
        {isPending ? 'Iniciando...' : 'Iniciar Sesión'}
      </Button>
    </div>
  );
};
