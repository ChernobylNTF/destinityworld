import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // O tu método para obtener la sesión
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  // 1. Proteger la ruta y obtener el ID del usuario
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 2. Obtener la nueva URL del cuerpo de la petición
    const { imageUrl } = await request.json();
    if (typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'URL de imagen no válida' }, { status: 400 });
    }

    // 3. Actualizar la base de datos con Prisma
    await prisma.user.update({
      where: {
        walletAddress: session.user.id,
      },
      data: {
        // Asegúrate de que el campo en tu modelo se llame 'image' o similar
        profilePictureUrl: imageUrl,
      },
    });

    // 4. Devolver una respuesta exitosa
    return NextResponse.json({ message: 'Foto de perfil actualizada' });
    
  } catch (error) {
    console.error('Error al actualizar el avatar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
