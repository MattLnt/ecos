'use client';

import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomBar } from '@/components/navigation/BottomBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      
      <main className="min-h-screen transition-all duration-300 ml-[260px] mobile:ml-0 mobile:pb-20">
        <div className="p-8 mobile:p-4">
          {children}
        </div>
      </main>
      
      <BottomBar />
    </>
  );
}