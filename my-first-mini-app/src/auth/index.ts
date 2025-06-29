import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';

// TIPOS
export type User = {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  streak?: number;
};

interface Session {
  user: {
    walletAddress?: string;
    username?: string;
    profilePictureUrl?: string;
    streak?: number;
  } & DefaultSession['user'];
}

const prisma = new PrismaClient();

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
      authorize: async ({ finalPayloadJson, nonce }: { finalPayloadJson: string; nonce: string }) => {
        const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);

        if (!result.isValid || !result.siweMessageData.address) {
          return null;
        }
        
        const walletAddress = result.siweMessageData.address.toLowerCase();
        
        try {
          const userInfo = await MiniKit.getUserInfo(walletAddress);

          const userInDb = await prisma.user.upsert({
            where: { walletAddress: walletAddress },
            // --- ESTE ES EL CAMBIO IMPORTANTE ---
            update: {
              // Si el usuario ya existe, solo actualizamos su username.
              // NO tocamos el profilePictureUrl para no borrar la foto personalizada.
              username: userInfo.username,
            },
            create: {
              // Si es un usuario nuevo, guardamos todo.
              walletAddress: walletAddress,
              id: walletAddress,
              username: userInfo.username,
              profilePictureUrl: userInfo.profilePictureUrl,
              streak: 0,
            },
          });

          // Devolvemos el usuario que ahora existe en nuestra base de datos
          return {
            id: userInDb.id,
            walletAddress: userInDb.walletAddress,
            username: userInDb.username,
            profilePictureUrl: userInDb.profilePictureUrl,
            streak: userInDb.streak,
          };

        } catch (dbError) {
          console.error("Error de base de datos en authorize:", dbError);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Los callbacks no necesitan cambios
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
