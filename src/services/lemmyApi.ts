import axios from 'axios';
import type { IPost, IComment, LemmyCommunityConfig } from '../types';
import { rateLimitedRequest } from '../utils/retryHelper';

interface LemmyPostView {
  post: {
    id: number;
    name: string;
    url?: string;
    body?: string;
    ap_id: string;
    published: string;
    thumbnail_url?: string;
    creator_id: number;
  };
  creator: {
    name: string;
    display_name?: string;
  };
  community: {
    name: string;
    title: string;
  };
  counts: {
    score: number;
    comments: number;
    upvotes: number;
    downvotes: number;
  };
}

interface LemmyCommentView {
  comment: {
    id: number;
    content: string;
    published: string;
    path: string;
    ap_id: string;
    creator_id: number;
  };
  creator: {
    name: string;
    display_name?: string;
  };
  counts: {
    score: number;
    upvotes: number;
    downvotes: number;
    child_count: number;
  };
}

interface LemmyPostListResponse {
  posts: LemmyPostView[];
}

interface LemmyCommentListResponse {
  comments: LemmyCommentView[];
}

interface LemmySearchResponse {
  posts: LemmyPostView[];
  comments: LemmyCommentView[];
}

function lemmyDateToUnix(dateStr: string): number {
  const timestamp = new Date(dateStr).getTime();
  return Number.isFinite(timestamp)
    ? Math.floor(timestamp / 1000)
    : Math.floor(Date.now() / 1000);
}

export async function fetchLemmyCommunityPosts(
  config: LemmyCommunityConfig,
  page: number = 1,
  limit: number = 20,
  sort: string = 'Hot'
): Promise<IPost[]> {
  return rateLimitedRequest(config.instance, async () => {
    const { data } = await axios.get<LemmyPostListResponse>(
      `https://${config.instance}/api/v3/post/list`,
      {
        params: {
          community_name: config.community,
          sort,
          page,
          limit,
          type_: 'Local',
        },
        timeout: 10000,
      }
    );

    return (data.posts || []).map(pv => ({
      id: `lemmy-${config.instance}-${pv.post.id}`,
      title: pv.post.name,
      score: pv.counts.score,
      commentCount: pv.counts.comments,
      createdAt: lemmyDateToUnix(pv.post.published),
      sourceLabel: config.label,
      url: pv.post.url || pv.post.ap_id,
      author: pv.creator.display_name || pv.creator.name,
      body: pv.post.body,
      thumbnail: pv.post.thumbnail_url,
      sourceType: 'lemmy' as const,
      lemmyInstance: config.instance,
      lemmyCommunity: config.community,
      lemmyPostId: pv.post.id,
      voteState: 'none' as const,
    }));
  });
}

export async function fetchLemmyComments(
  instance: string,
  postId: number
): Promise<IComment[]> {
  return rateLimitedRequest(instance, async () => {
    const { data } = await axios.get<LemmyCommentListResponse>(
      `https://${instance}/api/v3/comment/list`,
      {
        params: {
          post_id: postId,
          sort: 'Top',
          limit: 50,
          max_depth: 8,
          type_: 'All',
        },
        timeout: 10000,
      }
    );

    const commentViews = data.comments || [];
    const commentMap = new Map<number, IComment>();
    const rootComments: IComment[] = [];

    for (const cv of commentViews) {
      const pathParts = cv.comment.path.split('.').filter(p => p !== '0');
      const depth = pathParts.length - 1;
      
      commentMap.set(cv.comment.id, {
        id: `lemmy-comment-${cv.comment.id}`,
        author: cv.creator.display_name || cv.creator.name,
        body: cv.comment.content,
        createdAt: lemmyDateToUnix(cv.comment.published),
        depth: Math.min(depth, 10),
        children: [],
        sourceType: 'lemmy',
        score: cv.counts.score,
        voteState: 'none',
      });
    }

    for (const cv of commentViews) {
      const pathParts = cv.comment.path.split('.').filter(p => p !== '0');
      const commentObj = commentMap.get(cv.comment.id)!;

      if (pathParts.length <= 1) {
        rootComments.push(commentObj);
      } else {
        const parentIdStr = pathParts[pathParts.length - 2];
        const parentId = parseInt(parentIdStr, 10);
        const parent = commentMap.get(parentId);
        if (parent) {
          parent.children.push(commentObj);
        } else {
          rootComments.push(commentObj);
        }
      }
    }

    rootComments.sort((a, b) => (b.score || 0) - (a.score || 0));
    return rootComments;
  });
}

export async function searchLemmy(
  instance: string,
  query: string,
  page: number = 1,
  sortBy: string = 'newest',
  community?: string
): Promise<IPost[]> {
  const lemmySort = sortBy === 'newest' ? 'New' : sortBy === 'most_discussed' ? 'MostComments' : sortBy === 'most_upvoted' ? 'TopAll' : 'Active';

  return rateLimitedRequest(instance, async () => {
    const { data } = await axios.get<LemmySearchResponse>(
      `https://${instance}/api/v3/search`,
      {
        params: {
          q: query.trim(),
          type_: 'Posts',
          sort: lemmySort,
          page,
          limit: 20,
          ...(community ? { community_name: community } : {}),
        },
        timeout: 10000,
      }
    );

    return (data.posts || []).map(pv => ({
      id: `lemmy-search-${instance}-${pv.post.id}`,
      title: pv.post.name,
      score: pv.counts.score,
      commentCount: pv.counts.comments,
      createdAt: lemmyDateToUnix(pv.post.published),
      sourceLabel: `${pv.community.name}@${instance}`,
      url: pv.post.url || pv.post.ap_id,
      author: pv.creator.display_name || pv.creator.name,
      body: pv.post.body,
      thumbnail: pv.post.thumbnail_url,
      sourceType: 'lemmy' as const,
      lemmyInstance: instance,
      lemmyCommunity: pv.community.name,
      lemmyPostId: pv.post.id,
      voteState: 'none' as const,
    }));
  });
}


