'use client';

import { Page } from '@/components/PageLayout';
import { Button, TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

// --- LÓGICA DE BLOCKCHAIN ---
import { MiniKit } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http, formatUnits, parseEther, type TransactionReceipt } from 'viem';
import { worldchain } from 'viem/chains';

// --- CONFIGURACIÓN Y CONSTANTES ---
const STAKING_CONTRACT_ADDRESS = '0x5ea935f53f98f63f719972df49ca1ba5d520d36a';
const TOKEN_CONTRACT_ADDRESS = '0xc418b282f205c3f4942451676dd064496ee69be4';
const WORLDCHAIN_RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';
const EXPLORER_URL = "https://worldscan.org";

// --- ABIs DE LOS CONTRATOS ---

// ABI del Token
const TOKEN_ABI = [
	{"inputs":[{"internalType":"uint256","name":"initialSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"value","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"burnFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimDailyToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"TokenClaimed","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"CLAIM_INTERVAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"lastClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PAUSER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// ABI del Contrato de Staking
const STAKING_ABI = [
	{"inputs":[{"internalType":"address","name":"_stakingTokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"PenaltyPaid","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardsClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardsFunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalStaked","type":"uint256"}],"name":"Staked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Unstaked","type":"event"},{"inputs":[],"name":"claimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"currentRewardRatePerToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"earlyWithdrawalPenaltyBps","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"earned","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getContractTokenBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getEarlyWithdrawalPenalty","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getRewardPerToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getTimeStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getTokensStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastUpdateTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"notifyRewardAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"pendingRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardPerTokenAccumulated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardRatePerToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardStartTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"rewardsClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"stakeStartTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"stakedAmounts","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingDuration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userRewardPerTokenAccumulated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// --- Componente Principal ---
export default function StakingPage() {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  // --- Estados del Componente ---
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  
  const [balances, setBalances] = useState({ chrn: '0', staked: '0', rewards: '0' });
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'staking' | 'unstaking' | 'claiming' | 'loading'>('idle');
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  
  const publicClient = useMemo(() => createPublicClient({ chain: worldchain, transport: http(WORLDCHAIN_RPC_URL) }), []);

  const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    client: publicClient,
    appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}` },
    transactionId: transactionId,
  });
	// --- Funciones ---

  const refreshBalances = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoadingBalances(true);
    try {
      const [chrnBal, stakedBal, rewardsBal] = await Promise.all([
        publicClient.readContract({ address: TOKEN_CONTRACT_ADDRESS, abi: TOKEN_ABI, functionName: 'balanceOf', args: [walletAddress] }),
        publicClient.readContract({ address: STAKING_CONTRACT_ADDRESS, abi: STAKING_ABI, functionName: 'getTokensStaked', args: [walletAddress] }),
        publicClient.readContract({ address: STAKING_CONTRACT_ADDRESS, abi: STAKING_ABI, functionName: 'earned', args: [walletAddress] })
      ]);
      setBalances({
        chrn: formatUnits(chrnBal as bigint, 18),
        staked: formatUnits(stakedBal as bigint, 18),
        rewards: formatUnits(rewardsBal as bigint, 18),
      });
    } catch (err) { 
      console.error("Error refrescando balances:", err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [walletAddress, publicClient]);
  
  // --- Efectos ---

  useEffect(() => {
    if (walletAddress) {
      refreshBalances();
    }
  }, [walletAddress, refreshBalances]);

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
        setStakeAmount('');
        setUnstakeAmount('');
      }, 8000);
    }
  }, [isConfirmed, receipt, refreshBalances]);

  const handleTransactionError = (error: any, defaultMessage: string) => {
    console.error("Error en la transacción:", error);
    let userMessage = defaultMessage;
    if (error.message?.includes('UserRejectedRequestError') || error.message?.includes('rechazada')) {
        userMessage = 'Transacción rechazada por el usuario.';
    } else if (error.message?.includes('insufficient funds')) {
        userMessage = 'Fondos insuficientes para la transacción.';
    }
    setTxMessage(userMessage);
    setTxStatus('idle');
    setTimeout(() => setTxMessage(null), 5000);
  };

  // --- Manejadores de Eventos ---

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0 || !walletAddress) return;
    const amountToStake = parseEther(stakeAmount);
    
    try {
      setTxStatus('loading');
      setTxMessage('Verificando permisos...');

      const currentAllowance = await publicClient.readContract({
          address: TOKEN_CONTRACT_ADDRESS,
          abi: TOKEN_ABI,
          functionName: 'allowance',
          args: [walletAddress, STAKING_CONTRACT_ADDRESS],
      }) as bigint;

      if (currentAllowance < amountToStake) {
        setTxStatus('approving');
        setTxMessage('Paso 1/2: Aprobando tokens...');
        const approvePayload = await MiniKit.commandsAsync.sendTransaction({
          transaction: [{ address: TOKEN_CONTRACT_ADDRESS, abi: TOKEN_ABI, functionName: 'approve', args: [STAKING_CONTRACT_ADDRESS, amountToStake] }],
        });
        if (approvePayload.status !== 'success' || !approvePayload.transaction_id) throw new Error('Aprobación rechazada.');
        setTxMessage('Paso 1/2: Esperando confirmación...');
        await publicClient.waitForTransactionReceipt({ hash: approvePayload.transaction_id as `0x${string}` });
      }
      
      setTxStatus('staking');
      setTxMessage('Paso 2/2: Depositando tokens...');
      const stakePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: STAKING_CONTRACT_ADDRESS, abi: STAKING_ABI, functionName: 'stake', args: [amountToStake] }],
      });
      if (stakePayload.status !== 'success' || !stakePayload.transaction_id) throw new Error('Transacción de stake rechazada.');
      
      setTxMessage('Procesando depósito...');
      setTransactionId(stakePayload.transaction_id);

    } catch (err: any) {
      handleTransactionError(err, 'El proceso de stake falló.');
    }
  };
  
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0 || !walletAddress) return;
    const amountToUnstake = parseEther(unstakeAmount);
    try {
      setTxStatus('unstaking');
      setTxMessage('Retirando tokens...');
      const unstakePayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: STAKING_CONTRACT_ADDRESS, abi: STAKING_ABI, functionName: 'unstake', args: [amountToUnstake] }],
      });
      if (unstakePayload.status !== 'success' || !unstakePayload.transaction_id) throw new Error('Transacción de retiro rechazada.');
      
      setTxMessage('Procesando retiro...');
      setTransactionId(unstakePayload.transaction_id);
    } catch (err: any) {
      handleTransactionError(err, 'El retiro falló.');
    }
  };

  const handleClaimReward = async () => {
    if (!walletAddress || parseFloat(balances.rewards) <= 0) return;
    try {
      setTxStatus('claiming');
      setTxMessage('Reclamando recompensas...');
      const claimPayload = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{ address: STAKING_CONTRACT_ADDRESS, abi: STAKING_ABI, functionName: 'claimReward', args: [] }],
      });
      if (claimPayload.status !== 'success' || !claimPayload.transaction_id) throw new Error('Transacción de reclamo rechazada.');

      setTxMessage('Procesando reclamo...');
      setTransactionId(claimPayload.transaction_id);
    } catch (err: any) {
      handleTransactionError(err, 'El reclamo falló.');
    }
  };
  
  const formatBalance = (value: string) => parseFloat(value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const isTxInProgress = txStatus !== 'idle';

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

          <div className="p-6 bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Hacer Staking</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Cantidad a depositar</span>
                <span>Balance: {isLoadingBalances ? 'Cargando...' : `${formatBalance(balances.chrn)} CHRN`}</span>
              </div>
              <div className="relative">
                <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0" className="w-full p-3 bg-black/20 border border-white/20 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16" disabled={isTxInProgress} />
                <button onClick={() => setStakeAmount(balances.chrn)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600/50 text-white px-3 py-1 rounded text-sm hover:bg-blue-500" disabled={isTxInProgress}>MAX</button>
              </div>
            </div>
            <Button onClick={handleStake} disabled={isTxInProgress || !stakeAmount || parseFloat(stakeAmount) <= 0} size="lg" variant="primary" className="w-full">
              {isTxInProgress && (txStatus === 'approving' || txStatus === 'staking' || txStatus === 'loading') ? txMessage : 'Depositar CHRN'}
            </Button>
          </div>

          <div className="p-6 bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Tus Activos</h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Balance en Staking:</span>
                    <span className="font-bold text-lg">{isLoadingBalances ? 'Cargando...' : `${formatBalance(balances.staked)} CHRN`}</span>
                </div>
                 <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Cantidad a retirar</span>
                    </div>
                    <div className="relative">
                        <input type="number" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} placeholder="0.0" className="w-full p-3 bg-black/20 border border-white/20 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16" disabled={isTxInProgress}/>
                        <button onClick={() => setUnstakeAmount(balances.staked)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-600/50 text-white px-3 py-1 rounded text-sm hover:bg-gray-500" disabled={isTxInProgress}>MAX</button>
                    </div>
                </div>
                <Button onClick={handleUnstake} disabled={isTxInProgress || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(balances.staked) <= 0} size="lg" variant="secondary" className="w-full">
                    {isTxInProgress && txStatus === 'unstaking' ? txMessage : 'Retirar del Staking'}
                </Button>
                <hr className="border-white/10 my-2" />
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Recompensas ganadas:</span>
                    <span className="font-bold text-lg text-green-400">{isLoadingBalances ? 'Cargando...' : `${formatBalance(balances.rewards)} CHRN`}</span>
                </div>
                <Button onClick={handleClaimReward} disabled={isTxInProgress || parseFloat(balances.rewards) <= 0} size="lg" variant="primary" className="w-full bg-green-600 hover:bg-green-700">
                    {isTxInProgress && txStatus === 'claiming' ? txMessage : 'Reclamar Recompensas'}
                </Button>
            </div>
          </div>
          
          {txMessage && !isConfirmed && (
             <div className="text-center text-sm text-yellow-300 animate-pulse">{txMessage}...</div>
          )}
          {txHash && ( 
            <div className="text-center text-sm p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-300 mb-2">{txMessage}</p>
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
