'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Users, BarChart3, Calendar, Menu } from 'lucide-react';

const navItems = [
  { href: '/home', label: 'Accueil', icon: Home },
  { href: '/joueurs', label: 'Joueurs', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: Calendar },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  // { href: '/terrains', label: 'Terrains', icon: MapPin }, // CACHÉ POUR LE MOMENT
];

const EXPANDED_W = '260px';
const COLLAPSED_W = '72px';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // La marge du <main> suit la sidebar via --sidebar-w, sinon le contenu
  // reste décalé de 260px quand on replie le menu.
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-w',
      collapsed ? COLLAPSED_W : EXPANDED_W
    );
  }, [collapsed]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  return (
    // Sur mobile la navigation est assurée par <BottomBar /> : la sidebar est
    // simplement retirée du flux, pas de tiroir ni de hamburger qui viendrait
    // recouvrir les en-têtes de page.
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0A1628] border-r border-[rgba(0,191,255,0.1)] z-50 transition-all duration-300 shadow-[2px_0_20px_rgba(0,0,0,0.3)] flex flex-col mobile:hidden ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Header avec logo + hamburger */}
      <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-[rgba(0,191,255,0.1)]">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#00BFFF] to-[#0088cc] rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(0,191,255,0.3)]">
                <Image src="/ecos.png" alt="ECOS" width={24} height={24} />
              </div>
              <span className="font-extrabold text-lg text-[#F5F1E8] tracking-tight">ECOS</span>
            </div>

            <button
              onClick={toggleSidebar}
              className="w-8 h-8 hover:bg-[rgba(0,191,255,0.1)] rounded-lg flex items-center justify-center transition-colors"
              aria-label="Replier le menu"
            >
              <Menu size={18} className="text-[rgba(245,241,232,0.7)]" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 bg-gradient-to-br from-[#00BFFF] to-[#0088cc] rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(0,191,255,0.3)] mx-auto hover:scale-105 transition-transform"
            aria-label="Déplier le menu"
          >
            <Image src="/ecos.png" alt="ECOS" width={24} height={24} />
          </button>
        )}
      </div>

      {/* Menu label */}
      {!collapsed && (
        <div className="px-5 py-3">
          <span className="text-[11px] font-bold text-[rgba(245,241,232,0.35)] uppercase tracking-wider">Menu</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-3 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-gradient-to-r from-[#00BFFF] to-[#0088cc] text-[#0A1628] shadow-[0_4px_12px_rgba(0,191,255,0.3)]'
                  : 'text-[rgba(245,241,232,0.7)] hover:bg-[rgba(0,191,255,0.08)] hover:text-[#F5F1E8]'
              }`}
            >
              <Icon
                size={20}
                className={`shrink-0 ${isActive ? 'text-[#0A1628]' : 'text-[rgba(245,241,232,0.55)] group-hover:text-[#00BFFF]'}`}
              />
              {!collapsed && (
                <span className="font-semibold text-[15px]">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer section */}
      {!collapsed && (
        <div className="p-4 border-t border-[rgba(0,191,255,0.1)]">
          <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] rounded-xl p-4 border border-[rgba(0,191,255,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00BFFF] to-[#0088cc] rounded-full flex items-center justify-center text-[#0A1628] font-bold text-sm shadow-[0_4px_12px_rgba(0,191,255,0.3)]">
                EC
              </div>
              <div>
                <div className="font-bold text-sm text-[#F5F1E8]">ECOS Club</div>
                <div className="text-xs text-[rgba(245,241,232,0.55)]">Éguilles</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
