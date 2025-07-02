'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Page } from '@/components/PageLayout';
import { Button, TopBar, Marble } from '@worldcoin/mini-apps-ui-kit-react';

export default function ProfilePage() {
  const { data: session } = useSession();

  // Estados para manejar el formulario de subida
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(session?.user?.profilePictureUrl || null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Se actualiza la previsualización cuando el usuario elige un archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Orquesta la subida y la recarga de la página
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      // 1. Subir la imagen
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) throw new Error('Error al subir la imagen.');
      const blob = await uploadResponse.json();
      const imageUrl = blob.url;

      // 2. Actualizar la base de datos
      const updateUserResponse = await fetch('/api/user/update-avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!updateUserResponse.ok) throw new Error('Error al actualizar el perfil.');

      // 3. Mostrar éxito y forzar recarga
      setStatus('success');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <Page>
      <Page.Header className="p-0 bg-gradient-to-br from-gray-900 to-blue-900">
        <TopBar
          title="Perfil"
          endAdornment={
            session?.user && (
              <div className="flex items-center gap-2 pr-2">
                <p className="text-sm font-semibold capitalize text-white">
                  {session.user.username}
                </p>
                <Marble src={session.user.profilePictureUrl} className="w-8 h-8 rounded-full" />
              </div>
            )
          }
        />
      </Page.Header>
      
      <Page.Main className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Editar Perfil</h1>
          
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
            <div className="relative">
              <img
                src={preview || 'https://placehold.co/128x128/374151/ffffff?text=?'}
                alt="Vista previa de la foto de perfil"
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
              />
              <label 
                htmlFor="profilePictureInput" 
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                title="Cambiar foto"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
              </label>
              <input
                id="profilePictureInput"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <Button
              type="submit"
              disabled={!file || status === 'uploading'}
              size="lg"
              className="w-full"
              variant="primary"
            >
              {status === 'uploading' ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            
            {status === 'success' && <p className="text-green-400">¡Perfil actualizado! La página se recargará...</p>}
            {status === 'error' && <p className="text-red-400">{error}</p>}
          </form>
        </div>
      </Page.Main>
    </Page>
  );
}
