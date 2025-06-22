'use client';

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// Tu componente CoinModel original (sin cambios)
const CoinModel = ({ ipfsUrl }: { ipfsUrl: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const [modelLoaded, setModelLoaded] = useState(false);
  const { scene } = useGLTF(ipfsUrl, true);
  const model = scene.clone();

  useEffect(() => {
    invalidate();
    setModelLoaded(true);
    return () => {
      if (ipfsUrl) {
        useGLTF.clear(ipfsUrl);
      }
    };
  }, [ipfsUrl, invalidate]);

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

// --- NUEVO COMPONENTE DE CARGA (PLACEHOLDER) ---
// Este es el único bloque de código nuevo.
const ModelPlaceholder = () => {
  return (
    <Html center>
      <div className="w-4 h-4 rounded-full bg-gray-800 animate-pulse"></div>
    </Html>
  );
};

// Tu componente SpinningCoin principal, ahora con Suspense
const SpinningCoin: React.FC<{ ipfsUrl?: string }> = ({ 
  ipfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq" 
}) => {
  const [key, setKey] = useState(Date.now());

  useEffect(() => {
    setKey(Date.now());
    if (ipfsUrl) {
      useGLTF.preload(ipfsUrl);
    }
  }, [ipfsUrl]);

  return (
    // He ajustado el tamaño del div contenedor para que coincida con el placeholder
    <div className="h-48 w-48 mx-auto"> 
      <Canvas key={`canvas-${key}`}>
        {/*
          LA ÚNICA MODIFICACIÓN:
          He envuelto toda tu escena en <Suspense> y le he añadido el fallback.
          Tus luces, cámara y controles están dentro, sin cambios.
        */}
        <Suspense fallback={<ModelPlaceholder />}>
          {/* Tu configuración de luces y cámara original (sin cambios) */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#9580FF" intensity={0.5} />
          <PerspectiveCamera makeDefault position={[0, 0, 4]} />
          
          <CoinModel ipfsUrl={ipfsUrl} />
          <Environment preset="city" />
          
          {/* Tus controles de órbita originales (sin cambios) */}
          <OrbitControls enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SpinningCoin;
