'use client';

import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { Verify } from '../components/Verify';
import { UserInfo } from '../components/UserInfo'; // Importar UserInfo
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MiniKit } from '@worldcoin/minikit-js'; // Importar MiniKit
import { getIsUserVerified } from "@worldcoin/minikit-js"
// Importar el ABI del contrato DWD
import DWDABI from '@/abi/DWD.json';

// Importar el componente de la moneda 3D
import SpinningCoin from '../components/SpinningCoin';

// Dirección del contrato DWD
const contractAddress = '0x55E6C9C22C0eaD68F0be7CdcB5d8BAa636a8A1a0'; // Dirección del contrato DWD

// CID de la moneda 3D en IPFS y nombre del archivo
  const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";// <--- LÍNEA AÑADIDA

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [isVerified, setIsVerified] = useState(false);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);

  // Cargar el último tiempo de reclamo del almacenamiento local al cargar la página
  useEffect(() => {
    const savedClaimTime = localStorage.getItem('lastClaimTime');
    if (savedClaimTime) {
      setLastClaimTime(parseInt(savedClaimTime, 10));
    }
  }, []);

  // Manejar el temporizador
  useEffect(() => {
    if (lastClaimTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastClaimTime;
        const remaining = 24 * 60 * 60 * 1000 - elapsed;

        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [lastClaimTime]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
  };

  const handleClaimTokens = async () => {
    if (!isAuthenticated || !isVerified || claiming || timeLeft > 0) {
      return;
    }

    setClaiming(true);
    try {
      // Usar MiniKit.commandsAsync.sendTransaction para enviar la transacción
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: DWDABI.abi as any, // Usar el ABI del contrato DWD
            functionName: 'claim', // Llamar a la función 'claim'
            args: [], // Asumiendo que la función claim no requiere argumentos
          },
        ],
      });

      if (finalPayload.status === 'success') {
        console.log(
          'Transaction submitted, waiting for confirmation:',
          finalPayload.transaction_id,
        );
        // Opcional: puedes guardar finalPayload.transaction_id para esperar la confirmación

        const now = Date.now();
        setLastClaimTime(now);
        localStorage.setItem('lastClaimTime', now.toString());
        alert('Tokens reclamados con éxito. Espera 24 horas para el próximo reclamo.');
      } else {
        console.error('Transaction submission failed:', finalPayload);
        alert('Error al reclamar tokens. Consulta la consola para más detalles.');
      }

    } catch (error) {
      console.error('Error al reclamar tokens:', error);
      alert('Error al reclamar tokens. Consulta la consola para más detalles.');
    } finally {
      setClaiming(false);
    }
  };

  // Formatear el tiempo restante en HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Page>
      {/* Cambiado className de Page.Main a justify-center y eliminado gap-4 */}
      <Page.Main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">

        {/* Div con el componente UserInfo - En la parte superior */}
        {/* Mover UserInfo fuera del contenedor centrado si queremos que se quede arriba */}

        {/* Contenedor para los elementos inferiores (centrados) - Añadido flex, flex-col, items-center y gap-4 */}
        <div className="flex flex-col items-center gap-4">
           {/* Div con el componente UserInfo - Ahora dentro del contenedor centrado para que suba con los demás */}
          <div className="text-xl">
             <UserInfo />
          </div>
          {/* Componente de la moneda 3D de IPFS */}
          <SpinningCoin ipfsUrl={coinIpfsUrl} />

          {!isAuthenticated && (
            <div className="w-full max-w-sm">
              <AuthButton />
            </div>
          )}

          {isAuthenticated && !isVerified && (
            <div className="w-full max-w-sm">
              <Verify onSuccess={handleVerificationSuccess} />
            </div>
          )}

          {isAuthenticated && isVerified && ( timeLeft <= 0 ? (
            <div className="w-full max-w-sm">
              <Button
                onClick={handleClaimTokens}
                disabled={claiming || timeLeft > 0}
                size="lg"
                variant="primary"
                className="w-full"
              >
                {claiming ? 'Reclamando...' : 'Reclamar Tokens'}
              </Button>
            </div>
          ) : (
             <div className="w-full max-w-sm text-center">
               <p>Próximo reclamo en:</p>
               <p className="text-xl font-bold">{formatTime(timeLeft)}</p>
             </div>
          ))}
        </div>

        {/* Este comentario u otros elementos fuera del nuevo div contenedor quedarían entre los dos grupos. */}
      </Page.Main>
    </Page>
  );
}

// Añadir un tipo para la propiedad onSuccess en el componente Verify
declare module '../components/Verify' {
  export const Verify: ({ onSuccess }: { onSuccess: () => void }) => JSX.Element;
}