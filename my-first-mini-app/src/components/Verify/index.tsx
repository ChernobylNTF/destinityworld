'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useState } from 'react';

// --- Definimos los tipos que el componente padre (Home) espera recibir ---
interface ProofPayload {
  root: `0x${string}`;
  nullifier_hash: `0x${string}`;
  proof: `0x${string}`;
}

interface VerificationResult {
  status: 'success' | 'failed' | 'cancelled';
  proof_payload?: ProofPayload;
}

// --- El componente ahora espera una función onSuccess que acepta el resultado ---
export const Verify = ({ onSuccess }: { onSuccess: (result: VerificationResult) => void }) => {
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  const onClickVerify = async () => {
    setButtonState('pending');

    try {
      // 1. Iniciar la verificación.
      const result = await MiniKit.commandsAsync.verification({
        action: 'claim-dwd-token',
        signal: (await MiniKit.getUser()).walletAddress,
        verification_level: VerificationLevel.Orb,
      });

      // 2. ¡LÍNEA CLAVE! Pasamos el resultado completo al componente padre.
      onSuccess(result);

      // 3. Actualizamos el estado del botón localmente si fue exitoso.
      if (result.status === 'success') {
        setButtonState('success');
      } else {
        setButtonState('failed');
        setTimeout(() => setButtonState(undefined), 3000);
      }

    } catch (error) {
      console.error("Error durante la verificación:", error);
      setButtonState('failed');
      // Informamos al padre que la verificación falló.
      onSuccess({ status: 'failed' }); 
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  return (
    <div className="grid w-full gap-2">
      <p className="text-center text-gray-400">Debes verificarte para poder reclamar.</p>
      <LiveFeedback
        label={{
          failed: 'Verificación Falló',
          pending: 'Verificando en World App...',
          success: '¡Verificado!',
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={onClickVerify}
          disabled={buttonState === 'pending' || buttonState === 'success'}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Verificar con World ID
        </Button>
      </LiveFeedback>
    </div>
  );
};
