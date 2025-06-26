'use client';

import Navigation from '../components/Navigation';
import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { Verify } from '../components/Verify';
import { UserInfo } from '../components/UserInfo';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Importar el componente de la moneda 3D
import SpinningCoin from '../components/SpinningCoin';

// --- LÃ“GICA DE BLOCKCHAIN ---
import { MiniKit, getIsUserVerified } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, type TransactionReceipt } from 'viem';
import { worldchain } from 'viem/chains';
import WorldIdClaimTokenABI from '@/abi/WorldIdClaimToken.json';

// --- ConfiguraciÃ³n ---
const WorldIdClaimToken_CONTRACT_ADDRESS = '0x14c8e69DfBD6210f9e9fF9838CA2fD83D00D39a0';
const WORLDCHAIN_RPC_URL = 'https://worldchain-sepolia.g.alchemy.com/public';
const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";
const EXPLORER_URL = "https://sepolia.worldscan.org";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const walletAddress = session?.user?.walletAddress;

  const [isVerified, setIsVerified] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'sending' | 'confirming' | 'success' | 'error'>('idle');
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [onChainTxHash, setOnChainTxHash] = useState<string>('');
  const [isClaimStatusLoading, setIsClaimStatusLoading] = useState(true);

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
    setIsClaimStatusLoading(true);
    try {
      const [lastClaim, claimFrequency] = await Promise.all([
        publicClient.readContract({ address: WorldIdClaimToken_CONTRACT_ADDRESS, abi: WorldIdClaimTokenABI.abi, functionName: 'lastClaimTimestamp', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: WorldIdClaimToken_CONTRACT_ADDRESS, abi: WorldIdClaimTokenABI.abi, functionName: 'CLAIM_COOLDOWN' })
      ]);
      setNextClaimTimestamp(Number(lastClaim) + Number(claimFrequency));
    } catch (err) { console.error("Error al obtener estado de reclamo:", err); }
    finally { setIsClaimStatusLoading(false); }
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (isAuthenticated && walletAddress) {
        try {
          const verificationStatus = await getIsUserVerified();
          if (verificationStatus.isVerified) setIsVerified(true);
        } catch (e) { console.warn("No se pudo comprobar la verificaciÃ³n:", e); }
        await refreshClaimStatus();
      }
    };
    checkStatus();
  }, [isAuthenticated, walletAddress]);

  useEffect(() => {
    if (transactionId && isConfirming) {
      setClaimStatus('confirming');
    } else if (transactionId && isConfirmed && receipt) {
      setClaimStatus('success');
      setOnChainTxHash(receipt.transactionHash);
      setTimeout(() => {
        refreshClaimStatus();
      }, 2000);
      setTimeout(() => { setClaimStatus('idle'); setTransactionId(''); }, 8000);
    } else if (transactionId && isError) {
      setClaimStatus('error');
      setClaimError('La transacciÃ³n fallÃ³ en la red.');
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
  
  const handleVerificationSuccess = () => setIsVerified(true);

  // --- FUNCIÃ“N DE RECLAMO CORREGIDA FINAL ---
  const handleClaimTokens = async () => {
    const canClaim = !isClaimStatusLoading && (!nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000));
    if (!canClaim || claimStatus !== 'idle') return;

    setClaimStatus('sending');
    setClaimError(null);
    setOnChainTxHash('');

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ 
          address: WorldIdClaimToken_CONTRACT_ADDRESS, 
          abi: WorldIdClaimTokenABI.abi as any, 
          functionName: 'claim', 
          args: [] 
        }],
        // Se omite el payload de 'permit2' para la funciÃ³n `claim`,
        // ya que esto parece ser la causa del error "invalid_token".
      });

      if (finalPayload.status === 'success' && finalPayload.transaction_id) {
        setTransactionId(finalPayload.transaction_id);
      } else {
        throw new Error(finalPayload.error_code ?? 'TransacciÃ³n rechazada en MiniKit.');
      }
    } catch (err: any) {
      console.error("Error al iniciar el reclamo:", err);
      setClaimError(err.message || "La transacciÃ³n fue rechazada.");
      setClaimStatus('idle');
    }
  };
  
  const canClaim = !isClaimStatusLoading && (!nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000));

  const renderClaimSection = () => {
    if (isClaimStatusLoading) {
      return <div><p>Verificando estado del reclamo...</p></div>;
    }
    if (canClaim) {
      const buttonText = claimStatus === 'sending' ? 'Enviando...' : claimStatus === 'confirming' ? 'Confirmando...' : 'Reclamar Tokens';
      return <Button onClick={handleClaimTokens} disabled={claimStatus !== 'idle'} size="lg" variant="primary" className="w-full">{buttonText}</Button>;
    } else {
      return <div><p>PrÃ³ximo reclamo en:</p><p className="text-xl font-bold">{countdown || '...'}</p></div>;
    }
  };

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900 text-white"><UserInfo /></Page.Header>
      <Page.Main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <p className="text-5xl font-black text-yellow-600 yellow:text-white">DESTINITY</p>
          <SpinningCoin ipfsUrl={coinIpfsUrl} />
          {!isAuthenticated && <div className="w-full max-w-sm"><AuthButton /></div>}
          {isAuthenticated && !isVerified && <div className="w-full max-w-sm"><Verify onSuccess={handleVerificationSuccess} /></div>}
          {isAuthenticated && isVerified && (
            <div className="w-full max-w-sm text-center mt-4">
              {renderClaimSection()}
              <div className="h-10 mt-2 text-sm flex flex-col items-center justify-center">
                {claimStatus === 'error' && <p className="text-red-400">{claimError}</p>}
                {claimStatus === 'success' && (
                  <div className="text-center">
                    <p className="text-green-400">Â¡Tokens reclamados con Ã©xito!</p>
                    {onChainTxHash && (
                      <Link href={`${EXPLORER_URL}/tx/${onChainTxHash}`} target="_blank" className="text-blue-400 hover:underline text-xs">
                        Ver transacciÃ³n
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

declare module '../components/Verify' {
  export const Verify: ({ onSuccess }: { onSuccess: () => void }) => JSX.Element;
}
