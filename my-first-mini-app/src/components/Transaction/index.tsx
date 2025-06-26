'use client';

import WorldIdClaimTokenABI from '@/abi/WorldIdClaimToken.json';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

export const Transaction = () => {
  // Dirección de tu contrato desplegado
  const myContractToken = '0x14c8e69DfBD6210f9e9fF9838CA2fD83D00D39a0';

  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);
  const [whichButton, setWhichButton] = useState<'getToken' | 'usePermit2'>(
    'getToken',
  );
  const [transactionId, setTransactionId] = useState<string>('');

  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-sepolia.g.alchemy.com/public'),
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
    error,
  } = useWaitForTransactionReceipt({
    client: client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_WLD_CLIENT_ID as `app_${string}`,
    },
    transactionId: transactionId,
  });

  // Efecto para manejar el resultado de la transacción una vez que se completa
  useEffect(() => {
    if (transactionId && !isConfirming) {
      if (isConfirmed) {
        console.log('Transaction confirmed!');
        setButtonState('success');
      } else if (isError) {
        console.error('Transaction failed:', error);
        setButtonState('failed');
      }
      // Resetear el estado del botón después de 3 segundos
      setTimeout(() => {
        setButtonState(undefined);
      }, 3000);
    }
  }, [isConfirmed, isConfirming, isError, error, transactionId]);

  /**
   * CORREGIDO: Lógica para verificar y reclamar el token.
   * Se ha reestructurado para manejar todos los casos de éxito y error correctamente.
   */
  const onClickGetToken = async () => {
    setTransactionId(''); // Limpiar la ID de transacción anterior
    setWhichButton('getToken');
    setButtonState('pending');

    try {
      // 1. OBTENER USUARIO Y SU DIRECCIÓN DE FORMA SEGURA
      const user = await MiniKit.getUser();
      if (!user?.walletAddress) {
        throw new Error('No se pudo obtener la dirección del usuario. Asegúrate de haber iniciado sesión.');
      }

      // 2. VERIFICAR CON WORLD ID
      const verificationResult = await MiniKit.commandsAsync.verification({
        signal: user.walletAddress,
        action: 'claim-dwd-token', // Usa una acción única y descriptiva
      });

      if (verificationResult.status !== 'success') {
        throw new Error('La verificación con World ID falló o fue cancelada.');
      }

      // 3. SI LA VERIFICACIÓN ES EXITOSA, PREPARAR Y ENVIAR LA TRANSACCIÓN
      const { root, nullifier_hash, proof } = verificationResult.proof_payload;
      const unpackedProof = MiniKit.utils.unpackEncodedProof(proof);

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: myContractToken,
            abi: WorldIdClaimTokenABI,
            functionName: 'claimTokens',
            args: [root, nullifier_hash, unpackedProof],
          },
        ],
      });

      if (finalPayload.status !== 'success') {
        throw new Error(`La sumisión de la transacción falló: ${finalPayload.status}`);
      }
      
      console.log('Transacción enviada, esperando confirmación:', finalPayload.transaction_id);
      setTransactionId(finalPayload.transaction_id);

    } catch (err: any) {
      // 4. MANEJO CENTRALIZADO DE ERRORES
      console.error('Ocurrió un error en el proceso de reclamación:', err.message);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  /**
   * Lógica para usar Permit2.
   * NOTA: Esta función requiere que el usuario ya tenga tokens.
   */
  const onClickUsePermit2 = async () => {
    setTransactionId('');
    setWhichButton('usePermit2');
    setButtonState('pending');

    try {
      const user = await MiniKit.getUser();
       if (!user?.walletAddress) {
        throw new Error('No se pudo obtener la dirección del usuario.');
      }

      const permitTransfer = {
        permitted: {
          token: myContractToken,
          amount: (0.5 * 10 ** 18).toString(),
        },
        nonce: Date.now().toString(),
        deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(),
      };

      const transferDetails = {
        to: user.walletAddress, // Transferir a uno mismo como ejemplo
        requestedAmount: (0.5 * 10 ** 18).toString(),
      };

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: myContractToken,
            abi: WorldIdClaimTokenABI,
            functionName: 'signatureTransfer',
            args: [
              {
                permitted: {
                  token: permitTransfer.permitted.token,
                  amount: permitTransfer.permitted.amount,
                },
                nonce: permitTransfer.nonce,
                deadline: permitTransfer.deadline,
              },
              {
                to: transferDetails.to,
                requestedAmount: transferDetails.requestedAmount,
              },
              user.walletAddress, // El 'owner' de la firma
              'PERMIT2_SIGNATURE_PLACEHOLDER_0', // El MiniKit reemplazará esto
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: myContractToken,
          },
        ],
      });

      if (finalPayload.status !== 'success') {
        throw new Error(`La sumisión de la transacción con Permit2 falló: ${finalPayload.status}`);
      }
      
      console.log('Transacción con Permit2 enviada:', finalPayload.transaction_id);
      setTransactionId(finalPayload.transaction_id);

    } catch (err: any) {
      console.error('Error en la transacción con Permit2:', err.message);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Reclamar Token con World ID</p>
      <LiveFeedback
        label={{
          failed: 'Transacción falló',
          pending: 'Confirmando...',
          success: '¡Éxito!',
        }}
        state={whichButton === 'getToken' ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickGetToken}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Reclamar Token
        </Button>
      </LiveFeedback>
      <p className="text-lg font-semibold mt-4">Probar Permit2</p>
      <LiveFeedback
        label={{
          failed: 'Transacción falló',
          pending: 'Confirmando...',
          success: '¡Éxito!',
        }}
        state={whichButton === 'usePermit2' ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickUsePermit2}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Gastar Token (con Firma)
        </Button>
      </LiveFeedback>
    </div>
  );
};
