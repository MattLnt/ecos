'use client';

import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomBar } from '@/components/navigation/BottomBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />

      {/*
        --sidebar-w est mis à jour par <Sidebar /> : la marge suit donc l'état
        replié/déplié. En mobile, place réservée sous la BottomBar (h-16) plus
        l'encoche éventuelle.
      */}
      <main className="min-h-screen transition-[margin] duration-300 ml-[var(--sidebar-w)] mobile:ml-0 mobile:pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
        <div className="p-8 mobile:p-4 mobile:pt-5">
          {children}
        </div>
      </main>

      <BottomBar />
    </>
  );
}
