import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { searchHN } from '../services/hnApi';
import { searchLemmy } from '../services/lemmyApi';
import { PostCard } from '../components/PostCard';
import { useFeedStore, type SearchHistoryItem } from '../stores/feedStore';
import { useIsDesktop } from '../App';
import { Search, Loader2, X, TrendingUp, Filter, Clock, ListFilter, ChevronDown, AlertTriangle, History, Trash2 } from 'lucide-react';
import type { IPost, LemmyCommunityConfig, SourceFilter } from '../types';

type SearchSort = 'relevance' | 'newest' | 'most_discussed' | 'most_upvoted';
type TimeFilter = 'all' | 'hour' | 'today' | 'week' | 'month' | 'year';
type SearchScope = SourceFilter;

interface SearchResult {
  posts: IPost[];
  failedSources: string[];
  nextPage?: number;
}

async function searchAllSources(
  query: string,
  sortBy: SearchSort,
  timeFilter: TimeFilter,
  communities: LemmyCommunityConfig[],
  scope: SearchScope,
  page: number = 0
): Promise<SearchResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return { posts: [], failedSources: [] };

  const selectedCommunities = scope === 'all'
    ? communities
    : communities.filter(community => community.filterKey === scope);

  const requests = [
    ...(scope === 'all' || scope === 'hn'
      ? [{ name: 'Hacker News', request: searchHN(normalizedQuery, page, sortBy, timeFilter) }]
      : []),
    ...selectedCommunities.map(community => ({
      name: `Lemmy (${community.label})`,
      request: searchLemmy(community.instance, normalizedQuery, page + 1, sortBy, community.community),
    })),
  ];

  const results = await Promise.allSettled(requests.map(source => source.request));
  const all: IPost[] = [];
  const failedSources: string[] = [];
  let hnNbPages = 0;

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (requests[index].name === 'Hacker News') {
        const hnResult = value as { posts: IPost[]; nbPages: number };
        all.push(...hnResult.posts);
        hnNbPages = hnResult.nbPages;
      } else {
        all.push(...(value as IPost[]));
      }
    } else {
      failedSources.push(requests[index].name);
    }
  }

  if (all.length === 0 && failedSources.length === requests.length) {
    throw new Error('All search sources are currently unavailable.');
  }

  const seen = new Set<string>();
  const unique = all.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  if (sortBy === 'newest') {
    unique.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === 'most_upvoted') {
    unique.sort((a, b) => b.score - a.score);
  } else if (sortBy === 'most_discussed') {
    unique.sort((a, b) => b.commentCount - a.commentCount);
  }

  // Determine if there is a next page
  // For HN, we have nbPages. For Lemmy, we just check if we got results (simplified).
  // If we are in "all" scope, we continue as long as one source has more.
  const hasMoreHN = scope === 'hn' || scope === 'all' ? page + 1 < hnNbPages : false;
  const hasMoreLemmy = (scope !== 'hn') && all.some(p => p.sourceType === 'lemmy'); // Simplified check

  const hasNext = hasMoreHN || hasMoreLemmy;

  return {
    posts: unique,
    failedSources,
    nextPage: hasNext ? page + 1 : undefined
  };
}

