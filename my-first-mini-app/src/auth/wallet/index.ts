'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { signIn } from 'next-auth/react';
import { getNewNonces } from './server-helpers';
import crypto from 'crypto';

/**
 * Authenticates a user via their wallet using a nonce-based challenge-response mechanism.
 */
export const walletAuth = async () => {
  const { nonce, signedNonce } = await getNewNonces();

  const result = await MiniKit.commandsAsync.walletAuth({
    nonce,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    statement: `Authenticate (${crypto.randomUUID().replace(/-/g, '')}).`,
  });
  
  if (!result) {
    throw new Error('No response from wallet auth');
  }

  if (result.finalPayload.status !== 'success') {
    console.error(
      'Wallet authentication failed',
      result.finalPayload.error_code,
    );
    return;
  }
  
  // --- CORRECCIÓN AQUÍ ---
  // Cambiamos `redirectTo: '/home'` por `redirectTo: '/'` para que
  // te redirija a tu página principal real en lugar de a una que no existe.
  await signIn('credentials', {
    redirectTo: '/',
    nonce,
    signedNonce,
    finalPayloadJson: JSON.stringify(result.finalPayload),
  });
};
