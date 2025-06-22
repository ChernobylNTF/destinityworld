import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Inicializamos el cliente de Prisma con Accelerate
const prisma = new PrismaClient().$extends(withAccelerate());

// Esta función manejará las peticiones GET a /api/ranking
export async function GET() {
  try {
    // 1. Buscamos a los usuarios en la base de datos
    const users = await prisma.user.findMany({
      // 2. Ordenamos por racha, de mayor a menor
      orderBy: {
        streak: 'desc',
      },
      // 3. Limitamos los resultados a los primeros 100
      take: 100,
      // 4. Seleccionamos solo los campos necesarios
      select: {
        username: true,
        profilePictureUrl: true,
        streak: true,
      },
    });

    // 5. Devolvemos la lista
    return NextResponse.json(users);

  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el ranking.' },
      { status: 500 }
    );
  }
}
