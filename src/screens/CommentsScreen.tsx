import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchHNComments } from '../services/hnApi';
import { fetchLemmyComments } from '../services/lemmyApi';
import { CommentItem } from '../components/CommentItem';
import { OrbitLogo } from '../components/OrbitLogo';
import { useIsDesktop } from '../App';
import { formatTimeAgo, formatNumber } from '../utils/timeFormatter';
import type { IPost, IComment } from '../types';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  ArrowBigUp,
  ArrowBigDown,
  ExternalLink,
  Share2,
  Globe,
  AlertTriangle,
  ListFilter,
} from 'lucide-react';
import { useFeedStore } from '../stores/feedStore';
import { useState, useMemo, useRef, useCallback } from 'react';

type CommentSortMode = 'top' | 'new' | 'discussed';

export const CommentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const post = (location.state as { post?: IPost })?.post;
  const isDesktop = useIsDesktop();

  const { voteStates, setVoteState } = useFeedStore();
  const [commentSortMode, setCommentSortMode] = useState<CommentSortMode>('top');

  const sourceType = params.sourceType as 'hn' | 'lemmy';
  const postIdParam = params['*'] || params.postId;

  const { data: rawComments, isLoading, isError, refetch } = useQuery<IComment[]>({
    queryKey: ['comments', sourceType, postIdParam],
    queryFn: async () => {
      if (sourceType === 'hn') {
        const hnId = parseInt(postIdParam || '0', 10);
        return fetchHNComments(hnId);
      } else {
        const parts = (postIdParam || '').split('/');
        const instance = parts[0];
        const lemmyPostId = parseInt(parts[1], 10);
        return fetchLemmyComments(instance, lemmyPostId);
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  const goBack = useCallback(() => {
    const from = (location.state as { from?: string })?.from;
    if (from) {
      navigate(from, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  // Swipe back gesture
  const touchStartPos = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const diffY = e.changedTouches[0].clientY - touchStartPos.current.y;

    // Detection logic:
    // 1. Started near the left edge (first 80px)
    // 2. Swiped to the right (at least 60px)
    // 3. Movement was primarily horizontal
    if (
      touchStartPos.current.x < 80 &&
      diffX > 60 &&
      Math.abs(diffX) > Math.abs(diffY)
    ) {
      goBack();
    }
  };

  const flattenCount = useCallback((comments: IComment[] | undefined): number => {
    if (!comments) return 0;
    let count = comments.length;
    for (const c of comments) {
      count += flattenCount(c.children);
    }
    return count;
  }, []);

  const comments = useMemo(() => {
    if (!rawComments) return [];
    const sorted = [...rawComments];
    if (commentSortMode === 'new') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else if (commentSortMode === 'top') {
      sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (commentSortMode === 'discussed') {
      sorted.sort((a, b) => flattenCount(b.children) - flattenCount(a.children));
    }
    return sorted;
  }, [rawComments, commentSortMode, flattenCount]);

  const voteState = post ? (voteStates[post.id] || post.voteState) : 'none';
  const scoreAdj = voteState === 'up' ? 1 : voteState === 'down' ? -1 : 0;
  const displayScore = post ? post.score + scoreAdj : 0;

  const handleVote = (direction: 'up' | 'down') => {
    if (!post) return;
    const newState = voteState === direction ? 'none' : direction;
    setVoteState(post.id, newState);
  };

  const domain = (() => {
    try {
      return new URL(post?.url || '').hostname.replace('www.', '');
    } catch {
      return '';
    }
  })();

  const sourceColorVar = post?.sourceType === 'hn' ? 'var(--c-hn)' : 'var(--c-lemmy)';
  const sourceIcon = post?.sourceType === 'hn' ? '🔶' : '🟣';

  return (
    <div
      className="flex flex-col h-full bg-app"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-xl border-b border-theme"
        style={{ backgroundColor: 'color-mix(in srgb, var(--c-surface-alt) 92%, transparent)' }}
      >
        <div className="max-w-4xl mx-auto w-full grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 py-2">
          <div className="flex items-center px-2 gap-1 overflow-hidden">
            <button
              onClick={goBack}
              className="p-1.5 text-muted hover:text-theme hover-surface rounded-xl transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-sm font-bold text-theme tracking-tight truncate">
              Comments
            </h1>
          </div>
          <div className="flex justify-center">
            <OrbitLogo size={40} className={isDesktop ? 'hidden' : 'lg:hidden'} />
            <div className={isDesktop ? 'block w-10' : 'hidden lg:block w-10'} />
          </div>
          <div className="flex justify-end px-2">
            {post && (
              <button
                onClick={() => window.open(post.url, '_blank', 'noopener')}
                className="p-1.5 text-muted hover:text-theme hover-surface rounded-xl transition-colors"
              >
                <ExternalLink size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          {/* Post detail */}
          {post && (
            <div className="border-b border-theme px-4 py-4">
            {/* Source tag */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
                style={{ color: sourceColorVar, borderColor: sourceColorVar, backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
              >
                {sourceIcon} {post.sourceLabel}
              </span>
              <span className="text-[11px] text-muted">•</span>
              <span className="text-[11px] text-muted">{post.author}</span>
              <span className="text-[11px] text-muted">•</span>
              <span className="text-[11px] text-muted">{formatTimeAgo(post.createdAt)}</span>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-theme leading-snug mb-2">{post.title}</h2>

            {/* Domain */}
            {domain && (
              <div className="flex items-center gap-1 mb-3">
                <Globe size={12} className="text-muted" />
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-accent transition-colors truncate"
                >
                  {domain}
                </a>
              </div>
            )}

            {/* Body (if any) */}
            {post.body && (
              <div className="text-sm text-muted leading-relaxed mb-3 whitespace-pre-wrap break-words">
                {post.body
                  .replace(/<p>/g, '\n\n')
                  .replace(/<br\s*\/?>/g, '\n')
                  .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)')
                  .replace(/<[^>]*>/g, '')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#x27;/g, "'")
                  .replace(/&#39;/g, "'")
                  .trim()
                }
              </div>
            )}

            {/* Thumbnail */}
            {post.thumbnail && (
              <div className="mb-3">
                <img
                  src={post.thumbnail}
                  alt=""
                  className="w-full max-h-60 object-cover rounded-xl bg-black/20"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Actions bar */}
            <div className="flex items-center gap-1">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--c-surface-alt)' }}>
                <button
                  onClick={() => handleVote('up')}
                  className={`flex items-center gap-1 px-3 py-2 transition-colors ${
                    voteState === 'up' ? 'bg-green-500/20 text-green-400' : 'text-muted hover:text-green-400'
                  }`}
                >
                  <ArrowBigUp size={20} className={voteState === 'up' ? 'fill-green-400' : ''} />
                </button>
                <span className={`text-sm font-bold px-2 ${
                  voteState === 'up' ? 'text-green-400' : voteState === 'down' ? 'text-red-400' : 'text-muted'
                }`}>
                  {formatNumber(displayScore)}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className={`flex items-center gap-1 px-3 py-2 transition-colors ${
                    voteState === 'down' ? 'bg-red-500/20 text-red-400' : 'text-muted hover:text-red-400'
                  }`}
                >
                  <ArrowBigDown size={20} className={voteState === 'down' ? 'fill-red-400' : ''} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2 text-muted rounded-xl" style={{ backgroundColor: 'var(--c-surface-alt)' }}>
                <MessageSquare size={16} />
                <span className="text-xs font-medium">
                  {rawComments ? flattenCount(rawComments) : post.commentCount}
                </span>
              </div>

              <div className="flex-1" />

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: post.title, url: post.url });
                  } else {
                    navigator.clipboard.writeText(post.url);
                  }
                }}
                className="p-2 text-muted hover:text-theme hover-surface rounded-xl transition-colors"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Comment Sort Selector */}
        {!isLoading && rawComments && rawComments.length > 0 && (
          <div className="px-4 py-2 border-b border-theme bg-surface/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted">
              <ListFilter size={14} className="text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Sort Comments</span>
            </div>
            <div className="flex gap-2">
              {(['top', 'new', 'discussed'] as CommentSortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCommentSortMode(mode)}
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md transition-all ${
                    commentSortMode === mode ? 'bg-accent text-black shadow-sm' : 'text-muted hover:text-theme'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

          {/* Comments */}
          <div className="px-4 py-3">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="text-accent animate-spin" />
                <p className="text-muted text-sm">Loading comments...</p>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertTriangle size={28} className="text-amber-400" />
                <p className="text-muted text-sm">Failed to load comments</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 text-accent rounded-xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--c-accent-soft)' }}
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !isError && comments && comments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <MessageSquare size={24} className="text-muted" />
                <p className="text-muted text-sm">No comments yet</p>
              </div>
            )}

            {!isLoading && comments && comments.length > 0 && (
              <div className="space-y-0.5">
                {comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};;
