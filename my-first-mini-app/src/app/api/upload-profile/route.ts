import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Para obtener la sesión del usuario en el servidor
import { put } from '@vercel/blob'; // La función para subir archivos a Vercel Blob
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Inicializamos el cliente de Prisma con Accelerate
const prisma = new PrismaClient().$extends(withAccelerate());

// Esta función manejará las peticiones POST a /api/upload-profile
export async function POST(request: Request) {
  // Obtenemos la sesión del usuario del lado del servidor para máxima seguridad
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Procesar el formulario que contiene la imagen
  const formData = await request.formData();
  const file = formData.get('profilePicture') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No se ha subido ningún archivo.' }, { status: 400 });
  }

  try {
    // 3. Subir el archivo a Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      pathname: `profile-pictures/${session.user.id}/${file.name}`,
    });

    // 4. Actualizar la Base de Datos con la nueva URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePictureUrl: blob.url },
    });

    // 5. Devolver la respuesta con la nueva URL
    return NextResponse.json({ url: blob.url });

  } catch (error) {
    console.error('Error al subir el archivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
      }
