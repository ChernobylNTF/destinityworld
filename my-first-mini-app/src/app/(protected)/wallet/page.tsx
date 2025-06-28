'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo } from 'react';

// VIEM para interactuar con la Blockchain
import { createPublicClient, http, formatUnits } from 'viem';
import { worldchain } from 'viem/chains'; // Usas Worldchain, ¡correcto!

// ABI de tu contrato de token DWD
import chrn_abiABI from '@/abi/chrn_abi.json'; 

// --- Configuración ---
// Dirección del contrato DWD en Worldchain
const myContractToken = '0xC418B282F205C3F4942451676dd064496Ee69bE4'; 
// RPC público para la red de pruebas de Worldchain (Sepolia)
const WORLDCHAIN_RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';

const WalletPage = () => {
  const { data: session, status: sessionStatus } = useSession();

  // --- CORRECCIÓN CRÍTICA ---
  // Obtenemos la dirección de la billetera de forma segura desde la sesión de NextAuth.
  const walletAddress = session?.user?.walletAddress;

  const [chrnBalance, setChrnBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usamos `useMemo` para crear el cliente de viem solo una vez y evitar recrearlo en cada render.
  const publicClient = useMemo(() => createPublicClient({
    chain: worldchain,
    transport: http(WORLDCHAIN_RPC_URL),
  }), []);

  // useEffect para buscar el balance cuando la dirección de la billetera esté disponible.
  useEffect(() => {
    const fetchDwdBalance = async () => {
      if (!walletAddress) {
        setIsLoadingBalance(false);
        return;
      }
      
      setIsLoadingBalance(true);
      setError(null);

      try {
        const balanceBigInt = await publicClient.readContract({
          address: myContractToken,
          abi: chrn_abiABI as any,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
        });
        
        // Formateamos el balance a un número legible (asumiendo 18 decimales)
        const formattedBalance = formatUnits(balanceBigInt as bigint, 18);
        setChrnBalance(formattedBalance);

      } catch (err) {
        console.error('Error al obtener el balance de CHRN:', err);
        setError('No se pudo cargar el balance.');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchChrnBalance();
  }, [walletAddress, publicClient]); // Se ejecuta cuando walletAddress o publicClient cambian

  // Función para renderizar el contenido del balance
  const renderBalance = () => {
    if (isLoadingBalance) {
      return <div className="h-7 w-28 bg-gray-700 rounded-md animate-pulse"></div>;
    }
    if (error) {
      return <span className="text-red-400 text-sm">{error}</span>;
    }
    if (chrnBalance !== null) {
      // Usamos toFixed para mostrar un número consistente de decimales
      return <span className="text-2xl font-bold">{parseFloat(chrnBalance).toFixed(4)}</span>;
    }
    return '0.0000';
  };

  return (
    <>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
        <TopBar
          title="Wallet"
          endAdornment={
            sessionStatus === 'authenticated' && (
              <div className="flex items-center gap-2 pr-2">
                <p className="text-sm font-semibold capitalize text-white">
                  {session.user.username}
                </p>
                <Marble src={session.user.profilePictureUrl} className="w-8 h-8" />
              </div>
            )
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-8 px-4 py-6 text-white">
        <div className="w-full max-w-md">
          <p className="text-lg font-semibold mb-4">Información de la Billetera</p>
          <div className="flex flex-col gap-3 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-sm text-gray-400">Dirección Conectada</div>
            {walletAddress ? (
              <a
                href={`https://sepolia.worldscan.org/address/${walletAddress}`} // Enlace al explorador de Worldchain Sepolia
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-base text-blue-400 break-words hover:underline"
                title="Ver en el explorador"
              >
                {walletAddress}
              </a>
            ) : (
              <div className="h-6 w-full bg-gray-700 rounded-md animate-pulse"></div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md">
          <p className="text-lg font-semibold mb-4">Balance de Tokens</p>
          <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
             <div className="flex items-center">
                {/* Puedes poner un ícono real de tu token aquí */}
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold mr-4">CHRN</div>
                <span className="text-xl font-bold"></span>
            </div>
            {renderBalance()}
          </div>
        </div>
      </Page.Main>
    </>
  );
};

export default WalletPage;
