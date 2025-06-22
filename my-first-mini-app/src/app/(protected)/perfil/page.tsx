'use client';

import { Page } from '@/components/PageLayout';
import { UserInfo } from '@/components/UserInfo'; // Asegúrate de que la ruta a UserInfo sea correcta
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useState, ChangeEvent } from 'react';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession(); // Usamos `update` para refrescar la sesión
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(session?.user?.profilePictureUrl || null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Se ejecuta cuando el usuario selecciona un archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Creamos una URL local para la previsualización
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Se ejecuta cuando el usuario hace clic en "Guardar Cambios"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');
    setError(null);

    // Usamos FormData para enviar el archivo al backend
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch('/api/upload-profile', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal.');
      }
      
      setStatus('success');
      // ¡Importante! Refrescamos la sesión para que el UserInfo se actualice con la nueva URL
      await updateSession({ profilePictureUrl: data.url });

    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <Page>
      <Page.Header className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <UserInfo />
      </Page.Header>
      <Page.Main className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Tu Perfil</h1>
          
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 p-6 bg-gray-800 rounded-lg">
            <div className="relative">
              <img
                src={preview || 'https://placehold.co/128x128/374151/ffffff?text=?'}
                alt="Vista previa de la foto de perfil"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-600"
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
            
            {status === 'success' && <p className="text-green-400">¡Foto de perfil actualizada!</p>}
            {status === 'error' && <p className="text-red-400">{error}</p>}
          </form>
        </div>
      </Page.Main>
    </Page>
  );
  }
