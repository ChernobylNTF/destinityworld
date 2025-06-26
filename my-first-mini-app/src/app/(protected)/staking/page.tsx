'use client';

import { Page } from '@/components/PageLayout';
import { UserInfo } from '@/components/UserInfo';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// --- LÓGICA DE BLOCKCHAIN ---
import { MiniKit } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, formatUnits, parseEther, type TransactionReceipt } from 'viem';
import { worldchain } from 'viem/chains';
import WorldIdClaimTokenABI from '@/abi/WorldIdClaimToken.json'; // ABI de tu token DWD

// --- ABI DE EJEMPLO PARA EL CONTRATO DE STAKING ---
// ¡Deberás reemplazar esto con el ABI real de tu contrato de Staking!
const StakingABI = [
  { "name": "stake", "type": "function", "stateMutability": "nonpayable", "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "outputs": [] },
  { "name": "unstake", "type": "function", "stateMutability": "nonpayable", "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "outputs": [] },
  { "name": "stakedBalance", "type": "function", "stateMutability": "view", "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }] },
  { "name": "earned", "type": "function", "stateMutability": "view", "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }] },
];

// --- Configuración ---
const myContractToken = '0x14c8e69DfBD6210f9e9fF9838CA2fD83D00D39a0';
// --- ¡IMPORTANTE! Reemplaza esto con la dirección de tu contrato de Staking ---
const STAKING_CONTRACT_ADDRESS = '0x...TU_CONTRATO_DE_STAKING'; 
const WORLDCHAIN_RPC_URL = 'https://worldchain-sepolia.g.alchemy.com/public';
const EXPLORER_URL = "https://sepolia.worldscan.org";

export default function StakingPage() {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;

  // Estados para la UI
  const [stakeAmount, setStakeAmount] = useState('');
  const [dwdBalance, setDwdBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [rewards, setRewards] = useState('0');

  // Estados para manejar transacciones
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'staking' | 'unstaking'>('idle');
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  
  const publicClient = useMemo(() => createPublicClient({ chain: worldchain, transport: http(WORLDCHAIN_RPC_URL) }), []);

  const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    client: publicClient,
    appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}` },
    transactionId: transactionId,
  });

  // Función para refrescar todos los balances
  const refreshBalances = async () => {
    if (!walletAddress) return;
    try {
      const [dwdBal, stakedBal, rewardsBal] = await Promise.all([
        publicClient.readContract({ address: myContractToken, abi: WorldIdClaimTokenABI.abi, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: STAKING_CONTRACT_ADDRESS, abi: StakingABI, functionName: 'stakedBalance', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: STAKING_CONTRACT_ADDRESS, abi: StakingABI, functionName: 'earned', args: [walletAddress as `0x${string}`] })
      ]);
      setDwdBalance(formatUnits(dwdBal as bigint, 18));
      setStakedBalance(formatUnits(stakedBal as bigint, 18));
      setRewards(formatUnits(rewardsBal as bigint, 18));
    } catch (err) { console.error("Error refrescando balances:", err); }
  };
  
  useEffect(() => {
    if (walletAddress) {
      refreshBalances();
    }
  }, [walletAddress]);

  // Efecto que reacciona cuando una transacción se confirma
  useEffect(() => {
    if (isConfirmed && receipt) {
      setTxMessage(`¡Éxito! Transacción confirmada.`);
      setTxHash(receipt.transactionHash);
      refreshBalances(); // Refrescamos los balances después del éxito
      setTimeout(() => {
        setTxStatus('idle');
        setTxMessage(null);
        setTxHash(null);
        setTransactionId('');
      }, 8000);
    }
  }, [isConfirmed, receipt]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0 || !walletAddress) return;

    const amountToStake = parseEther(stakeAmount);

    try {
      // --- PASO 1: APROBACIÓN ---
      setTxStatus('approving');
      setTxMessage('Paso 1/2: Solicitando permiso...');
      
      const approvePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: myContractToken,
          abi: WorldIdClaimTokenABI.abi,
          functionName: 'approve',
          args: [STAKING_CONTRACT_ADDRESS, amountToStake],
        }],
      });

      if (approvePayload.status !== 'success' || !approvePayload.transaction_id) throw new Error('Aprobación rechazada.');
      
      setTxMessage('Paso 1/2: Confirmando permiso...');
      // Usamos un nuevo hook de espera solo para la aprobación
      await publicClient.waitForTransactionReceipt({ hash: approvePayload.transaction_id });

      // --- PASO 2: STAKING ---
      setTxStatus('staking');
      setTxMessage('Paso 2/2: Depositando tokens...');
      
      const stakePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: STAKING_CONTRACT_ADDRESS,
          abi: StakingABI,
          functionName: 'stake',
          args: [amountToStake],
        }],
      });

      if (stakePayload.status !== 'success' || !stakePayload.transaction_id) throw new Error('Transacción de stake rechazada.');

      setTxMessage('Paso 2/2: Confirmando depósito...');
      setTransactionId(stakePayload.transaction_id); // El hook principal se encargará del éxito final

    } catch (err: any) {
      console.error("Error en el proceso de stake:", err);
      setTxMessage(err.message || 'El proceso falló.');
      setTxStatus('idle');
    }
  };
  
  const handleUnstake = async () => {
     // Aquí implementarías la lógica para unstake, que es un solo paso
     alert("Función de Unstake no implementada todavía.");
  };

  return (
    <Page>
      <Page.Header className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <UserInfo />
      </Page.Header>
      <Page.Main className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center text-yellow-400">💎 Staking de DWD 💎</h1>

          {/* Tarjeta de Staking */}
          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Hacer Staking</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Cantidad a depositar</span>
                <span>Balance: {parseFloat(dwdBalance).toFixed(4)} DWD</span>
              </div>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-white text-lg"
              />
            </div>
            <Button
              onClick={handleStake}
              disabled={txStatus !== 'idle'}
              size="lg"
              variant="primary"
              className="w-full"
            >
              {txStatus === 'idle' ? 'Depositar DWD' : txMessage}
            </Button>
          </div>

          {/* Tarjeta de Balance en Staking */}
          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Tus Activos</h2>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-400">Balance en Staking:</span>
                    <span className="font-bold text-lg">{parseFloat(stakedBalance).toFixed(4)} DWD</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Recompensas ganadas:</span>
                    <span className="font-bold text-lg text-green-400">{parseFloat(rewards).toFixed(4)} DWD</span>
                </div>
            </div>
             <Button
                onClick={handleUnstake}
                disabled={txStatus !== 'idle' || parseFloat(stakedBalance) <= 0}
                size="lg"
                variant="secondary"
                className="w-full mt-6"
              >
               Retirar
             </Button>
          </div>
          
          {/* Feedback de la transacción */}
          {txHash && (
             <div className="text-center text-sm">
                <Link href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" className="text-blue-400 hover:underline">
                  Ver transacción en el explorador
                </Link>
             </div>
          )}
        </div>
      </Page.Main>
    </Page>
  );
}
