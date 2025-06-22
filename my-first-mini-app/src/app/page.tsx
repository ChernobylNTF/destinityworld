'use client';

import Navigation from '../components/Navigation';
import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { Verify } from '../components/Verify';
import { UserInfo } from '../components/UserInfo';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

// Importar el componente de la moneda 3D
import SpinningCoin from '../components/SpinningCoin';

// --- LÓGICA DE BLOCKCHAIN ---
import { MiniKit, getIsUserVerified } from "@worldcoin/minikit-js";
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import DWDABI from '@/abi/DWD.json';

// --- Configuración ---
const DWD_CONTRACT_ADDRESS = '0x55E6C9C22C0eaD68F0be7CdcB5d8BAa636a8A1a0';
const WORLDCHAIN_RPC_URL = 'https://worldchain-sepolia.g.alchemy.com/public';
const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const walletAddress = session?.user?.walletAddress;

  const [isVerified, setIsVerified] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');

  // Cliente público (para leer datos de la blockchain).
  const publicClient = useMemo(() => createPublicClient({
    chain: worldchain,
    transport: http(WORLDCHAIN_RPC_URL),
  }), []);

  // Función para leer el estado del reclamo DESDE EL CONTRATO
  const refreshClaimStatus = async () => {
    if (!walletAddress) return;
    try {
      const lastClaim = await publicClient.readContract({
        address: DWD_CONTRACT_ADDRESS, abi: DWDABI.abi, functionName: 'lastMint', args: [walletAddress as `0x${string}`],
      });
      const claimFrequency = await publicClient.readContract({
        address: DWD_CONTRACT_ADDRESS, abi: DWDABI.abi, functionName: 'CLAIM_FREQUENCY_SECONDS'
      });
      setNextClaimTimestamp(Number(lastClaim) + Number(claimFrequency));
    } catch (err) {
      console.error("Error al obtener estado de reclamo:", err);
    }
  };

  // Chequeo automático de verificación y estado de reclamo
  useEffect(() => {
    const checkStatus = async () => {
      // Condición de guarda principal: No hacer NADA hasta tener la sesión y la dirección.
      if (!isAuthenticated || !walletAddress) {
        return;
      }
      
      // Si llegamos aquí, es seguro proceder.
      try {
        const verificationStatus = await getIsUserVerified();
        if (verificationStatus.isVerified) {
          setIsVerified(true);
        }
      } catch (e) { console.warn("No se pudo comprobar la verificación:", e); }
      
      // Ahora es seguro llamar a esta función.
      await refreshClaimStatus();
    };

    checkStatus();
  }, [isAuthenticated, walletAddress]);

  // Manejar el temporizador
  useEffect(() => {
    if (!nextClaimTimestamp) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = nextClaimTimestamp - now;
      if (secondsLeft > 0) {
        const h = Math.floor(secondsLeft / 3600).toString().padStart(2, '0');
        const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, '0');
        const s = (secondsLeft % 60).toString().padStart(2, '0');
        setCountdown(`${h}:${m}:${s}`);
      } else {
        setCountdown('');
        setNextClaimTimestamp(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextClaimTimestamp]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
  };

  // --- FUNCIÓN DE RECLAMO CON MiniKit (la más confiable) ---
  const handleClaimTokens = async () => {
    const canClaim = !nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000);
    if (!canClaim || isClaiming) return;

    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      // Usamos el comando oficial de MiniKit para enviar la transacción
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: DWD_CONTRACT_ADDRESS,
          abi: DWDABI.abi as any,
          functionName: 'claim',
          args: [],
        }],
      });

      if (finalPayload.status === 'success' && finalPayload.transaction_id) {
        setClaimSuccess("Transacción enviada, esperando confirmación...");
        // Usamos nuestro cliente viem para esperar a que la transacción sea confirmada
        await publicClient.waitForTransactionReceipt({ hash: finalPayload.transaction_id });
        setClaimSuccess("¡Tokens reclamados con éxito!");
        await refreshClaimStatus(); // Actualizamos el temporizador desde la blockchain
      } else {
        throw new Error(finalPayload.error_code ?? 'La transacción falló en el MiniKit.');
      }
    } catch (err) {
      console.error("Error al reclamar tokens:", err);
      setClaimError("La transacción falló o fue rechazada.");
    } finally {
      setIsClaiming(false);
      setTimeout(() => { setClaimSuccess(null); setClaimError(null); }, 5000);
    }
  };
  
  const canClaim = !nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000);

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <UserInfo />
      </Page.Header>

      <Page.Main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <p className="text-5xl font-black text-yellow-600 yellow:text-white">DESTINITY</p>
          <SpinningCoin ipfsUrl={coinIpfsUrl} />

          {!isAuthenticated && <div className="w-full max-w-sm"><AuthButton /></div>}
          {isAuthenticated && !isVerified && <div className="w-full max-w-sm"><Verify onSuccess={handleVerificationSuccess} /></div>}
          
          {isAuthenticated && isVerified && (
            <div className="w-full max-w-sm text-center mt-4">
              {canClaim ? (
                <Button onClick={handleClaimTokens} disabled={isClaiming} size="lg" variant="primary" className="w-full">
                  {isClaiming ? 'Reclamando...' : 'Reclamar Tokens'}
                </Button>
              ) : (
                <div>
                  <p>Próximo reclamo en:</p>
                  <p className="text-xl font-bold">{countdown || 'Calculando...'}</p>
                </div>
              )}
              <div className="h-6 mt-2 text-sm">
                {claimSuccess && <p className="text-green-400">{claimSuccess}</p>}
                {claimError && <p className="text-red-400">{claimError}</p>}
              </div>
            </div>
          )}
        </div>
      </Page.Main>

      <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50">
        <Navigation />
      </Page.Footer>
    </Page>
  );
}

// Declaración de módulo para Verify
declare module '../components/Verify' {
  export const Verify: ({ onSuccess }: { onSuccess: () => void }) => JSX.Element;
      }
