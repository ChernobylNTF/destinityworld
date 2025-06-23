import { hashNonce } from '@/auth/wallet/client-helpers';
import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Declaramos los tipos para incluir los nuevos campos
  export type User = {
	walletAddress?: string
	username?: string
	profilePictureUrl?: string
	permissions?: {
		notifications: boolean
		contacts: boolean
	}
	optedIntoOptionalAnalytics?: boolean
	worldAppVersion?: number
	deviceOS?: string
  streak?: number
  }
  

  interface Session {
    user: {
      walletAddress?: string;
      username?: string;
      profilePictureUrl?: string;
      streak?: number; 
    } & DefaultSession['user'];
  }

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: {
        nonce: { label: 'Nonce', type: 'text' },
        signedNonce: { label: 'Signed Nonce', type: 'text' },
        finalPayloadJson: { label: 'Final Payload', type: 'text' },
      },
      authorize: async ({ nonce, signedNonce, finalPayloadJson }: { nonce: string; signedNonce: string; finalPayloadJson: string; }) => {
        // ... (Tu lógica de verificación existente)
        const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);
        if (!result.isValid || !result.siweMessageData.address) {
          return null;
        }
        
        const userInfo = await MiniKit.getUserInfo(finalPayload.address);

        // Aquí conectarías a tu base de datos para obtener la racha del usuario.
        const userFromYourDb = { streak: 15 }; // Valor de ejemplo

        return {
          id: finalPayload.address,
          walletAddress: finalPayload.address, // La dirección viene del payload
          ...userInfo,
          streak: userFromYourDb.streak, 
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
        token.streak = user.streak; 
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string;
        session.user.profilePictureUrl = token.profilePictureUrl as string;
        session.user.streak = token.streak as number; 
      }
      return session;
    },
  },
});
