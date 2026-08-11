import axios from 'axios';
import type { IPost, IComment } from '../types';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';
const ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';

interface HNItem {
  id: number;
  title?: string;
  text?: string;
  score?: number;
  by?: string;
  time?: number;
  url?: string;
  descendants?: number;
  kids?: number[];
  type?: string;
  deleted?: boolean;
  dead?: boolean;
}

interface AlgoliaHit {
  objectID: string;
  title?: string | null;
  story_title?: string | null;
  url?: string | null;
  story_url?: string | null;
  author?: string | null;
  points?: number | null;
  num_comments?: number | null;
  created_at_i?: number;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

interface AlgoliaSearchParams {
  query: string;
  tags: 'story';
  page: number;
  hitsPerPage: number;
  numericFilters?: string;
}

export async function fetchHNTopStoryIds(): Promise<number[]> {
  const { data } = await axios.get<number[]>(`${HN_BASE}/topstories.json`);
  return data;
}

export async function fetchHNItem(id: number): Promise<HNItem | null> {
  try {
    const { data } = await axios.get<HNItem>(`${HN_BASE}/item/${id}.json`);
    return data;
  } catch {
    return null;
  }
}

export async function fetchHNPosts(page: number, pageSize: number = 20): Promise<IPost[]> {
  const allIds = await fetchHNTopStoryIds();
  const start = page * pageSize;
  const end = start + pageSize;
  const slicedIds = allIds.slice(start, end);

  if (slicedIds.length === 0) return [];

  const items = await Promise.allSettled(
    slicedIds.map(id => fetchHNItem(id))
  );

  const posts: IPost[] = [];
  for (const result of items) {
    if (result.status === 'fulfilled' && result.value && result.value.title) {
      const item = result.value;
      if (item.deleted || item.dead) continue;
      posts.push({
        id: `hn-${item.id}`,
        title: item.title || '',
        score: item.score || 0,
        commentCount: item.descendants || 0,
        createdAt: item.time || 0,
        sourceLabel: 'Hacker News',
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        author: item.by || 'unknown',
        body: item.text,
        sourceType: 'hn',
        hnId: item.id,
        voteState: 'none',
      });
    }
  }

  return posts;
}

export async function fetchHNComments(itemId: number): Promise<IComment[]> {
  const item = await fetchHNItem(itemId);
  if (!item || !item.kids || item.kids.length === 0) return [];

  async function buildCommentTree(commentId: number, depth: number): Promise<IComment | null> {
    const comment = await fetchHNItem(commentId);
    if (!comment || comment.deleted || comment.dead || !comment.text) return null;

    const children: IComment[] = [];
    if (comment.kids && comment.kids.length > 0) {
      const childLimit = depth < 2 ? comment.kids.slice(0, 10) : comment.kids.slice(0, 5);
      const childResults = await Promise.allSettled(
        childLimit.map(kid => buildCommentTree(kid, depth + 1))
      );
      for (const r of childResults) {
        if (r.status === 'fulfilled' && r.value) {
          children.push(r.value);
        }
      }
    }

    return {
      id: `hn-comment-${comment.id}`,
      author: comment.by || 'unknown',
      body: comment.text || '',
      createdAt: comment.time || 0,
      depth,
      children,
      sourceType: 'hn',
      score: comment.score,
      voteState: 'none',
    };
  }

  const topLevelKids = item.kids.slice(0, 20);
  const results = await Promise.allSettled(
    topLevelKids.map(kid => buildCommentTree(kid, 0))
  );

  const comments: IComment[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      comments.push(r.value);
    }
  }

  return comments;
}

export async function searchHN(
  query: string,
  page: number = 0,
  sortBy: string = 'relevance',
  timeFilter: string = 'all'
): Promise<{ posts: IPost[]; nbPages: number }> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return { posts: [], nbPages: 0 };

  const endpoint = sortBy === 'newest' ? 'search_by_date' : 'search';
  const params: AlgoliaSearchParams = {
    query: normalizedQuery,
    tags: 'story',
    page,
    hitsPerPage: 100,
  };

  if (timeFilter !== 'all') {
    const now = Math.floor(Date.now() / 1000);
    let start = 0;
    switch (timeFilter) {
      case 'hour': start = now - 3600; break;
      case 'today': start = now - 86400; break;
      case 'week': start = now - 604800; break;
      case 'month': start = now - 2592000; break;
      case 'year': start = now - 31536000; break;
    }
    params.numericFilters = `created_at_i>${start}`;
  }

  const { data } = await axios.get<AlgoliaResponse>(`${ALGOLIA_BASE}/${endpoint}`, { params });

  const posts = data.hits.flatMap(hit => {
    const hnId = Number.parseInt(hit.objectID, 10);
    if (!Number.isFinite(hnId)) return [];

    return [{
      id: `hn-search-${hit.objectID}`,
      title: hit.title || hit.story_title || '',
      score: hit.points ?? 0,
      commentCount: hit.num_comments ?? 0,
      createdAt: hit.created_at_i ?? 0,
      sourceLabel: 'Hacker News',
      url: hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author || 'unknown',
      sourceType: 'hn' as const,
      hnId,
      voteState: 'none' as const,
    }];
  });

  return { posts, nbPages: data.nbPages };
}
