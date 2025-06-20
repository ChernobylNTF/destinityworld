'use client';

import { Page } from '@/components/PageLayout';
import { TopBar, Marble, Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { auth } from '@/auth'; // Necesitamos obtener la sesión para obtener la dirección de la billetera
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import DWDABI from '@/abi/DWD.json'; // Asegúrate de que la ruta sea correcta
import { createPublicClient, http, formatUnits } from 'viem';
import { worldchain } from 'viem/chains';

// Dirección del contrato DWD
const contractAddress = '0x55E6C9C22C0eaD68F0be7CdcB5d8BAa636a8A1a0'; // Dirección de tu contrato DWD

const WalletPage = () => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;
  const [dwdBalance, setDwdBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Configurar el cliente viem una vez
  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-sepolia.g.alchemy.com/public'),
  });

  // Función para obtener el balance de DWD
  const fetchDwdBalance = async () => {
    if (!walletAddress || !publicClient) return;
    setLoadingBalance(true);
    try {
      const balance = await publicClient.readContract({
        address: contractAddress as `0x${string}`, // Dirección del contrato DWD
        abi: DWDABI.abi as any,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });
      // Formatear el balance (DWD tiene 18 decimales)
      const formattedBalance = formatUnits(balance as bigint, 18);
      setDwdBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching DWD balance:', error);
      setDwdBalance('Error');
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchDwdBalance();
    }
  }, [walletAddress, publicClient]); // Dependencias para re-ejecutar si cambian

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Wallet"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <div className="grid w-full gap-4">
          <p className="text-lg font-semibold">Información de la Billetera</p>
          <div className="flex flex-col gap-2 p-4 border border-gray-700 rounded-lg">
            <p>
              <strong>Dirección:</strong>{' '}
              {walletAddress ? (
                <a
                  href={`https://worldscan.org/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {walletAddress}
                </a>
              ) : (
                'Cargando...'
              )}
            </p>
            <p>
              <strong>Balance DWD:</strong>{' '}
              {loadingBalance
                ? 'Cargando...'
                : dwdBalance !== null
                ? dwdBalance
                : 'No disponible'}
            </p>
          </div>
        </div>

        {/* Aquí podrías añadir más detalles o funcionalidades de billetera */}
      </Page.Main>
    </>
  );
};

export default WalletPage;
