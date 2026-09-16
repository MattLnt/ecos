'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BarChart3, Calendar, MapPin } from 'lucide-react';

const navItems = [
  { href: '/home', label: 'Accueil', icon: Home },
  { href: '/joueurs', label: 'Joueurs', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: Calendar },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/terrains', label: 'Terrains', icon: MapPin },
];

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[rgba(10,22,40,0.92)] border-t border-[rgba(0,191,255,0.12)] backdrop-blur-md z-50 hidden mobile:block pb-safe-b">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 px-1 transition-colors active:scale-95 ${
                isActive ? 'text-[#00BFFF]' : 'text-[rgba(245,241,232,0.5)]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#00BFFF]" />
              )}
              <Icon size={21} />
              <span className="text-[10px] font-semibold leading-none truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
