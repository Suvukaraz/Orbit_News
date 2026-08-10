import React, { useState } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { ChevronDown, Check } from 'lucide-react';

export const SourceFilter: React.FC = () => {
  const { sourceFilter, setSourceFilter, lemmyCommunities } = useFeedStore();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'all', label: 'Combined Feed', icon: '🌀' },
    { value: 'hn', label: 'Hacker News', icon: '🔶' },
    ...lemmyCommunities.map(c => ({
      value: c.filterKey,
      label: c.label,
      icon: '🟣'
    })),
  ];

  const activeOption = options.find(o => o.value === sourceFilter) || options[0];

  return (
    <div className="relative w-[132px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 hover-surface border border-theme rounded-xl transition-all"
      >
        <span className="shrink-0 text-accent">
          {typeof activeOption.icon === 'string' ? activeOption.icon : activeOption.icon}
        </span>
        <span className="min-w-0 max-w-[90px] truncate text-sm font-semibold text-theme">
          {activeOption.label}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 max-h-[70vh] overflow-y-auto bg-surface border border-theme rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Source</span>
            </div>
            {options.map((opt) => {
              const active = sourceFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSourceFilter(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                    active ? 'bg-accent/10 text-accent' : 'text-theme hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{opt.icon}</span>
                    <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{opt.label}</span>
                  </div>
                  {active && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

