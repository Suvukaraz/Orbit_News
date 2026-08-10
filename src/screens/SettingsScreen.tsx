import React, { useState, useRef, useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { THEME_PRESETS, getTheme } from '../types';
import { OrbitLogo } from '../components/OrbitLogo';
import { useIsDesktop } from '../App';
import {
  LayoutList,
  LayoutGrid,
  ExternalLink,
  Code2,
  Palette,
  Check,
  Plus,
  Trash2,
  Globe,
  Settings,
  X,
  ChevronRight,
  Monitor,
  Smartphone,
  Zap,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    themeId,
    setThemeId,
    compactMode,
    toggleCompactMode,
    lemmyCommunities,
    addLemmyCommunity,
    deleteLemmyCommunity,
    resetCommunities,
    startPage,
    setStartPage,
    scrollPositions,
    setScrollPosition,
    viewMode,
    setViewMode,
  } = useFeedStore();

  const [newCommunity, setNewCommunity] = useState('');
  const [newInstance, setNewInstance] = useState('lemmy.world');
  const [showAdd, setShowAdd] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();

  // Restore scroll position
  useEffect(() => {
    if (scrollRef.current) {
      const savedPosition = scrollPositions['settings'];
      if (savedPosition) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: savedPosition, behavior: 'auto' });
        });
      }
    }
  }, [scrollPositions]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (scrollRef.current) {
        setScrollPosition('settings', scrollRef.current.scrollTop);
      }
    };
  }, [setScrollPosition]);

  const currentTheme = getTheme(themeId);

  const handleAdd = () => {
    if (!newCommunity.trim()) return;
    const community = newCommunity.trim().toLowerCase();
    const instance = newInstance.trim().toLowerCase();
    const label = `${community}@${instance}`;
    const filterKey = `lemmy:${community}@${instance}`;

    if (lemmyCommunities.some(c => c.filterKey === filterKey)) return;

    addLemmyCommunity({
      instance,
      community,
      label,
      filterKey,
    });

    setNewCommunity('');
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-xl border-b border-theme"
        style={{ backgroundColor: 'color-mix(in srgb, var(--c-surface-alt) 92%, transparent)' }}
      >
        <div className="max-w-4xl mx-auto w-full grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 py-2">
          <div className="flex items-center px-2 gap-2 overflow-hidden">
            <Settings size={20} className="text-accent shrink-0" />
            <h1 className="text-sm font-bold text-theme tracking-tight truncate">Settings</h1>
          </div>
          <div className="flex justify-center">
            <OrbitLogo size={40} className={isDesktop ? 'hidden' : 'lg:hidden'} />
            <div className={isDesktop ? 'block w-10' : 'hidden lg:block w-10'} />
          </div>
          <div className="min-w-0" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full px-4 py-4 space-y-6">
          {/* Theme selection button */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Palette size={14} className="text-accent" />
              <h2 className="text-xs font-bold text-muted uppercase tracking-widest">Appearance</h2>
            </div>
            <button
              onClick={() => setShowThemeModal(true)}
              className="w-full flex items-center justify-between px-4 py-4 bg-surface hover-surface rounded-2xl border border-theme transition-all group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl border border-theme shadow-lg"
                  style={{ background: currentTheme.preview }}
                />
                <div className="text-left">
                  <p className="text-sm font-bold text-theme">{currentTheme.name}</p>
                  <p className="text-[11px] text-muted">{currentTheme.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted group-hover:text-accent transition-colors">
                <span className="text-xs font-medium">Change Theme</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </section>

          {/* Layout */}
          <section>
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Layout</h2>

            <div className="flex flex-col gap-2 mb-4">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">View Mode</label>
              <div className="flex bg-surface p-1 rounded-xl border border-theme gap-1">
                <button
                  onClick={() => setViewMode('auto')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'auto' ? 'bg-accent text-black' : 'text-muted hover:text-theme'
                  }`}
                >
                  <Zap size={14} /> Auto
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'mobile' ? 'bg-accent text-black' : 'text-muted hover:text-theme'
                  }`}
                >
                  <Smartphone size={14} /> Mobile
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'desktop' ? 'bg-accent text-black' : 'text-muted hover:text-theme'
                  }`}
                >
                  <Monitor size={14} /> Desktop
                </button>
              </div>
            </div>

            <button
              onClick={toggleCompactMode}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-surface hover-surface rounded-xl border border-theme transition-colors mb-4"
            >
              <div className="flex items-center gap-3">
                {compactMode ? <LayoutList size={18} className="text-accent" /> : <LayoutGrid size={18} className="text-accent" />}
                <div className="text-left">
                  <p className="text-sm font-medium text-theme">Compact Mode</p>
                  <p className="text-[11px] text-muted">{compactMode ? 'Compact list view' : 'Card view with details'}</p>
                </div>
              </div>
              <div
                className="w-10 h-6 rounded-full p-0.5 transition-colors"
                style={{ backgroundColor: compactMode ? 'var(--c-accent)' : 'var(--c-border)' }}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${compactMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            <div className="flex items-center justify-between px-4 py-3.5 bg-surface rounded-xl border border-theme">
              <div className="text-left">
                <p className="text-sm font-medium text-theme">Startup Page</p>
                <p className="text-[11px] text-muted">Choose your default screen</p>
              </div>
              <div className="flex bg-app p-1 rounded-lg border border-theme min-w-[120px]">
                <button
                  onClick={() => setStartPage('/')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                    startPage === '/' ? 'bg-accent text-black shadow-sm' : 'text-muted'
                  }`}
                >
                  Feed
                </button>
                <button
                  onClick={() => setStartPage('/search')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                    startPage === '/search' ? 'bg-accent text-black shadow-sm' : 'text-muted'
                  }`}
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Data Sources</h2>

            <div className="space-y-4">
              {/* Hacker News - Fixed */}
              <div className="px-4 py-3 bg-surface rounded-xl border border-theme flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--c-hn)' }}>🔶</span>
                  <span className="text-sm font-medium text-theme">Hacker News</span>
                </div>
                <span className="text-[10px] font-bold text-muted uppercase">Fixed</span>
              </div>

              {/* Lemmy Section */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Lemmy Communities</h3>
                  <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="p-1.5 text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-1 px-2"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Source</span>
                  </button>
                </div>

                {showAdd && (
                  <div className="mb-4 p-4 bg-surface rounded-2xl border border-accent/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Community Name</label>
                        <input
                          type="text"
                          value={newCommunity}
                          onChange={e => setNewCommunity(e.target.value)}
                          placeholder="e.g. technology"
                          className="w-full bg-app border border-theme rounded-xl px-3 py-2 text-sm text-theme focus:outline-none focus:ring-1 ring-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Instance</label>
                        <input
                          type="text"
                          value={newInstance}
                          onChange={e => setNewInstance(e.target.value)}
                          placeholder="e.g. lemmy.world"
                          className="w-full bg-app border border-theme rounded-xl px-3 py-2 text-sm text-theme focus:outline-none focus:ring-1 ring-accent"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleAdd}
                          className="flex-1 py-2 bg-accent text-black text-sm font-bold rounded-xl"
                        >
                          Add Community
                        </button>
                        <button
                          onClick={() => setShowAdd(false)}
                          className="px-4 py-2 bg-theme border border-theme text-theme text-sm font-medium rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {lemmyCommunities.map(c => (
                    <div key={c.filterKey} className="px-4 py-3 bg-surface rounded-xl border border-theme flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--c-lemmy)' }}>🟣</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-theme">{c.community}</span>
                          <span className="text-[10px] text-muted flex items-center gap-0.5"><Globe size={10} /> {c.instance}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteLemmyCommunity(c.filterKey)}
                        className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={resetCommunities}
                    className="w-full py-2 text-[11px] font-bold text-muted hover:text-accent transition-colors uppercase tracking-widest"
                  >
                    Reset to Default Communities
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">About</h2>
            <div className="px-4 py-4 bg-surface rounded-xl border border-theme">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-lemmy))' }}
                >
                  <OrbitLogo size={40} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme">Orbit News</h3>
                  <p className="text-[11px] text-muted">Version 1.2.5 (Capacitor)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 p-2.5 bg-app rounded-lg border border-theme">
                <span className="text-[11px] font-bold text-theme tracking-tight">Developed by Sven Kersten</span>
              </div>

              <p className="text-[12px] text-muted leading-relaxed mb-4">
                A unified feed client for Hacker News and Lemmy communities.
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-accent transition-colors">
                  <ExternalLink size={11} /> Hacker News
                </a>
                <a href="https://lemmy.world" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-accent transition-colors">
                  <ExternalLink size={11} /> Lemmy
                </a>
              </div>
            </div>
          </section>
        </div>

        <div className="h-8" />
      </div>

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowThemeModal(false)}
          />
          <div className="relative mt-auto lg:my-auto lg:mx-auto lg:max-w-2xl w-full bg-app border-t lg:border border-theme rounded-t-[32px] lg:rounded-[32px] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 duration-300 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-theme">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-accent" />
                <h2 className="text-lg font-bold text-theme">Select Theme</h2>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-2 text-muted hover:text-theme bg-surface rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 pb-8">
                {THEME_PRESETS.map((theme) => {
                  const active = themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setThemeId(theme.id);
                      }}
                      className="relative rounded-2xl overflow-hidden border transition-all duration-200 text-left group"
                      style={{
                        borderColor: active ? theme.colors.accent : 'var(--c-border)',
                        boxShadow: active ? `0 0 0 2px ${theme.colors.accent}` : 'none',
                        transform: active ? 'scale(0.98)' : 'scale(1)',
                      }}
                    >
                      <div className="h-20 w-full relative" style={{ background: theme.preview }}>
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.accent }} />
                          <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.hn }} />
                          <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.lemmy }} />
                        </div>
                        {active && (
                          <div
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200"
                            style={{ backgroundColor: theme.colors.accent }}
                          >
                            <Check size={14} className="text-black/80" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5" style={{ backgroundColor: theme.colors.surface }}>
                        <p className="text-sm font-bold" style={{ color: theme.colors.text }}>
                          {theme.name}
                        </p>
                        <p className="text-[10px] opacity-80" style={{ color: theme.colors.textMuted }}>
                          {theme.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-theme bg-surface-alt/50">
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-full py-3.5 bg-accent text-black font-bold rounded-2xl shadow-xl active:scale-[0.98] transition-transform"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
