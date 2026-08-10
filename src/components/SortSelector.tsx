import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFeedStore } from '../stores/feedStore';
import { SORT_OPTIONS } from '../types';
import type { SortMode } from '../types';
import { Flame, Clock, Trophy, Zap, MessageSquare, ChevronDown, Check } from 'lucide-react';

const SORT_ICONS: Record<SortMode, React.ElementType> = {
  hot: Flame,
  new: Clock,
  top: Trophy,
  active: Zap,
  comments: MessageSquare,
};

export const SortSelector: React.FC = () => {
  const { sortMode, setSortMode } = useFeedStore();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 8, maxHeight: 320 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const top = Math.round(rect.bottom + 8);
      setMenuPosition({
        top,
        right: Math.max(8, Math.round(window.innerWidth - rect.right)),
        maxHeight: Math.max(120, Math.round(window.innerHeight - top - 16)),
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen]);

  const current = SORT_OPTIONS.find(o => o.value === sortMode)!;
  const CurrentIcon = SORT_ICONS[sortMode];

  const handleSelect = (mode: SortMode) => {
    setSortMode(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative w-[132px]" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 hover-surface border border-theme rounded-xl transition-all"
      >
        <CurrentIcon size={15} className="shrink-0 text-accent" />
        <span className="min-w-0 truncate text-theme">{current.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[100] w-56 overflow-y-auto rounded-xl border border-theme bg-surface shadow-2xl animate-slide-down"
          style={{
            top: menuPosition.top,
            right: menuPosition.right,
            maxHeight: menuPosition.maxHeight,
          }}
        >
          <div className="p-1.5">
            {SORT_OPTIONS.map(option => {
              const Icon = SORT_ICONS[option.value];
              const active = sortMode === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  role="menuitemradio"
                  aria-checked={active}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover-surface"
                  style={active ? { backgroundColor: 'var(--c-accent-soft)' } : undefined}
                >
                  <Icon size={17} className={active ? 'text-accent' : 'text-muted'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${active ? 'text-accent' : 'text-theme'}`}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-muted truncate">{option.description}</p>
                  </div>
                  {active && <Check size={15} className="text-accent" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

