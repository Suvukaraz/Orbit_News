import { create } from 'zustand';
import type { IPost, SourceFilter, SortMode, ThemeId, LemmyCommunityConfig } from '../types';
import { DEFAULT_LEMMY_COMMUNITIES } from '../types';

const THEME_STORAGE_KEY = 'infinity-feed-theme';
const COMMUNITIES_STORAGE_KEY = 'infinity-feed-communities';
const INITIALIZED_KEY = 'infinity-feed-initialized';
const START_PAGE_KEY = 'infinity-feed-start-page';
const SEARCH_HISTORY_KEY = 'infinity-feed-search-history';
const VIEW_MODE_KEY = 'infinity-feed-view-mode';
const SOURCE_FILTER_KEY = 'infinity-feed-source-filter';
const SORT_MODE_KEY = 'infinity-feed-sort-mode';

const SEARCH_QUERY_KEY = 'infinity-feed-search-query';
const SEARCH_SORT_KEY = 'infinity-feed-search-sort';
const SEARCH_TIME_KEY = 'infinity-feed-search-time';
const SEARCH_SCOPE_KEY = 'infinity-feed-search-scope';

function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) return stored as ThemeId;
  } catch {
    // ignore
  }
  return 'midnight';
}

function loadCommunities(): LemmyCommunityConfig[] {
  try {
    const stored = localStorage.getItem(COMMUNITIES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LemmyCommunityConfig[];
      return parsed.sort((a, b) => a.community.localeCompare(b.community));
    }
  } catch {
    // ignore
  }
  return DEFAULT_LEMMY_COMMUNITIES;
}

function loadInitialized(): boolean {
  return localStorage.getItem(INITIALIZED_KEY) === 'true';
}

function loadStartPage(): string {
  return localStorage.getItem(START_PAGE_KEY) || '/';
}

function loadSourceFilter(): SourceFilter {
  return (localStorage.getItem(SOURCE_FILTER_KEY) as SourceFilter) || 'all';
}

function loadSortMode(): SortMode {
  return (localStorage.getItem(SORT_MODE_KEY) as SortMode) || 'new';
}

export type ViewMode = 'auto' | 'mobile' | 'desktop';

function loadViewMode(): ViewMode {
  return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'auto';
}

export interface SearchHistoryItem {
  query: string;
  sortBy: string;
  timeFilter: string;
  searchScope: string;
  timestamp: number;
}

function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

function loadSearchQuery(): string {
  return localStorage.getItem(SEARCH_QUERY_KEY) || '';
}

function loadSearchSort(): string {
  return localStorage.getItem(SEARCH_SORT_KEY) || 'relevance';
}

function loadSearchTime(): string {
  return localStorage.getItem(SEARCH_TIME_KEY) || 'all';
}

function loadSearchScope(): string {
  return localStorage.getItem(SEARCH_SCOPE_KEY) || 'all';
}

interface FeedState {
  // Filter
  sourceFilter: SourceFilter;
  setSourceFilter: (filter: SourceFilter) => void;

  // Sorting
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;

  // Communities
  lemmyCommunities: LemmyCommunityConfig[];
  addLemmyCommunity: (community: LemmyCommunityConfig) => void;
  deleteLemmyCommunity: (filterKey: string) => void;
  resetCommunities: () => void;
  clearCommunities: () => void;

  // Initialization
  isInitialized: boolean;
  setInitialized: (val: boolean) => void;

  // Cache
  cachedPosts: IPost[];
  setCachedPosts: (posts: IPost[]) => void;
  appendCachedPosts: (posts: IPost[]) => void;
  clearCache: () => void;

  // Local voting
  voteStates: Record<string, IPost['voteState']>;
  setVoteState: (postId: string, voteState: IPost['voteState']) => void;

  // Refresh trigger (for BottomNav -> HomeScreen)
  refreshTick: number;
  triggerRefresh: () => void;

