
import clsx from 'clsx';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * This component is a simple page layout component to help with design consistency
 * Feel free to modify this component to fit your needs
 */
export const Page = (props: { children: ReactNode; className?: string }) => {
  return (
    <div className={twMerge('flex h-dvh flex-col', props.className)}>
      {props.children}
    </div>
  );
};

const Header = (props: { children: ReactNode; className?: string }) => {
  return (
    <header
      className={twMerge(
        'bg-white flex flex-col justify-center px-6 pt-6 pb-3 z-10',
        clsx(props.className),
      )}
    >
      {props.children}
    </header>
  );
};

const Main = (props: { children: ReactNode; className?: string }) => {
  return (
    <main
      className={twMerge(
        // Añadido padding-bottom para hacer espacio al footer fijo
        'grow overflow-y-auto p-6 pt-3 pb-20', // Aumenté el padding-bottom para asegurar espacio para el footer
        clsx(props.className),
      )}
    >
      {props.children}
    </main>
  );
};

const Footer = (props: { children: ReactNode; className?: string }) => {
  return (
    // El footer ya tiene 'fixed bottom-0 w-full' que lo coloca correctamente
    <footer className={twMerge('px-0', clsx(props.className))}>
      {props.children}
    </footer>
  );
};

Page.Header = Header;
Page.Main = Main;
Page.Footer = Footer;
---
