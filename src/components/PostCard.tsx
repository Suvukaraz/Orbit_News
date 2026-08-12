import React from 'react';
import type { IPost } from '../types';
import { formatTimeAgo, formatNumber } from '../utils/timeFormatter';
import { decodeEntities } from '../utils/textCleaner';
import { openExternal } from '../utils/openExternal';
import {
  MessageSquare,
  ExternalLink,
  Share2,
  Globe,
} from 'lucide-react';

interface PostCardProps {
  post: IPost;
  onClick: () => void;
  compact?: boolean;
}

export const PostCard = React.memo(({ post, onClick, compact }: PostCardProps) => {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: post.title, url: post.url });
    } else {
      navigator.clipboard.writeText(post.url);
    }
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    openExternal(post.url);
  };

  const domain = (() => {
    try {
      return new URL(post.url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  })();

  const isHN = post.sourceType === 'hn';
  const sourceColorVar = isHN ? 'var(--c-hn)' : 'var(--c-lemmy)';
  const sourceIcon = isHN ? '🔶' : '🟣';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="relative bg-surface cursor-pointer flex items-center gap-3 px-4 py-3 border-b border-theme transition-colors active:bg-white/5"
      >
        <div className="flex flex-col items-center min-w-[32px]">
          <span className="text-xs font-bold text-muted">{formatNumber(post.score)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-theme font-medium leading-snug line-clamp-2">{decodeEntities(post.title)}</h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
            <span style={{ color: sourceColorVar }}>{sourceIcon} {post.sourceLabel}</span>
            <span>·</span>
            <span>{formatTimeAgo(post.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><MessageSquare size={10} />{post.commentCount}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-surface hover-surface rounded-2xl border border-theme cursor-pointer transition-colors duration-200 overflow-hidden mx-3 my-1.5 active:scale-[0.99] transform"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
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
      <div className="px-4 pb-2">
        <h2 className="text-[15px] leading-[1.45] font-semibold text-theme">{decodeEntities(post.title)}</h2>
        {domain && (
          <div className="flex items-center gap-1 mt-1.5">
            <Globe size={11} className="text-muted" />
            <span className="text-[11px] text-muted truncate">{domain}</span>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      {post.thumbnail && (
        <div className="px-4 pb-2">
          <img
            src={post.thumbnail}
            alt=""
            className="w-full max-h-[500px] object-contain rounded-xl bg-black/40 transition-all duration-300 group-hover:brightness-110"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-1">
        <div className="flex items-center px-2.5 py-1.5 rounded-xl text-muted" style={{ backgroundColor: 'var(--c-surface-alt)' }}>
          <span className="text-xs font-bold">{formatNumber(post.score)} points</span>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-muted hover:text-accent hover-surface rounded-xl transition-colors">
          <MessageSquare size={16} />
          <span className="text-xs font-medium">{formatNumber(post.commentCount)}</span>
        </button>

        <div className="flex-1" />

        <button onClick={handleOpenUrl} className="p-2 text-muted hover:text-theme hover-surface rounded-xl transition-colors">
          <ExternalLink size={15} />
        </button>

        <button onClick={handleShare} className="p-2 text-muted hover:text-theme hover-surface rounded-xl transition-colors">
          <Share2 size={15} />
        </button>
      </div>
    </div>
  );
});
