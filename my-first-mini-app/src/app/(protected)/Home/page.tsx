'use client';

import Navigation from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import SpinningCoin from '@/components/SpinningCoin';
import { Verify } from '@/components/Verify'; // <-- IMPORTACIÓN ACTUALIZADA

// Lógica de Blockchain
import { getIsUserVerified } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, type TransactionReceipt, isAddress } from 'viem';
import { worldchain } from 'viem/chains';
import chrn_abiABI from '@/abi/chrn_abi.json';
import { MiniKit } from '@worldcoin/minikit-js';


// --- CONFIGURACIÓN ---
const chrn_abi_CONTRACT_ADDRESS = '0xc418b282f205c3f4942451676dd064496ee69be4';
const WORLDCHAIN_RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';
const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";
const EXPLORER_URL = "https://worldscan.org";

export default function HomePage() {
  const { data: session, status } = useSession();
  const walletAddress = session?.user?.walletAddress;

  // --- ESTADOS ---
  const [isVerified, setIsVerified] = useState(false);
  // Los estados 'isVerifying' y 'verificationError' se han movido a components/Verify.tsx
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

  // --- EFECTOS Y FUNCIONES ---
  const refreshClaimStatus = async (address: `0x${string}`) => {
    setIsClaimStatusLoading(true);
    try {
      const [lastClaim, claimFrequency] = await Promise.all([
        publicClient.readContract({ address: chrn_abi_CONTRACT_ADDRESS, abi: chrn_abiABI as any, functionName: 'lastClaimed', args: [address] }),
        publicClient.readContract({ address: chrn_abi_CONTRACT_ADDRESS, abi: chrn_abiABI as any, functionName: 'CLAIM_INTERVAL' })
      ]);
      setNextClaimTimestamp(Number(lastClaim) + Number(claimFrequency));
    } catch (err) { 
      console.error("Error fetching claim status:", err); 
    } finally { 
      setIsClaimStatusLoading(false); 
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (status === 'authenticated' && isAddress(walletAddress as string)) {
        try {
          const verificationStatus = await getIsUserVerified({ walletAddress });
          if (verificationStatus.isVerified) setIsVerified(true);
        } catch (e) { 
          console.error("Error verifying user:", e); 
        }
        await refreshClaimStatus(walletAddress as `0x${string}`);
      } else if (status !== 'loading') {
        setIsClaimStatusLoading(false);
      }
    };
    checkStatus();
  }, [status, walletAddress]);

  useEffect(() => {
    if (transactionId && isConfirming) setClaimStatus('confirming');
    else if (transactionId && isConfirmed && receipt) {
      setClaimStatus('success');
      setOnChainTxHash(receipt.transactionHash);
      if (isAddress(walletAddress as string)) {
        setTimeout(() => refreshClaimStatus(walletAddress as `0x${string}`), 2000);
      }
      setTimeout(() => { setClaimStatus('idle'); setTransactionId(''); }, 8000);
    } else if (transactionId && isError) {
      setClaimStatus('error');
      setClaimError('Transaction failed on-chain.');
      setTimeout(() => { setClaimStatus('idle'); setTransactionId(''); }, 5000);
    }
  }, [isConfirming, isConfirmed, isError, receipt, transactionId, walletAddress]);

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
  
  // Esta función se pasa como prop al componente Verify
  const handleVerificationSuccess = () => setIsVerified(true);

  const handleClaimTokens = async () => {
    const canClaim = !isClaimStatusLoading && (!nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000));
    if (!canClaim || claimStatus !== 'idle') return;
    setClaimStatus('sending');
    setClaimError(null);
    setOnChainTxHash('');
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: chrn_abi_CONTRACT_ADDRESS, abi: chrn_abiABI as any, functionName: 'claimDailyToken', args: [] }],
      });
      if (finalPayload.status === 'success' && finalPayload.transaction_id) {
        setTransactionId(finalPayload.transaction_id);
      } else {
        throw new Error(finalPayload.error_code ?? 'Transaction rejected in MiniKit.');
      }
    } catch (err: any) {
      console.error("Error initiating claim:", err);
      setClaimError(err.message || "Transaction was rejected.");
      setClaimStatus('idle');
    }
  };
  
  const canClaim = !isClaimStatusLoading && (!nextClaimTimestamp || nextClaimTimestamp < Math.floor(Date.now() / 1000));

  const renderClaimSection = () => {
    if (status === 'loading' || isClaimStatusLoading) return <div className="h-10"><p>Verificando estado...</p></div>;
    if (canClaim) {
      return (
        <button onClick={handleClaimTokens} disabled={claimStatus !== 'idle'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors">
          Reclamar Tokens
        </button>
      );
    } else {
      return <div className="text-center p-2 bg-black/20 rounded-lg"><p className="text-sm text-gray-300">Próximo reclamo en:</p><p className="text-xl font-bold">{countdown || '...'}</p></div>;
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
        <TopBar
          title="DESTINITY"
          startAdornment={
            <button onClick={() => signOut()} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }
          endAdornment={
            session?.user && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold capitalize">{session.user.username}</p>
                <Marble src={session.user.profilePictureUrl} className="w-8 h-8 rounded-full" />
              </div>
            )
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen pb-20">
        <div className="flex flex-col items-center gap-4">
          <p className="text-5xl font-black text-yellow-400">DESTINITY</p>
          <SpinningCoin ipfsUrl={coinIpfsUrl} />
          
          {!isVerified && (
            // <-- USO DEL COMPONENTE MODULARIZADO
            <Verify onSuccess={handleVerificationSuccess} />
          )}

          {isVerified && (
            <div className="w-full max-w-sm text-center mt-4">
              {renderClaimSection()}
              <div className="h-10 mt-2 text-sm flex flex-col items-center justify-center">
                {claimStatus === 'error' && <p className="text-red-400">{claimError}</p>}
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
      <Page.Footer className="px-0 fixed bottom-0 w-full"><Navigation /></Page.Footer>
    </Page>
  );
}
