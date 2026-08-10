import type { IPost, SortMode } from '../types';

const HOUR = 3600;

/**
 * Reddit/HN-style "hot" ranking.
 * Combines score with age so fresh, upvoted posts float to the top.
 * Uses a gravity-based decay similar to HN's algorithm.
 */
function hotScore(post: IPost, now: number): number {
  const ageHours = Math.max((now - post.createdAt) / HOUR, 0);
  const gravity = 1.6;
  const base = post.score + post.commentCount * 0.5 + 1;
  return base / Math.pow(ageHours + 2, gravity);
}

/**
 * "Active" ranking — recent posts that are also generating discussion.
 */
function activeScore(post: IPost, now: number): number {
  const ageHours = Math.max((now - post.createdAt) / HOUR, 0);
  const engagement = post.commentCount * 2 + post.score;
  return engagement / Math.pow(ageHours + 2, 1.2);
}

export function sortPosts(posts: IPost[], mode: SortMode): IPost[] {
  const now = Math.floor(Date.now() / 1000);
  const copy = [...posts];

  switch (mode) {
    case 'new':
      copy.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'top':
      copy.sort((a, b) => b.score - a.score);
      break;
    case 'comments':
      copy.sort((a, b) => b.commentCount - a.commentCount);
      break;
    case 'active':
      copy.sort((a, b) => activeScore(b, now) - activeScore(a, now));
      break;
    case 'hot':
    default:
      copy.sort((a, b) => hotScore(b, now) - hotScore(a, now));
      break;
  }

  return copy;
}