  // Settings
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  compactMode: boolean;
  toggleCompactMode: () => void;
  startPage: string;
  setStartPage: (path: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Scroll Restoration
  scrollPositions: Record<string, number>;
  setScrollPosition: (key: string, position: number) => void;

  // Search History
  searchHistory: SearchHistoryItem[];
  addToSearchHistory: (item: Omit<SearchHistoryItem, 'timestamp'>) => void;
  clearSearchHistory: () => void;

  // Search State (for restoration)
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchSortBy: string;
  setSearchSortBy: (sort: string) => void;
  searchTimeFilter: string;
  setSearchTimeFilter: (filter: string) => void;
  searchScope: string;
  setSearchScope: (scope: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  // Filter
  sourceFilter: loadSourceFilter(),
  setSourceFilter: (filter) => {
    localStorage.setItem(SOURCE_FILTER_KEY, filter);
    set({ sourceFilter: filter });
  },

  // Sorting
  sortMode: loadSortMode(),
  setSortMode: (mode) => {
    localStorage.setItem(SORT_MODE_KEY, mode);
    set({ sortMode: mode });
  },

  // Communities
  lemmyCommunities: loadCommunities(),
  addLemmyCommunity: (community) => set((s) => {
    const newList = [...s.lemmyCommunities, community].sort((a, b) =>
      a.community.localeCompare(b.community)
    );
    localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(newList));
    return { lemmyCommunities: newList };
  }),
  deleteLemmyCommunity: (filterKey) => set((s) => {
    const newList = s.lemmyCommunities.filter(c => c.filterKey !== filterKey);
    localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(newList));
    // If deleted current filter, reset to all
    const sourceFilter = s.sourceFilter === filterKey ? 'all' : s.sourceFilter;
    return { lemmyCommunities: newList, sourceFilter };
  }),
  resetCommunities: () => set(() => {
    localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(DEFAULT_LEMMY_COMMUNITIES));
    return { lemmyCommunities: DEFAULT_LEMMY_COMMUNITIES };
  }),
  clearCommunities: () => set(() => {
    localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify([]));
    return { lemmyCommunities: [] };
  }),

  // Initialization
  isInitialized: loadInitialized(),
  setInitialized: (val) => {
    localStorage.setItem(INITIALIZED_KEY, String(val));
    set({ isInitialized: val });
  },

  // Cache
  cachedPosts: [],
  setCachedPosts: (posts) => set({ cachedPosts: posts }),
  appendCachedPosts: (posts) =>
    set((s) => {
      const existingIds = new Set(s.cachedPosts.map(p => p.id));
      const newPosts = posts.filter(p => !existingIds.has(p.id));
      return { cachedPosts: [...s.cachedPosts, ...newPosts] };
    }),
  clearCache: () => set({ cachedPosts: [] }),

  // Local voting
  voteStates: {},
  setVoteState: (postId, voteState) =>
    set((s) => ({ voteStates: { ...s.voteStates, [postId]: voteState } })),

  // Refresh
  refreshTick: 0,
  triggerRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),

  // Settings
  themeId: loadTheme(),
  setThemeId: (id) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // ignore
    }
    set({ themeId: id });
  },
  compactMode: false,
  toggleCompactMode: () => set((s) => ({ compactMode: !s.compactMode })),
  startPage: loadStartPage(),
  setStartPage: (path) => {
    localStorage.setItem(START_PAGE_KEY, path);
    set({ startPage: path });
  },
  viewMode: loadViewMode(),
  setViewMode: (mode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    set({ viewMode: mode });
  },

  // Scroll Restoration
  scrollPositions: {},
  setScrollPosition: (key, position) => set((s) => ({
    scrollPositions: { ...s.scrollPositions, [key]: position }
  })),

  // Search History
  searchHistory: loadSearchHistory(),
  addToSearchHistory: (item) => set((s) => {
    // Remove existing item with same query + filters
    const filtered = s.searchHistory.filter(h =>
      !(h.query === item.query &&
        h.sortBy === item.sortBy &&
        h.timeFilter === item.timeFilter &&
        h.searchScope === item.searchScope)
    );

    const newItem = { ...item, timestamp: Date.now() };
    const newList = [newItem, ...filtered].slice(0, 20);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newList));
    return { searchHistory: newList };
  }),
  clearSearchHistory: () => set(() => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    return { searchHistory: [] };
  }),

  // Search State
  searchQuery: loadSearchQuery(),
  setSearchQuery: (query) => {
    localStorage.setItem(SEARCH_QUERY_KEY, query);
    set({ searchQuery: query });
  },
  searchSortBy: loadSearchSort(),
  setSearchSortBy: (sort) => {
    localStorage.setItem(SEARCH_SORT_KEY, sort);
    set({ searchSortBy: sort });
  },
  searchTimeFilter: loadSearchTime(),
  setSearchTimeFilter: (filter) => {
    localStorage.setItem(SEARCH_TIME_KEY, filter);
    set({ searchTimeFilter: filter });
  },
  searchScope: loadSearchScope(),
  setSearchScope: (scope) => {
    localStorage.setItem(SEARCH_SCOPE_KEY, scope);
    set({ searchScope: scope });
  },
}));
