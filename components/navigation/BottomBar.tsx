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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A1628] border-t border-[rgba(0,191,255,0.1)] backdrop-blur-md z-50 hidden mobile:block safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-[#00BFFF]' : 'text-[rgba(245,241,232,0.5)]'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}