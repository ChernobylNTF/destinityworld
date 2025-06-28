import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: 'No autorizado o dirección de billetera no encontrada en la sesión' }, { status: 401 });
  }

  try {
    const { imageUrl } = await request.json();
    if (typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'URL de imagen no válida' }, { status: 400 });
    }
    
    // Convertimos la dirección a minúsculas para asegurar consistencia
    const userWalletAddress = session.user.walletAddress.toLowerCase();

    // SOLUCIÓN: Usamos la búsqueda más simple y directa por walletAddress
    const updatedUser = await prisma.user.update({
      where: {
        // La búsqueda se hace directamente con el string de la dirección
        walletAddress: userWalletAddress, 
      },
      data: {
        profilePictureUrl: imageUrl,
      },
    });

    return NextResponse.json(updatedUser);
    
  } catch (error) {
    console.error('Error al actualizar el avatar:', error);
    // Si el error persiste, será el P2025, indicando que el walletAddress no está en la BD.
    return NextResponse.json({ error: 'No se pudo actualizar el perfil. Verifique que el usuario exista.' }, { status: 500 });
  }
}
