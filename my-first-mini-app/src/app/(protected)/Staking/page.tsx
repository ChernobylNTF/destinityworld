'use client';

import { Page } from '@/components/PageLayout';
import { Button, TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// --- LÓGICA DE BLOCKCHAIN ---
import { MiniKit } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, formatUnits, parseEther, type TransactionReceipt } from 'viem';
import { worldchain } from 'viem/chains';
import erc20Abi from '@/abi/erc20_abi.json';

// ABI Real de tu contrato de Staking
const CHRN_staking_abi = [
	{ "inputs": [{ "internalType": "address", "name": "_stakingTokenAddress", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
	{ "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
	{ "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
	{ "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
	{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
	{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "PenaltyPaid", "type": "event" },
	{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "RewardsClaimed", "type": "event" },
	{ "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "RewardsFunded", "type": "event" },
	{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "totalStaked", "type": "uint256" }], "name": "Staked", "type": "event" },
	{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Unstaked", "type": "event" },
	{ "inputs": [], "name": "claimReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "currentRewardRatePerToken", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "earlyWithdrawalPenaltyBps", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "earned", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "getContractTokenBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "getEarlyWithdrawalPenalty", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "pure", "type": "function" },
	{ "inputs": [], "name": "getRewardPerToken", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "getTimeStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "getTokensStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "lastUpdateTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "uint256", "name": "rewardAmount", "type": "uint256" }, { "internalType": "uint256", "name": "duration", "type": "uint256" }], "name": "notifyRewardAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "pendingRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "rewardPerTokenAccumulated", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "rewardRatePerToken", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "rewardStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "rewardsClaimed", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "stakeStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "stakedAmounts", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "stakingDuration", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "stakingToken", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "totalRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "totalStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "userRewardPerTokenAccumulated", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// --- Configuración ---
const myContractToken = '0xc418b282f205c3f4942451676dd064496ee69be4';
const STAKING_CONTRACT_ADDRESS = '0x5ea935f53f98f63f719972df49ca1ba5d520d36a'; 
const WORLDCHAIN_RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';
const EXPLORER_URL = "https://worldscan.org";

export default function StakingPage() {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [chrnBalance, setChrnBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [rewards, setRewards] = useState('0');

  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'staking' | 'unstaking' | 'claiming'>('idle');
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  
  const publicClient = useMemo(() => createPublicClient({ chain: worldchain, transport: http(WORLDCHAIN_RPC_URL) }), []);

  const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    client: publicClient,
    appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}` },
    transactionId: transactionId,
  });

  const refreshBalances = async () => {
    if (!walletAddress) return;
    try {
      const [chrnBal, stakedBal, rewardsBal] = await Promise.all([
        publicClient.readContract({ address: myContractToken as `0x${string}`, abi: erc20_abi, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: STAKING_CONTRACT_ADDRESS as `0x${string}`, abi: CHRN_staking_abi, functionName: 'getTokensStaked', args: [walletAddress as `0x${string}`] }),
        publicClient.readContract({ address: STAKING_CONTRACT_ADDRESS as `0x${string}`, abi: CHRN_staking_abi, functionName: 'earned', args: [walletAddress as `0x${string}`] })
      ]);
      setChrnBalance(formatUnits(chrnBal as bigint, 18));
      setStakedBalance(formatUnits(stakedBal as bigint, 18));
      setRewards(formatUnits(rewardsBal as bigint, 18));
    } catch (err) { console.error("Error refrescando balances:", err); }
  };
  
  useEffect(() => {
    if (walletAddress) {
      refreshBalances();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      setTxMessage(`¡Éxito! Transacción confirmada.`);
      setTxHash(receipt.transactionHash);
      refreshBalances();
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
      setTxStatus('approving');
      setTxMessage('Paso 1/2: Solicitando permiso...');
      const approvePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: myContractToken, abi: erc20_abi, functionName: 'approve', args: [STAKING_CONTRACT_ADDRESS, amountToStake] }],
      });
      if (approvePayload.status !== 'success' || !approvePayload.transaction_id) throw new Error('Aprobación rechazada.');
      setTxMessage('Paso 1/2: Confirmando permiso...');
      await publicClient.waitForTransactionReceipt({ hash: approvePayload.transaction_id });
      setTxStatus('staking');
      setTxMessage('Paso 2/2: Depositando tokens...');
      const stakePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: STAKING_CONTRACT_ADDRESS, abi: CHRN_staking_abi, functionName: 'stake', args: [amountToStake] }],
      });
      if (stakePayload.status !== 'success' || !stakePayload.transaction_id) throw new Error('Transacción de stake rechazada.');
      setTxMessage('Paso 2/2: Confirmando depósito...');
      setTransactionId(stakePayload.transaction_id);
    } catch (err: any) {
      console.error("Error en el proceso de stake:", err);
      setTxMessage(err.message || 'El proceso falló.');
      setTxStatus('idle');
    }
  };
  
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0 || !walletAddress) return;
    const amountToUnstake = parseEther(unstakeAmount);
    try {
      setTxStatus('unstaking');
      setTxMessage('Retirando tokens...');
      const unstakePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: STAKING_CONTRACT_ADDRESS, abi: CHRN_staking_abi, functionName: 'unstake', args: [amountToUnstake] }],
      });
      if (unstakePayload.status !== 'success' || !unstakePayload.transaction_id) throw new Error('Transacción de retiro rechazada.');
      setTxMessage('Confirmando retiro...');
      setTransactionId(unstakePayload.transaction_id);
    } catch (err: any) {
      console.error("Error en el proceso de unstake:", err);
      setTxMessage(err.message || 'El retiro falló.');
      setTxStatus('idle');
    }
  };

  const handleClaimReward = async () => {
    if (!walletAddress) return;
    try {
      setTxStatus('claiming');
      setTxMessage('Reclamando recompensas...');
      const claimPayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: STAKING_CONTRACT_ADDRESS, abi: CHRN_staking_abi, functionName: 'claimReward', args: [] }],
      });
      if (claimPayload.status !== 'success' || !claimPayload.transaction_id) throw new Error('Transacción de reclamo rechazada.');
      setTxMessage('Confirmando reclamo...');
      setTransactionId(claimPayload.transaction_id);
    } catch (err: any) {
      console.error("Error en el proceso de reclamo:", err);
      setTxMessage(err.message || 'El reclamo falló.');
      setTxStatus('idle');
    }
  };

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
        <TopBar
          title="Staking"
          endAdornment={ session?.user && ( <div className="flex items-center gap-2 pr-2"> <p className="text-sm font-semibold capitalize text-white">{session.user.username}</p> <Marble src={session.user.profilePictureUrl} className="w-8 h-8 rounded-full" /> </div> ) }
        />
      </Page.Header>
      <Page.Main className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center text-yellow-400">💎 Staking de CHRN 💎</h1>

          <div className="p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Hacer Staking</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Cantidad a depositar</span>
                <span>Balance: {parseFloat(chrnBalance).toFixed(4)} CHRN</span>
              </div>
              <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0" className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <Button onClick={handleStake} disabled={txStatus !== 'idle'} size="lg" variant="primary" className="w-full">
              {txStatus === 'staking' || txStatus === 'approving' ? txMessage : 'Depositar CHRN'}
            </Button>
          </div>

          <div className="p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Tus Activos</h2>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Balance en Staking:</span>
                    <span className="font-bold text-lg">{parseFloat(stakedBalance).toFixed(4)} CHRN</span>
                </div>
                 <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Cantidad a retirar</span>
                    </div>
                    <input type="number" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} placeholder="0.0" className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <Button onClick={handleUnstake} disabled={txStatus !== 'idle' || parseFloat(stakedBalance) <= 0} size="lg" variant="secondary" className="w-full">
                    {txStatus === 'unstaking' ? txMessage : 'Retirar del Staking'}
                </Button>
                <hr className="border-white/10 my-4" />
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Recompensas ganadas:</span>
                    <span className="font-bold text-lg text-green-400">{parseFloat(rewards).toFixed(4)} CHRN</span>
                </div>
                <Button onClick={handleClaimReward} disabled={txStatus !== 'idle' || parseFloat(rewards) <= 0} size="lg" variant="primary" className="w-full bg-green-600 hover:bg-green-700">
                    {txStatus === 'claiming' ? txMessage : 'Reclamar Recompensas'}
                </Button>
            </div>
          </div>
          
          {txHash && ( <div className="text-center text-sm"> <Link href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" className="text-blue-400 hover:underline"> Ver transacción en el explorador </Link> </div> )}
        </div>
      </Page.Main>
    </Page>
  );
    }
