import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // O tu método para obtener la sesión

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Proteger la ruta
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Obtener el archivo del FormData
  const form = await request.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No se encontró ningún archivo.' }, { status: 400 });
  }

  // 3. Crear un nombre único y subir a Vercel Blob
  const pathname = `avatars/${session.user.id}-${file.name}`;
  const blob = await put(pathname, file, {
    access: 'public',
  });

  // 4. Devolver la URL del archivo subido
  return NextResponse.json(blob);
}
