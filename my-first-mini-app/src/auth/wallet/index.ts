import { MiniKit } from '@worldcoin/minikit-js';
import { signIn } from 'next-auth/react';
import { getNewNonces } from './server-helpers';

/**
 * Authenticates a user and calls a success callback without redirecting.
 *
 * @param {() => void} onSuccess - The function to call after a successful sign-in.
 * @throws {Error} If wallet authentication fails at any step.
 */
export const walletAuth = async (onSuccess) => {
  try {
    const { nonce, signedNonce } = await getNewNonces();

    const result = await MiniKit.commandsAsync.walletAuth({
      nonce,
      expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
      statement: `Authenticate (${crypto.randomUUID().replace(/-/g, '')}).`,
    });

    if (!result || result.finalPayload.status !== 'success') {
      console.error(
        'Wallet authentication failed',
        result?.finalPayload?.error_code,
      );
      throw new Error('La autenticación de la wallet falló.');
    }

    // --- CAMBIO CLAVE AQUÍ ---
    // Usamos `redirect: false` para evitar que la página se recargue.
    const signInResult = await signIn('credentials', {
      redirect: false, // MUY IMPORTANTE: Evita la redirección automática.
      nonce,
      signedNonce,
      finalPayloadJson: JSON.stringify(result.finalPayload),
    });

    // Si el inicio de sesión no tuvo errores, llamamos a la función de éxito.
    if (signInResult && !signInResult.error) {
      onSuccess(); // Llama a la función que le pasamos (handleConnectSuccess).
    } else {
      throw new Error(signInResult?.error || 'El proceso de inicio de sesión falló.');
    }
  } catch (error) {
    console.error("Ocurrió un error durante la autenticación de la wallet:", error);
    // Re-lanza el error para que el componente que llama pueda manejarlo.
    throw error;
  }
};
