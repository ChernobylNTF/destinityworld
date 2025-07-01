import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto'; // <-- Importante: Añadir esto

// TIPOS (Sin cambios)
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

// Helper para verificar la firma del servidor (HMAC)
const verifySignedNonce = (nonce: string, signedNonce: string, secret: string): boolean => {
  const hmac = createHmac('sha256', secret).update(nonce).digest('hex');
  return hmac === signedNonce;
};

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
      // --- ESTA ES LA FUNCIÓN CORREGIDA ---
      authorize: async (credentials) => {
        try {
          const { finalPayloadJson, nonce, signedNonce } = credentials;

          if (!finalPayloadJson || !nonce || !signedNonce) {
            console.error("Faltan credenciales para la autorización.");
            return null;
          }

          // 1. Verificar la firma de TU SERVIDOR
          const secret = process.env.HMAC_SECRET_KEY;
          if (!secret) throw new Error("HMAC_SECRET_KEY no configurado.");

          const isNonceAuthentic = verifySignedNonce(nonce as string, signedNonce as string, secret);
          if (!isNonceAuthentic) {
            console.error("Fallo de autorización: HMAC inválido.");
            return null;
          }

          // 2. Verificar la firma del USUARIO
          const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson as string);
          const result = await verifySiweMessage(finalPayload, nonce as string);

          if (!result.isValid || !result.siweMessageData.address) {
            console.error("Fallo de autorización: Firma SIWE inválida.");
            return null;
          }
          
          // 3. Si todo es correcto, continuar con la base de datos
          const walletAddress = result.siweMessageData.address.toLowerCase();
          const userInfo = await MiniKit.getUserInfo(walletAddress);

          const userInDb = await prisma.user.upsert({
            where: { walletAddress },
            update: { username: userInfo.username },
            create: {
              walletAddress,
              id: walletAddress,
              username: userInfo.username,
              profilePictureUrl: userInfo.profilePictureUrl,
              streak: 0,
            },
          });

          return userInDb;

        } catch (error) {
          console.error("Error en el proceso de authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Tus callbacks están perfectos, no necesitan cambios
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
