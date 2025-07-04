'use client';

// Tus imports originales
import { AuthButton } from '@/components/AuthButton';
import SpinningCoin from '@/components/SpinningCoin';

// --- IMPORTS AÑADIDOS ---
import { useState } from 'react';
import { Verify } from '@/components/Verify'; // Asumo que este componente existe
// La importación de useRouter ha sido eliminada.

const coinIpfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq";

export default function CustomLoginPage() {
  
  // --- LÓGICA AÑADIDA ---
  // Se elimina la línea: const router = useRouter();
  
  // Un estado simple para saber si la wallet está conectada.
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Tu AuthButton debe llamar a esta función cuando se conecte exitosamente.
  const handleConnectSuccess = () => {
    setIsWalletConnected(true);
  };

  // El componente Verify llamará a esta función cuando la verificación sea exitosa.
  const handleVerificationSuccess = () => {
    // Se reemplaza router.push por una función nativa del navegador.
    window.location.href = '/Home'; 
  };
  // --- FIN DE LA LÓGICA AÑADIDA ---

  const neonTextStyle = {
    textShadow: `
      0 0 5px rgba(0, 191, 255, 0.7),
      0 0 10px rgba(0, 191, 255, 0.7),
      0 0 20px rgba(0, 191, 255, 0.5),
      0 0 40px rgba(0, 191, 255, 0.3)
    `,
  };

  return (
    <main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
      <div className="flex flex-col items-center justify-center text-center gap-10">
        
        <h1 
          className="text-7xl md:text-8xl font-black text-white tracking-widest"
          style={{ textShadow: '0px 4px 15px rgba(0,0,0,0.5)' }}
        >
          DESTINITY
        </h1>

        <div className="w-full max-w-sm p-8 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            
            {/* --- LÓGICA DE VISUALIZACIÓN --- */}

            {!isWalletConnected ? (
              // Si la wallet NO está conectada, muestra tu botón original.
              <>
                <p className="text-gray-300">
                  Conéctate para empezar tu viaje y reclamar tus recompensas.
                </p>
                <AuthButton
                  onConnectSuccess={handleConnectSuccess} // Le pasas la función al botón.
                  className="bg-black rounded-lg p-4 border border-transparent hover:border-cyan-400 transition-all duration-300 group"
                >
                  <span 
                    className="text-xl font-bold text-white transition-all duration-300 group-hover:text-cyan-300"
                    style={neonTextStyle}
                  >
                    Conectar Wallet
                  </span>
                </AuthButton>
              </>
            ) : (
              // Si la wallet SÍ está conectada, muestra el componente Verify.
              <Verify onSuccess={handleVerificationSuccess} />
            )}

          </div>
        </div>

      </div>
    </main>
  );
}
