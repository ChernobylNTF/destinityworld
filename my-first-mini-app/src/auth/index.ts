import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client'; // 1. Importar PrismaClient

// --- TIPOS (Sin cambios) ---
export type User = {
  walletAddress?: string
  username?: string
  profilePictureUrl?: string
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

// 2. Crear una instancia de Prisma
const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: { /* ... */ },
      authorize: async ({ finalPayloadJson, nonce }: { finalPayloadJson: string; nonce: string; }) => {
        // --- Verificación (Sin cambios) ---
        const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);
        if (!result.isValid || !result.siweMessageData.address) {
          return null;
        }
        
        const walletAddress = result.siweMessageData.address.toLowerCase();
        
        // --- LÓGICA DE BASE DE DATOS (AÑADIDA) ---
        try {
          // Obtener información del usuario de Worldcoin
          const userInfo = await MiniKit.getUserInfo(walletAddress);

          // Hacer "upsert" en la base de datos
          const userInDb = await prisma.user.upsert({
            where: { walletAddress: walletAddress }, // Buscar por la dirección de la billetera
            update: {
              // Si el usuario ya existe, actualizamos su info por si ha cambiado
              username: userInfo.username,
              profilePictureUrl: userInfo.profilePictureUrl,
            },
            create: {
              // Si el usuario no existe, lo creamos
              walletAddress: walletAddress,
              id: walletAddress, // Usamos la dirección como ID principal también
              username: userInfo.username,
              profilePictureUrl: userInfo.profilePictureUrl,
              streak: 0, // Un nuevo usuario empieza con racha 0
            },
          });

          // Devolver el usuario de la base de datos para crear la sesión
          return {
            id: userInDb.id,
            walletAddress: userInDb.walletAddress,
            username: userInDb.username,
            profilePictureUrl: userInDb.profilePictureUrl,
            streak: userInDb.streak,
          };

        } catch (dbError) {
          console.error("Error de base de datos en authorize:", dbError);
          return null; // Si hay un error con la BD, no se autoriza
        }
      },
    }),
  ],
  callbacks: {
    // --- Callbacks (Sin cambios) ---
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
