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

  // Estados para el Swap
  const [fromToken, setFromToken] = useState(tokenConfig[0].symbol);
  const [toToken, setToToken] = useState(tokenConfig[1].symbol);
  const [fromAmount, setFromAmount] = useState('');

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

  // --- Función para generar la URL del Quick Action de UNO ---
  const getUnoSwapUrl = () => {
    const UNO_APP_ID = 'app_a4f7f3e62c1de0b9490a5260cb390b56';
    
    const fromTokenData = tokenConfig.find(t => t.symbol === fromToken);
    const toTokenData = tokenConfig.find(t => t.symbol === toToken);
    
    if (!fromTokenData || !toTokenData || !fromAmount || parseFloat(fromAmount) <= 0) {
      return '#';
    }

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

  // --- Componente para renderizar la fila de un token ---
  const TokenBalanceRow = ({ token }: { token: typeof tokenConfig[0] }) => {
    const balance = balances[token.symbol];
    const displayBalance = balance ? parseFloat(balance).toFixed(4) : '0.0000';

    return (
      <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex items-center">
          <img src={token.logo} alt={`Logo de ${token.name}`} className="w-10 h-10 rounded-full mr-4" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/40x40/8B5CF6/FFFFFF?text=${token.symbol.charAt(0)}`; }} />
          <span className="text-xl font-bold">{token.symbol}</span>
        </div>
        {isLoading ? <div className="h-7 w-28 bg-gray-700 rounded-md animate-pulse"></div> : <span className="text-2xl font-bold">{displayBalance}</span>}
      </div>
    );
  };

  return (
    <>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
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
        {/* Sección de Balances */}
        <div className="w-full max-w-md">
          <p className="text-lg font-semibold mb-4">Mis Tokens</p>
          <div className="flex flex-col gap-4">
            {tokenConfig.map((token) => <TokenBalanceRow key={token.symbol} token={token} />)}
            {error && <span className="text-red-400 text-sm text-center">{error}</span>}
          </div>
        </div>

        {/* Sección de Intercambio (Swap) con Quick Action */}
        <div className="w-full max-w-md">
          <p className="text-lg font-semibold mb-4">Intercambio</p>
          <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded-lg">
            <div className="flex gap-4">
              <input 
                type="number"
                placeholder="0.0"
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
              />
              <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="bg-gray-800 border border-gray-700 text-white font-bold py-2 px-3 rounded-lg focus:outline-none">
                {tokenConfig.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-4">
                <span className="text-gray-400">Para:</span>
                <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="bg-gray-800 border border-gray-700 text-white font-bold py-2 px-3 rounded-lg focus:outline-none w-full">
                    {tokenConfig.filter(t => t.symbol !== fromToken).map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                </select>
            </div>
            
            <a 
                href={getUnoSwapUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-2 transition-opacity ${(!fromAmount || parseFloat(fromAmount) <= 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => { if (!fromAmount || parseFloat(fromAmount) <= 0) e.preventDefault(); }}
            >
                Intercambiar con UNO
            </a>
          </div>
        </div>
      </Page.Main>
    </>
  );
};

export default WalletPage;
