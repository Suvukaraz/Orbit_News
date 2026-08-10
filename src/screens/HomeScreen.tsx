import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedFeed } from '../hooks/useUnifiedFeed';
import { useFeedStore } from '../stores/feedStore';
import { PostCard } from '../components/PostCard';
import { SourceFilter } from '../components/SourceFilter';
import { SortSelector } from '../components/SortSelector';
import { OrbitLogo } from '../components/OrbitLogo';
import { useIsDesktop } from '../App';
import { RefreshCw, Loader2, AlertTriangle, Info } from 'lucide-react';
import type { IPost } from '../types';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const compactMode = useFeedStore(s => s.compactMode);
  const isDesktop = useIsDesktop();
  const {
    isInitialized,
    setInitialized,
    resetCommunities,
    clearCommunities,
    refreshTick,
    scrollPositions,
    setScrollPosition
  } = useFeedStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useUnifiedFeed();

  const observerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const allPosts: IPost[] = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap(page => page.posts);
    const seen = new Set<string>();
    return all.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data]);

  // Handle external refresh trigger from BottomNav
  useEffect(() => {
    if (refreshTick > 0) {
      refetch();
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setScrollPosition('home', 0);
    }
  }, [refreshTick, refetch, setScrollPosition]);

  // Restore scroll position
  useEffect(() => {
    if (!isLoading && allPosts.length > 0 && scrollRef.current) {
      const savedPosition = scrollPositions['home'];
      if (savedPosition) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: savedPosition, behavior: 'auto' });
        });
      }
    }
  }, [isLoading, allPosts.length, scrollPositions]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (scrollRef.current) {
        setScrollPosition('home', scrollRef.current.scrollTop);
      }
    };
  }, [setScrollPosition]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Pull to refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = scrollRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = scrollRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refetch]);

  const handlePostClick = (post: IPost) => {
    if (scrollRef.current) {
      setScrollPosition('home', scrollRef.current.scrollTop);
    }
    navigate(`/comments/${post.sourceType}/${post.sourceType === 'hn' ? post.hnId : `${post.lemmyInstance}/${post.lemmyPostId}`}`, {
      state: { post, from: '/' },
    });
  };

  return (
    <div className="flex flex-col h-full bg-app">
      {/* First Start Popup */}
      {!isInitialized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-surface border border-theme rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
              <Info className="text-accent" size={24} />
            </div>
            <h2 className="text-xl font-bold text-theme mb-2">Welcome!</h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Would you like to keep the pre-configured Lemmy communities or start fresh?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { resetCommunities(); setInitialized(true); }}
                className="w-full py-3 bg-accent text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Keep Pre-configured
              </button>
              <button
                onClick={() => { clearCommunities(); setInitialized(true); }}
                className="w-full py-3 bg-surface border border-theme text-theme font-medium rounded-xl hover:bg-white/5 transition-colors"
              >
                Delete & Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b border-theme" style={{ backgroundColor: 'color-mix(in srgb, var(--c-surface-alt) 92%, transparent)' }}>
        <div className="max-w-4xl mx-auto w-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 px-2 py-2">
          <div className="min-w-0">
            <SourceFilter />
          </div>
          <OrbitLogo size={40} className={isDesktop ? 'hidden' : 'lg:hidden'} />
          <div className={isDesktop ? 'block w-10' : 'hidden lg:block w-10'} /> {/* Spacer when logo is in sidebar */}
          <div className="min-w-0 justify-self-end">
            <SortSelector />
          </div>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all duration-150 overflow-hidden"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            size={22}
            className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / 50, 1)
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-4xl mx-auto w-full">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="text-accent animate-spin" />
              <p className="text-muted text-sm">Loading your unified feed...</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertTriangle size={32} className="text-amber-400" />
              <p className="text-muted text-sm text-center px-8">
                {(error as Error)?.message || 'Failed to load feed'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-accent rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--c-accent-soft)' }}
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !isError && allPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-muted text-sm">No posts found</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-accent rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--c-accent-soft)' }}
              >
                Refresh
              </button>
            </div>
          )}

          <div className={compactMode ? '' : 'py-1'}>
            {allPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post)}
                compact={compactMode}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="h-20 flex items-center justify-center">
            {isFetchingNextPage && (
              <Loader2 size={24} className="text-accent animate-spin" />
            )}
            {!hasNextPage && allPosts.length > 0 && (
              <p className="text-muted text-xs opacity-60">You've reached the end</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
