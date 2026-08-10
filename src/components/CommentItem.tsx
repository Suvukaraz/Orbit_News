import React, { useState } from 'react';
import type { IComment } from '../types';
import { formatTimeAgo } from '../utils/timeFormatter';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { renderContentHTML } from '../utils/textCleaner';
import { handleContentClick } from '../utils/openExternal';

interface CommentItemProps {
  comment: IComment;
  maxDepthToShow?: number;
}

const DEPTH_COLORS = [
  'border-indigo-500/40',
  'border-purple-500/40',
  'border-pink-500/40',
  'border-cyan-500/40',
  'border-emerald-500/40',
  'border-amber-500/40',
  'border-red-500/40',
  'border-blue-500/40',
];

export const CommentItem: React.FC<CommentItemProps> = ({ comment, maxDepthToShow = 8 }) => {
  const [collapsed, setCollapsed] = useState(false);

  const depthColor = DEPTH_COLORS[comment.depth % DEPTH_COLORS.length];

  // Reduced indentation from 12px to 8px and capped at level 5
  // Note: Since this is recursive, we only apply indentation to CHILDREN
  // but for the visual indicator we use a small offset.
  const visualIndent = comment.depth > 0 ? 8 : 0;
  const isDeep = comment.depth >= 5;

  const cleanBody = renderContentHTML(comment.body, comment.sourceType);

  if (comment.depth > maxDepthToShow) return null;

  return (
    <div
      className="relative"
      style={{
        // Stop adding margin-left after depth 5 to save horizontal space
        marginLeft: comment.depth > 0 && !isDeep ? `${visualIndent}px` : '0px'
      }}
    >
      {/* Depth indicator line */}
      {comment.depth > 0 && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-0.5 border-l-[1.5px] ${depthColor}`}
          style={{ left: isDeep ? `${(comment.depth - 5) * 2}px` : '0px' }}
        />
      )}

      <div className={`${comment.depth > 0 ? 'pl-3' : ''} py-1.5`}>
        {/* Comment header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 group"
          >
            <span className="text-[11px] font-bold text-accent transition-colors">
              {comment.author}
            </span>
            {collapsed ? (
              <ChevronDown size={10} className="text-muted" />
            ) : (
              <ChevronUp size={10} className="text-muted" />
            )}
          </button>

          <span className="text-[10px] text-muted opacity-60">•</span>
          <span className="text-[10px] text-muted opacity-80">{formatTimeAgo(comment.createdAt)}</span>

          {comment.score !== undefined && (
            <>
              <span className="text-[10px] text-muted opacity-60">•</span>
              <span className="text-[10px] font-medium text-muted opacity-80">
                {comment.score} pts
              </span>
            </>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Comment body */}
            <div
              className="mt-1 text-[13px] leading-[1.5] text-theme break-words opacity-95 comment-content"
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: cleanBody }}
            />

            {/* Children */}
            {comment.children.length > 0 && (
              <div className="mt-0.5">
                {comment.children.map(child => (
                  <CommentItem key={child.id} comment={child} maxDepthToShow={maxDepthToShow} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
