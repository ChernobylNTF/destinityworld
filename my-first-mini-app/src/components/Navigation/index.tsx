'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
// Usaremos íconos de la librería 'iconoir-react' que ya tienes en tu proyecto
import { Home, Wallet, DatabaseLock, Ranking, User, InfoCircle } from 'iconoir-react';

// Definimos los elementos de la navegación en un array para un código más limpio
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/staking', label: 'Staking', icon: DatabaseLock },
  { href: '/ranking', label: 'Ranking', icon: Ranking },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/info', label: 'Info', icon: InfoCircle },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    // La barra de navegación ahora tiene un fondo un poco más oscuro
    <div className="w-full bg-gray-900 border-t border-gray-700">
      <nav className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          // Comprobamos si el enlace actual es la página activa
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                // Clases base para todos los botones
                'flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-full transition-all duration-300 ease-in-out',
                {
                  // Clases especiales solo para el botón ACTIVO
                  'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30': isActive,
                  // Clases para los botones INACTIVOS
                  'text-gray-400 hover:text-white hover:bg-gray-800': !isActive,
                }
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
