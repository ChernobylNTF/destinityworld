'use client';

import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// Componente interno para el modelo 3D
const CoinModel = ({ ipfsUrl }: { ipfsUrl: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  const { scene } = useGLTF(ipfsUrl);
  
  const model = useMemo(() => scene.clone(), [scene]);

  // Animación de rotación continua
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={meshRef}>
      <primitive object={model} scale={1.5} />
    </group>
  );
};

// --- COMPONENTE DE CARGA (PLACEHOLDER) ---
// Se muestra mientras el modelo 3D se descarga.
const ModelPlaceholder = () => {
  return (
    <Html center>
      {/* Un círculo gris con animación de pulso */}
      <div className="w-48 h-48 rounded-full bg-gray-800 animate-pulse"></div>
    </Html>
  );
};

// --- COMPONENTE PRINCIPAL ACTUALIZADO ---
const SpinningCoin: React.FC<{ ipfsUrl?: string }> = ({ 
  ipfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq" 
}) => {
  // Precargamos el modelo para que la carga sea más rápida en futuras visitas
  useEffect(() => {
    if (ipfsUrl) {
      useGLTF.preload(ipfsUrl);
    }
  }, [ipfsUrl]);

  return (
    <div className="h-48 w-48 mx-auto">
      <Canvas>
        {/*
          Suspense ahora tiene un `fallback`. Este fallback se mostrará
          hasta que los componentes hijos (CoinModel) hayan terminado de cargar.
        */}
        <Suspense fallback={<ModelPlaceholder />}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#9580FF" intensity={0.5} />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          
          <CoinModel ipfsUrl={ipfsUrl} />

          <Environment preset="city" />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SpinningCoin;
