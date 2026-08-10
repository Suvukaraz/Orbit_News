import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Settings } from 'lucide-react';
import { OrbitLogo } from './OrbitLogo';
import { useIsDesktop } from '../App';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const isDesktop = useIsDesktop();

  if (!isDesktop) return null;

  const navItems = [
    { to: '/', icon: Home, label: 'Feed' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="flex flex-col w-64 h-full border-r border-theme bg-surface-alt/50 backdrop-blur-xl shrink-0">
      <div className="p-8 flex items-center gap-3">
        <OrbitLogo size={40} />
        <span className="text-xl font-bold text-theme tracking-tight">Orbit News</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-accent text-black font-bold shadow-lg shadow-accent/20'
                  : 'text-muted hover:text-theme hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-sm font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <div className="p-4 rounded-2xl bg-surface border border-theme">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-theme">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
