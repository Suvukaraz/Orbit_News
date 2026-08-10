import type { IPost, IComment } from '../types';

export function applyVote(
  currentState: 'up' | 'down' | 'none',
  direction: 'up' | 'down'
): 'up' | 'down' | 'none' {
  if (currentState === direction) return 'none';
  return direction;
}

export function getScoreAdjustment(
  oldState: 'up' | 'down' | 'none',
  newState: 'up' | 'down' | 'none'
): number {
  const stateValue = (s: 'up' | 'down' | 'none') => {
    if (s === 'up') return 1;
    if (s === 'down') return -1;
    return 0;
  };
  return stateValue(newState) - stateValue(oldState);
}

export function voteOnPost(post: IPost, direction: 'up' | 'down'): IPost {
  const newVoteState = applyVote(post.voteState, direction);
  const adjustment = getScoreAdjustment(post.voteState, newVoteState);
  return {
    ...post,
    voteState: newVoteState,
    score: post.score + adjustment,
  };
}

export function voteOnComment(comment: IComment, direction: 'up' | 'down'): IComment {
  const newVoteState = applyVote(comment.voteState, direction);
  const adjustment = getScoreAdjustment(comment.voteState, newVoteState);
  return {
    ...comment,
    voteState: newVoteState,
    score: (comment.score ?? 0) + adjustment,
  };
}
