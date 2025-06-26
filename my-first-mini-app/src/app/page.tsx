'use client';

import Navigation from '../components/Navigation';
import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { UserInfo } from '../components/UserInfo';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Importar el componente de la moneda 3D
import SpinningCoin from '../components/SpinningCoin';

// --- LÓGICA DE BLOCKCHAIN ---
import { MiniKit } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, type TransactionReceipt, decodeAbiParameters, parseAbiParameters } from 'viem';
import { worldchain } from 'viem/chains';
import WorldIdClaimTokenABI from '@/abi/WorldIdClaimToken.json'; // Tu ABI

// --- Configuración ---
const WorldIdClaimToken_CONTRACT_ADDRESS = '0x14c8e69DfBD6210f9e9fF9838CA2fD83D00D39a0'; // Tu dirección de contrato
const WORLDCHAIN_RPC_URL = 'https://worldchain-sepolia.g.alchemy.com/public';
const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";
const EXPLORER_URL = "https://sepolia.worldscan.org";

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated';
  const walletAddress = session?.user?.walletAddress;
  
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'verifying' | 'sending' | 'confirming' | 'success' | 'error'>('idle');
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [onChainTxHash, setOnChainTxHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const publicClient = useMemo(() => createPublicClient({
    chain: worldchain, transport: http(WORLDCHAIN_RPC_URL),
  }), []);

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
  } = useWaitForTransactionReceipt({
    client: publicClient,
    appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}` },
    transactionId: transactionId,
  });

  const refreshClaimStatus = async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const [lastClaim, claimFrequency] = await Promise.all([
        publicClient.readContract({ address: WorldIdClaimToken_CONTRACT_ADDRESS, abi: WorldIdClaimTokenABI.abi, functionName: 'lastClaimTimestamp', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: WorldIdClaimToken_CONTRACT_ADDRESS, abi: WorldIdClaimTokenABI.abi, functionName: 'CLAIM_COOLDOWN' })
      ]);
      setNextClaimTimestamp(Number(lastClaim) + Number(claimFrequency));
    } catch (err) { console.error("Error al obtener estado de reclamo:", err); }
    finally { setIsLoading(false); }
  };
  
  useEffect(() => {
    // Ya no necesitamos `getIsUserVerified` aquí, porque el contrato lo hará
    if (isAuthenticated && walletAddress) {
      refreshClaimStatus();
    } else if(sessionStatus !== 'loading') {
      setIsLoading(false);
    }
  }, [isAuthenticated, walletAddress, sessionStatus]);

  useEffect(() => {
    if (transactionId && isConfirming) {
      setClaimStatus('confirming');
    } else if (transactionId && isConfirmed && receipt) {
      setClaimStatus('success');
      setOnChainTxHash(receipt.transactionHash);
      setTimeout(() => { refreshClaimStatus(); }, 2000);
      setTimeout(() => { setClaimStatus('idle'); setTransactionId(''); }, 8000);
    } else if (transactionId && isError) {
      setClaimStatus('error');
      setClaimError('La transacción falló en la red.');
      setTimeout(() => { setClaimStatus('idle'); setTransactionId(''); }, 5000);
    }
  }, [isConfirming, isConfirmed, isError, receipt, transactionId]);

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
  
  // --- FUNCIÓN DE RECLAMO CORREGIDA PARA VERIFICACIÓN ON-CHAIN ---
  const handleClaimTokens = async () => {
    const canClaim = !isLoading && (!nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000));
    if (!canClaim || claimStatus !== 'idle' || !walletAddress) return;

    setClaimStatus('verifying');
    setClaimError(null);
    setOnChainTxHash('');

    try {
      // 1. Obtenemos la prueba de World ID del usuario.
      const verifyResult = await MiniKit.verifyAsync({
        app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}`,
        action: 'testing-action', // Acción única para este reclamo
        signal: walletAddress, // Usamos la dirección como `signal` para máxima seguridad
      });

      if (verifyResult.status !== 'success' || !verifyResult.proof) {
        throw new Error(verifyResult.error_code ?? 'La verificación de World ID falló.');
      }
      
      // Decodificamos la prueba para obtener los argumentos necesarios para el contrato
      const [decodedProof] = decodeAbiParameters(parseAbiParameters('uint256[8]'), verifyResult.proof as `0x${string}`);

      setClaimStatus('sending');

      // 2. Enviamos la transacción al contrato, pasando la prueba como argumentos.
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ 
          address: WorldIdClaimToken_CONTRACT_ADDRESS, 
          abi: WorldIdClaimTokenABI.abi as any, 
          functionName: 'claimTokens', // La función correcta de tu contrato
          args: [ // Los argumentos correctos que pide tu contrato
            verifyResult.merkle_root,
            verifyResult.nullifier_hash,
            decodedProof,
          ]
        }],
      });

      if (finalPayload.status === 'success' && finalPayload.transaction_id) {
        setTransactionId(finalPayload.transaction_id);
      } else {
        throw new Error(finalPayload.error_code ?? 'Transacción rechazada en MiniKit.');
      }
    } catch (err: any) {
      console.error("Error al iniciar el reclamo:", err);
      setClaimError(err.message || "La transacción fue rechazada.");
      setClaimStatus('idle');
    }
  };
  
  const canClaim = !isLoading && (!nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000));

  const renderClaimSection = () => {
    if (isLoading) {
      return <div><p>Verificando estado del reclamo...</p></div>;
    }
    if (canClaim) {
      const buttonText = {
        idle: 'Reclamar Tokens',
        verifying: 'Verificando con World ID...',
        sending: 'Enviando transacción...',
        confirming: 'Confirmando...'
      }[claimStatus] || 'Reclamar Tokens';
      
      return <Button onClick={handleClaimTokens} disabled={claimStatus !== 'idle'} size="lg" variant="primary" className="w-full">{buttonText}</Button>;
    } else {
      return <div><p>Próximo reclamo en:</p><p className="text-xl font-bold">{countdown || '...'}</p></div>;
    }
  };

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900 text-white"><UserInfo /></Page.Header>
      <Page.Main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <p className="text-5xl font-black text-yellow-600 yellow:text-white">DESTINITY</p>
          <SpinningCoin ipfsUrl={coinIpfsUrl} />
          {/* Ya no necesitamos un flujo separado de autenticación y verificación aquí */}
          {!isAuthenticated && <div className="w-full max-w-sm"><AuthButton /></div>}
          
          {isAuthenticated && (
            <div className="w-full max-w-sm text-center mt-4">
              {renderClaimSection()}
              <div className="h-10 mt-2 text-sm flex flex-col items-center justify-center">
                {claimError && <p className="text-red-400">{claimError}</p>}
                {claimStatus === 'success' && (
                  <div className="text-center">
                    <p className="text-green-400">¡Tokens reclamados con éxito!</p>
                    {onChainTxHash && (
                      <Link href={`${EXPLORER_URL}/tx/${onChainTxHash}`} target="_blank" className="text-blue-400 hover:underline text-xs">
                        Ver transacción
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Page.Main>
      <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50"><Navigation /></Page.Footer>
    </Page>
  );
}
