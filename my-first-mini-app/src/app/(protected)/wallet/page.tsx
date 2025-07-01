'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState, useMemo } from 'react';

// VIEM para interactuar con la Blockchain
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { worldchain } from 'viem/chains';

// ABI genérico para tokens ERC20 estándar
import erc20Abi from '@/abi/erc20_abi.json';

// --- Configuración ---
const WORLDCHAIN_RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';

// --- Configuración de Tokens ---
const tokenConfig = [
  {
    symbol: 'CHRN',
    name: 'Chernobyl',
    contractAddress: '0xC418B282F205C3F4942451676dd064496Ee69bE4',
    logo: '/chrn-logo.png',
    decimals: 18,
  },
  {
    symbol: 'WLD',
    name: 'Worldcoin',
    contractAddress: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
    logo: '/wld-logo.png',
    decimals: 18,
  },
];

// --- Componente de la Billetera ---
const WalletPage = () => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cliente de Viem para leer datos de la blockchain
  const publicClient = useMemo(() => createPublicClient({
    chain: worldchain,
    transport: http(WORLDCHAIN_RPC_URL),
  }), []);

  // --- Lógica para obtener balances REALES ---
  useEffect(() => {
    const fetchAllBalances = async () => {
      if (!walletAddress) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const balancePromises = tokenConfig.map(token =>
          publicClient.readContract({
            address: token.contractAddress as `0x${string}`,
            abi: erc20Abi as any,
            functionName: 'balanceOf',
            args: [walletAddress],
          })
        );

        const results = await Promise.allSettled(balancePromises);

        const newBalances: Record<string, string> = {};
        results.forEach((result, index) => {
          const token = tokenConfig[index];
          if (result.status === 'fulfilled') {
            const formattedBalance = formatUnits(result.value as bigint, token.decimals);
            newBalances[token.symbol] = formattedBalance;
          } else {
            console.error(`Error al obtener el balance de ${token.symbol}:`, result.reason);
            newBalances[token.symbol] = '0'; 
          }
        });

        setBalances(newBalances);
      } catch (err) {
        console.error('Error general al obtener los balances:', err);
        setError('No se pudieron cargar los balances.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllBalances();
  }, [walletAddress, publicClient]);

  // --- Componente para renderizar la fila de un token ---
  const TokenBalanceRow = ({ token }: { token: typeof tokenConfig[0] }) => {
    const balance = balances[token.symbol];
    const displayBalance = balance ? parseFloat(balance).toFixed(4) : '0.0000';

    return (
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
        <div className="flex items-center">
          <img src={token.logo} alt={`Logo de ${token.name}`} className="w-10 h-10 rounded-full mr-4" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/40x40/8B5CF6/FFFFFF?text=${token.symbol.charAt(0)}`; }} />
          <span className="text-xl font-bold">{token.symbol}</span>
        </div>
        {isLoading ? <div className="h-7 w-28 bg-white/20 rounded-md animate-pulse"></div> : <span className="text-2xl font-bold">{displayBalance}</span>}
      </div>
    );
  };
  
  // --- Componente de Interfaz de Swap Personalizada ---
  const SwapInterface = () => {
    const [fromToken, setFromToken] = useState(tokenConfig[0].symbol);
    const [toToken, setToToken] = useState(tokenConfig[1].symbol);
    const [fromAmount, setFromAmount] = useState('');

    const fromTokenData = tokenConfig.find(t => t.symbol === fromToken);
    const userBalance = balances[fromToken] || '0';
    const hasSufficientBalance = parseFloat(fromAmount) <= parseFloat(userBalance);

    const getUnoSwapUrl = () => {
      const UNO_APP_ID = 'app_a4f7f3e62c1de0b9490a5260cb390b56';
      const toTokenData = tokenConfig.find(t => t.symbol === toToken);
      if (!fromTokenData || !toTokenData || !fromAmount || parseFloat(fromAmount) <= 0) return '#';
      const amountInWei = parseUnits(fromAmount as `${number}`, fromTokenData.decimals);
      const baseUrl = 'https://worldcoin.org/mini-app';
      const params = new URLSearchParams({
          app_id: UNO_APP_ID,
          tab: 'swap',
          fromToken: fromTokenData.contractAddress,
          toToken: toTokenData.contractAddress,
          amount: amountInWei.toString(),
      });
      return `${baseUrl}?${params.toString()}`;
    };

    return (
        <div className="w-full max-w-md">
          <p className="text-lg font-semibold mb-4">Intercambio</p>
          <div className="flex flex-col gap-1 p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
            <div className="bg-black/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Pagas</span>
                    <span className="text-sm text-gray-300">Balance: {parseFloat(userBalance).toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <input 
                        type="number"
                        placeholder="0.0"
                        className="bg-transparent text-3xl w-2/3 focus:outline-none"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                    />
                    <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-full">
                        <img src={fromTokenData?.logo} className="w-6 h-6 rounded-full" />
                        <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="bg-transparent font-bold focus:outline-none appearance-none">
                            {tokenConfig.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-black/20 p-4 rounded-lg">
                <span className="text-sm text-gray-300">Recibes (aprox.)</span>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-3xl text-gray-500">...</span>
                    <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-full">
                        <img src={tokenConfig.find(t => t.symbol === toToken)?.logo} className="w-6 h-6 rounded-full" />
                        <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="bg-transparent font-bold focus:outline-none appearance-none">
                            {tokenConfig.filter(t => t.symbol !== fromToken).map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <a 
                href={getUnoSwapUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center font-bold py-3 px-4 rounded-lg mt-3 transition-all ${(!fromAmount || parseFloat(fromAmount) <= 0 || !hasSufficientBalance) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                onClick={(e) => { if (!fromAmount || parseFloat(fromAmount) <= 0 || !hasSufficientBalance) e.preventDefault(); }}
            >
                {!fromAmount || parseFloat(fromAmount) <= 0 ? 'Introduce una cantidad' : !hasSufficientBalance ? 'Balance insuficiente' : 'Continuar en UNO'}
            </a>
          </div>
        </div>
    );
  }

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Wallet"
          endAdornment={
            session?.user && (
              <div className="flex items-center gap-2 pr-2">
                <p className="text-sm font-semibold capitalize text-white">
                  {session.user.username}
                </p>
                <Marble src={session.user.profilePictureUrl} className="w-8 h-8 rounded-full" />
              </div>
            )
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-12 px-4 py-6 text-white">
        <div className="w-full max-w-md">
          <p className="text-lg font-semibold mb-4">Mis Tokens</p>
          <div className="flex flex-col gap-4">
            {tokenConfig.map((token) => <TokenBalanceRow key={token.symbol} token={token} />)}
            {error && <span className="text-red-400 text-sm text-center">{error}</span>}
          </div>
        </div>
        <SwapInterface />
      </Page.Main>
    </>
  );
};

export default WalletPage;
