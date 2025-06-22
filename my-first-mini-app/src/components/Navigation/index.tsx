'use client';

import Link from 'next/link';

const Navigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gray-800 text-white py-2 z-10">
      <ul className="flex justify-around">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/wallet">Wallet</Link>
        </li>
        <li>
          <Link href="/staking">Staking</Link>
        </li>
        <li>
          <Link href="/perfil">Perfil</Link>Link>
        </li>
        <li>
          <Link href="/info">Info</Link> {/* Cambiamos el texto y la ruta a /info */}
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
