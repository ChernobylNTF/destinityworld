import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  const session = await auth();

  // PASO DE DEPURACIÓN: Imprimimos la sesión en la consola del servidor.
  // Esto nos dirá exactamente qué datos contiene.
  console.log('CONTENIDO DE LA SESIÓN:', session);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { imageUrl } = await request.json();
    if (typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'URL de imagen no válida' }, { status: 400 });
    }

    // Usaremos el walletAddress de la sesión si existe, si no, el id como respaldo.
    const userWalletAddress = session.user.walletAddress || session.user.id;

    // ACTUALIZACIÓN: Hacemos la búsqueda insensible a mayúsculas y minúsculas.
    const updatedUser = await prisma.user.update({
      where: {
        walletAddress: {
          equals: userWalletAddress, // Usamos el valor verificado de la billetera
          mode: 'insensitive',    // ¡IMPORTANTE! Ignora mayúsculas/minúsculas
        },
      },
      data: {
        profilePictureUrl: imageUrl,
      },
    });

    return NextResponse.json(updatedUser);
    
  } catch (error) {
    // Imprimimos el error específico para más detalles
    console.error('Error al actualizar el avatar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