export const SearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const compactMode = useFeedStore(s => s.compactMode);
  const lemmyCommunities = useFeedStore(s => s.lemmyCommunities);
  const isDesktop = useIsDesktop();
  const {
    scrollPositions,
    setScrollPosition,
    searchHistory,
    addToSearchHistory,
    clearSearchHistory,
    searchQuery,
    setSearchQuery,
    searchSortBy,
    setSearchSortBy,
    searchTimeFilter,
    setSearchTimeFilter,
    searchScope,
    setSearchScope
  } = useFeedStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = inputValue.trim();
      setDebouncedQuery(trimmed);
      setSearchQuery(trimmed);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [inputValue, setSearchQuery]);

  useEffect(() => {
    if (searchScope !== 'all' && searchScope !== 'hn' && !lemmyCommunities.some(c => c.filterKey === searchScope)) {
      setSearchScope('all');
    }
  }, [lemmyCommunities, searchScope, setSearchScope]);

  const handleQueryChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const normalizedDebouncedQuery = debouncedQuery.trim();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery<SearchResult>({
    queryKey: ['search', normalizedDebouncedQuery, searchSortBy, searchTimeFilter, searchScope, lemmyCommunities],
    queryFn: ({ pageParam = 0 }) =>
      searchAllSources(normalizedDebouncedQuery, searchSortBy as SearchSort, searchTimeFilter as TimeFilter, lemmyCommunities, searchScope as SearchScope, pageParam as number),
    enabled: normalizedDebouncedQuery.length >= 2,
    staleTime: 60 * 1000,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (normalizedDebouncedQuery.length >= 2) {
      addToSearchHistory({
        query: normalizedDebouncedQuery,
        sortBy: searchSortBy,
        timeFilter: searchTimeFilter,
        searchScope
      });
    }
  }, [normalizedDebouncedQuery, searchSortBy, searchTimeFilter, searchScope, addToSearchHistory]);

  const results = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap(page => page.posts);
    const seen = new Set<string>();
    return all.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data]);

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

  // Restore scroll position
  useEffect(() => {
    if (!isLoading && results.length > 0 && scrollRef.current) {
      const savedPosition = scrollPositions['search'];
      if (savedPosition) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: savedPosition, behavior: 'auto' });
        });
      }
    }
  }, [isLoading, results.length, scrollPositions]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (scrollRef.current) {
        setScrollPosition('search', scrollRef.current.scrollTop);
      }
    };
  }, [setScrollPosition]);

  const handlePostClick = (post: IPost) => {
    if (scrollRef.current) {
      setScrollPosition('search', scrollRef.current.scrollTop);
    }
    navigate(`/comments/${post.sourceType}/${post.sourceType === 'hn' ? post.hnId : `${post.lemmyInstance}/${post.lemmyPostId}`}`, {
      state: { post, from: '/search' },
    });
  };

  const sortOptions: { value: SearchSort; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'most_discussed', label: 'Most Discussed' },
    { value: 'most_upvoted', label: 'Most Upvoted' },
  ];

  const timeOptions: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'Any time' },
    { value: 'hour', label: 'Past hour' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'year', label: 'This year' },
  ];

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Search Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-xl border-b border-theme"
        style={{ backgroundColor: 'color-mix(in srgb, var(--c-surface-alt) 92%, transparent)' }}
      >
        <div className="max-w-4xl mx-auto w-full px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search..."
                aria-label="Search Hacker News and Lemmy"
                className="w-full pl-10 pr-10 py-2.5 bg-surface border border-theme rounded-xl text-theme text-sm placeholder:text-muted focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': 'var(--c-accent)' } as React.CSSProperties}
              />
              {inputValue && (
                <button
                  onClick={() => { setInputValue(''); setDebouncedQuery(''); setSearchQuery(''); }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-theme"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle search filters"
              aria-expanded={showFilters}
              className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-accent text-black border-accent' : 'bg-surface text-muted border-theme'}`}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-theme/50 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Clock size={10} /> Time Filter
                  </label>
                  <div className="relative">
                    <select
                      value={searchTimeFilter}
                      onChange={(e) => setSearchTimeFilter(e.target.value as TimeFilter)}
                      className="w-full appearance-none bg-surface border border-theme rounded-lg px-3 py-1.5 text-xs text-theme focus:outline-none"
                    >
                      {timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <ListFilter size={10} /> Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={searchSortBy}
                      onChange={(e) => setSearchSortBy(e.target.value as SearchSort)}
                      className="w-full appearance-none bg-surface border border-theme rounded-lg px-3 py-1.5 text-xs text-theme focus:outline-none"
                    >
                      {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                  <Search size={10} /> Search In
                </label>
                <div className="relative">
                  <select
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value as SearchScope)}
                    className="w-full appearance-none bg-surface border border-theme rounded-lg px-3 py-1.5 text-xs text-theme focus:outline-none"
                  >
                    <option value="all">All sources</option>
                    <option value="hn">Hacker News</option>
                    {lemmyCommunities.map(community => (
                      <option key={community.filterKey} value={community.filterKey}>
                        {community.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          {!normalizedDebouncedQuery && (
            <div className="px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-accent" />
                  <h3 className="text-sm font-semibold text-theme">Recent Searches</h3>
                </div>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearSearchHistory}
                    className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-red-400 uppercase tracking-wider transition-colors"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>

              {searchHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <Search size={32} className="mb-2 text-muted" />
                  <p className="text-xs text-muted">Your search history will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchHistory.map((item, idx) => (
                    <button
                      key={item.query + item.timestamp + idx}
                      onClick={() => {
                        setInputValue(item.query);
                        setDebouncedQuery(item.query);
                        setSearchSortBy(item.sortBy as SearchSort);
                        setSearchTimeFilter(item.timeFilter as TimeFilter);
                        setSearchScope(item.searchScope as SearchScope);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-surface hover-surface border border-theme rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Search size={14} className="text-muted group-hover:text-accent shrink-0" />
                        <span className="text-sm text-theme truncate">{item.query}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-[10px] text-muted font-medium bg-app px-1.5 py-0.5 rounded border border-theme uppercase tracking-tighter">
                          {item.sortBy.replace('_', ' ')}
                        </span>
                        <ChevronDown size={12} className="text-muted -rotate-90" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="text-accent animate-spin" />
              <p className="text-muted text-sm">Searching across sources...</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
              <p className="text-muted text-sm">Search failed. Try again.</p>
              <button onClick={() => refetch()} className="text-accent text-xs font-bold mt-2">Retry</button>
            </div>
          )}

          {!isLoading && !isError && data?.pages?.[0]?.failedSources?.length ? (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Unable to search {data.pages[0].failedSources.join(', ')}. Showing available results.
              </span>
            </div>
          ) : null}

          {!isLoading && !isError && normalizedDebouncedQuery.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-muted text-sm">No results found for "{normalizedDebouncedQuery}"</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="px-4 py-2 border-b border-theme/30 bg-surface/30">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className={compactMode ? '' : 'py-1'}>
                {results.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post)}
                    compact={compactMode}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};



