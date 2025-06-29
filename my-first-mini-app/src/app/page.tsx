'use client';

import Navigation from '../components/Navigation';
import { Page } from '@/components/PageLayout';
import { Verify } from '../components/Verify';
import { UserInfo } from '../components/UserInfo';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SpinningCoin from '../components/SpinningCoin';
import { MiniKit, getIsUserVerified } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, type TransactionReceipt } from 'viem';
import { worldchain } from 'viem/chains';
import chrn_abiABI from '@/abi/chrn_abi.json';

// --- Configuración ---
const chrn_abi_CONTRACT_ADDRESS = '0xc418b282f205c3f4942451676dd064496ee69be4';
const WORLDCHAIN_RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';
const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";
const EXPLORER_URL = "https://sepolia.worldscan.org";

export default function Home() {
  // Obtenemos la sesión, pero ya no la usamos para mostrar/ocultar el login
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;

  // ESTADOS: para verificación y para el reclamo de tokens
  const [isVerified, setIsVerified] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(true);
  const [claimError, setClaimError] = useState<string | null>(null);
  // ... resto de tus estados ...
  const [claimStatus, setClaimStatus] = useState<'idle' | 'sending' | 'confirming' | 'success' | 'error'>('idle');
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [onChainTxHash, setOnChainTxHash] = useState<string>('');
  const [isClaimStatusLoading, setIsClaimStatusLoading] = useState(true);


  // LÓGICA DE BLOCKCHAIN Y USEEFFECTS (Toda tu lógica original se mantiene aquí)
  // ... publicClient, useWaitForTransactionReceipt, refreshClaimStatus, handleClaimTokens, etc. ...
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
        publicClient.readContract({ address: chrn_abi_CONTRACT_ADDRESS, abi: chrn_abiABI as any, functionName: 'lastClaimed', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: chrn_abi_CONTRACT_ADDRESS, abi: chrn_abiABI as any, functionName: 'CLAIM_INTERVAL' })
      ]);
      setNextClaimTimestamp(Number(lastClaim) + Number(claimFrequency));
    } catch (err) { console.error("Error al obtener estado de reclamo:", err); }
    finally { setIsClaimStatusLoading(false); }
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (walletAddress) {
        setIsLoadingVerification(true);
        try {
          const verificationStatus = await getIsUserVerified();
          setIsVerified(verificationStatus.isVerified);
          if (verificationStatus.isVerified) {
            await refreshClaimStatus();
          }
        } catch (e) { console.warn("No se pudo comprobar la verificación:", e); }
        finally { setIsLoadingVerification(false); }
      }
    };
    checkStatus();
  }, [walletAddress]);

  useEffect(() => {
    if (transactionId && isConfirming) {
      setClaimStatus('confirming');
    } else if (transactionId && isConfirmed && receipt) {
      setClaimStatus('success');
      setOnChainTxHash(receipt.transactionHash);
      setTimeout(() => {
        if(walletAddress) refreshClaimStatus();
      }, 2000);
      setTimeout(() => { setClaimStatus('idle'); setTransactionId(''); }, 8000);
    } else if (transactionId && isError) {
      setClaimStatus('error');
      setClaimError('La transacción falló en la red.');
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
  
  const handleVerificationSuccess = () => setIsVerified(true);
    const handleClaimTokens = async () => { /* ... tu función ... */ };
    const renderClaimSection = () => { /* ... tu función ... */ };


  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900 text-white"><UserInfo /></Page.Header>
      <Page.Main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <p className="text-5xl font-black text-yellow-600 yellow:text-white">DESTINITY</p>
          <SpinningCoin ipfsUrl={coinIpfsUrl} />

          {/* ESTA ES LA ÚNICA LÓGICA CONDICIONAL QUE QUEDA AQUÍ */}
          {isLoadingVerification ? (
            <p>Verificando...</p>
          ) : isVerified ? (
            <div className="w-full max-w-sm text-center mt-4">
              {renderClaimSection()}
              {/* ... resto de tu UI de reclamo ... */}
            </div>
          ) : (
            <div className="w-full max-w-sm"><Verify onSuccess={handleVerificationSuccess} /></div>
          )}

        </div>
      </Page.Main>
      <Page.Footer className="px-0 fixed bottom-0 w-full bg-white z-50"><Navigation /></Page.Footer>
    </Page>
  );
}
