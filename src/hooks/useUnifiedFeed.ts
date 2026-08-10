import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchHNPosts } from '../services/hnApi';
import { fetchLemmyCommunityPosts } from '../services/lemmyApi';
import type { IPost, SourceFilter, SortMode } from '../types';
import { useFeedStore } from '../stores/feedStore';
import { sortPosts } from '../utils/sortPosts';

// Map our unified sort modes to Lemmy's native sort param for better upstream results
function lemmySortParam(mode: SortMode): string {
  switch (mode) {
    case 'top': return 'TopDay';
    case 'new': return 'New';
    case 'active': return 'Active';
    case 'comments': return 'MostComments';
    case 'hot':
    default: return 'Hot';
  }
}

const HN_PAGE_SIZE = 20;
const LEMMY_PAGE_SIZE = 15;

interface FeedPage {
  posts: IPost[];
  nextPage: number;
  hasMore: boolean;
}

async function fetchAllSources(page: number, filter: SourceFilter, sortMode: SortMode, communities: any[]): Promise<FeedPage> {
  const promises: Promise<IPost[]>[] = [];

  // Determine which sources to fetch
  const fetchHN = filter === 'all' || filter === 'hn';
  const lemmyToFetch = filter === 'all'
    ? communities
    : communities.filter(c => c.filterKey === filter);

  if (fetchHN) {
    promises.push(
      fetchHNPosts(page, HN_PAGE_SIZE).catch(() => [] as IPost[])
    );
  }

  const lemmySort = lemmySortParam(sortMode);
  for (const community of lemmyToFetch) {
    promises.push(
      fetchLemmyCommunityPosts(community, page + 1, LEMMY_PAGE_SIZE, lemmySort).catch(() => [] as IPost[])
    );
  }

  // Fetch all in parallel
  const results = await Promise.allSettled(promises);

  // Flatten
  const allPosts: IPost[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value);
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique: IPost[] = [];
  for (const post of allPosts) {
    if (!seen.has(post.id)) {
      seen.add(post.id);
      unique.push(post);
    }
  }

  // Apply the selected sort mode to the merged page
  const sorted = sortPosts(unique, sortMode);

  return {
    posts: sorted,
    nextPage: page + 1,
    hasMore: sorted.length > 0,
  };
}

export function useUnifiedFeed() {
  const sourceFilter = useFeedStore(s => s.sourceFilter);
  const sortMode = useFeedStore(s => s.sortMode);
  const communities = useFeedStore(s => s.lemmyCommunities);

  return useInfiniteQuery<FeedPage>({
    queryKey: ['unified-feed', sourceFilter, sortMode, communities],
    queryFn: ({ pageParam }) => fetchAllSources(pageParam as number, sourceFilter, sortMode, communities),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.nextPage;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });
}
