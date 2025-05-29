
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const CoinModel = ({ ipfsUrl }: { ipfsUrl: string }) => {
  const meshRef = useRef<THREE.Group>(null);
    const { invalidate } = useThree();
      const [modelLoaded, setModelLoaded] = useState(false);
        
          // Forzar la recarga del modelo 3D desde IPFS
            const { scene } = useGLTF(ipfsUrl, true); // true fuerza una recarga
              
                // Crear una copia del modelo original para evitar modificarlo directamente
                  const model = scene.clone();
                    
                      // Efecto para asegurar que el modelo está cargado y renderizado
                        useEffect(() => {
                            // Forzar una re-renderización
                                invalidate();
                                    setModelLoaded(true);
                                        
                                            return () => {
                                                  // Limpiar cuando el componente se desmonte
                                                        if (ipfsUrl) {
                                                                useGLTF.clear(ipfsUrl);
                                                                      }
                                                                          };
                                                                            }, [ipfsUrl, invalidate]);
                                                                              
                                                                                // Manejar la animación de rotación continua
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

                                                                                                                    interface SpinningCoinProps {
                                                                                                                      ipfsUrl?: string;
                                                                                                                      }

                                                                                                                      const SpinningCoin: React.FC<SpinningCoinProps> = ({ 
                                                                                                                        ipfsUrl = "https://gateway.pinata.cloud/ipfs/bafybeielalf3z7q7x7vngejt53qosizddaltox7laqngxjdqhf2vyn6egq" 
                                                                                                                        }) => {
                                                                                                                          const [key, setKey] = useState(Date.now());
                                                                                                                            
                                                                                                                              // Efectuar un cambio de key para forzar una recarga completa
                                                                                                                                useEffect(() => {
                                                                                                                                    setKey(Date.now());
                                                                                                                                        // Precargar el modelo
                                                                                                                                            useGLTF.preload(ipfsUrl);
                                                                                                                                              }, [ipfsUrl]);

                                                                                                                                                return (
                                                                                                                                                    <div className="h-150 w-150 mx-auto">
                                                                                                                                                          <Canvas key={`canvas-${key}`}>
                                                                                                                                                                  <ambientLight intensity={0.5} />
                                                                                                                                                                          <pointLight position={[10, 10, 10]} intensity={1} />
                                                                                                                                                                                  <pointLight position={[-10, -10, -10]} color="#9580FF" intensity={0.5} />
                                                                                                                                                                                          <PerspectiveCamera makeDefault position={[0, 0, 4]} />
                                                                                                                                                                                                  
                                                                                                                                                                                                          <Suspense fallback={null}>
                                                                                                                                                                                                                    <CoinModel ipfsUrl={ipfsUrl} />
                                                                                                                                                                                                                              <Environment preset="city" />
                                                                                                                                                                                                                                      </Suspense>
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                      <OrbitControls enableZoom={false} enablePan={false} />
                                                                                                                                                                                                                                                            </Canvas>
                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                  };

                                                                                                                                                                                                                                                                  export default SpinningCoin;