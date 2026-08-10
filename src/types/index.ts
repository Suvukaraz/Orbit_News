export interface IPost {
  id: string;
  title: string;
  score: number;
  commentCount: number;
  createdAt: number; // unix timestamp in seconds
  sourceLabel: string;
  url: string;
  author: string;
  body?: string;
  thumbnail?: string;
  sourceType: 'hn' | 'lemmy';
  // Lemmy-specific fields for API calls
  lemmyInstance?: string;
  lemmyCommunity?: string;
  lemmyPostId?: number;
  // HN-specific
  hnId?: number;
  // vote state (local only)
  voteState: 'up' | 'down' | 'none';
}

export interface IComment {
  id: string;
  author: string;
  body: string;
  createdAt: number;
  depth: number;
  children: IComment[];
  sourceType: 'hn' | 'lemmy';
  score?: number;
  voteState: 'up' | 'down' | 'none';
}

export type SourceFilter =
  | 'all'
  | 'hn'
  | string; // Dynamic lemmy filters: 'lemmy:community@instance'

export interface LemmyCommunityConfig {
  instance: string;
  community: string;
  label: string;
  filterKey: SourceFilter;
}

export const DEFAULT_LEMMY_COMMUNITIES: LemmyCommunityConfig[] = [
  { instance: 'lemmy.world', community: 'technology', label: 'technology@lemmy.world', filterKey: 'lemmy:technology@lemmy.world' },
  { instance: 'lemmy.world', community: 'opensource', label: 'opensource@lemmy.world', filterKey: 'lemmy:opensource@lemmy.world' },
  { instance: 'lemmy.world', community: 'linux', label: 'linux@lemmy.world', filterKey: 'lemmy:linux@lemmy.world' },
  { instance: 'lemmy.world', community: 'hardware', label: 'Hardware@lemmy.world', filterKey: 'lemmy:hardware@lemmy.world' },
  { instance: 'lemmy.world', community: 'games', label: 'games@lemmy.world', filterKey: 'lemmy:games@lemmy.world' },
  { instance: 'lemmy.world', community: 'pcgaming', label: 'pcgaming@lemmy.world', filterKey: 'lemmy:pcgaming@lemmy.world' },
  { instance: 'programming.dev', community: 'ai', label: 'AI@programming.dev', filterKey: 'lemmy:ai@programming.dev' },
];

// ----- Sorting -----
export type SortMode = 'hot' | 'new' | 'top' | 'active' | 'comments';

export interface SortOption {
  value: SortMode;
  label: string;
  icon: string; // emoji fallback; UI uses lucide icons
  description: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'hot', label: 'Hot', icon: '🔥', description: 'Trending right now' },
  { value: 'new', label: 'New', icon: '🆕', description: 'Newest first' },
  { value: 'top', label: 'Top', icon: '🏆', description: 'Highest score' },
  { value: 'active', label: 'Active', icon: '⚡', description: 'Most discussed & recent' },
  { value: 'comments', label: 'Comments', icon: '💬', description: 'Most comments' },
];

// ----- Theme presets (dark only) -----
export type ThemeId =
  | 'midnight' | 'carbon' | 'nord' | 'dracula' | 'oled' | 'ocean'
  | 'emerald' | 'amethyst' | 'crimson' | 'gold' | 'slate' | 'nebula';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    bg: string;          // app background
    surface: string;     // card background
    surfaceHover: string;
    surfaceAlt: string;  // header / nav background
    border: string;
    text: string;
    textMuted: string;
    accent: string;      // primary accent
    accentSoft: string;  // accent tint background
    hn: string;          // HN source color
    lemmy: string;       // Lemmy source color
  };
  // preview gradient for the picker
  preview: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight',
    name: 'Midnight Indigo',
    description: 'Deep indigo & violet',
    colors: {
      bg: '#0b0b1a',
      surface: '#16162e',
      surfaceHover: '#1e1e3f',
      surfaceAlt: '#101024',
      border: 'rgba(255,255,255,0.07)',
      text: '#e8e8f5',
      textMuted: 'rgba(232,232,245,0.45)',
      accent: '#818cf8',
      accentSoft: 'rgba(129,140,248,0.16)',
      hn: '#fb923c',
      lemmy: '#a78bfa',
    },
    preview: 'linear-gradient(135deg,#0b0b1a,#312e81)',
  },
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Neutral graphite grays',
    colors: {
      bg: '#0d0d0f',
      surface: '#18181b',
      surfaceHover: '#232327',
      surfaceAlt: '#111113',
      border: 'rgba(255,255,255,0.08)',
      text: '#ededed',
      textMuted: 'rgba(237,237,237,0.45)',
      accent: '#f97316',
      accentSoft: 'rgba(249,115,22,0.15)',
      hn: '#fb923c',
      lemmy: '#38bdf8',
    },
    preview: 'linear-gradient(135deg,#0d0d0f,#3f3f46)',
  },
  {
    id: 'nord',
    name: 'Nord Frost',
    description: 'Cool arctic blues',
    colors: {
      bg: '#2e3440',
      surface: '#3b4252',
      surfaceHover: '#434c5e',
      surfaceAlt: '#292e38',
      border: 'rgba(255,255,255,0.08)',
      text: '#eceff4',
      textMuted: 'rgba(236,239,244,0.5)',
      accent: '#88c0d0',
      accentSoft: 'rgba(136,192,208,0.18)',
      hn: '#d08770',
      lemmy: '#b48ead',
    },
    preview: 'linear-gradient(135deg,#2e3440,#5e81ac)',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'Purple & pink night',
    colors: {
      bg: '#1a1826',
      surface: '#282a36',
      surfaceHover: '#343746',
      surfaceAlt: '#1e1f2b',
      border: 'rgba(255,255,255,0.08)',
      text: '#f8f8f2',
      textMuted: 'rgba(248,248,242,0.45)',
      accent: '#bd93f9',
      accentSoft: 'rgba(189,147,249,0.16)',
      hn: '#ffb86c',
      lemmy: '#ff79c6',
    },
    preview: 'linear-gradient(135deg,#282a36,#bd93f9)',
  },
  {
    id: 'oled',
    name: 'True Black',
    description: 'Pure OLED black',
    colors: {
      bg: '#000000',
      surface: '#0c0c0c',
      surfaceHover: '#161616',
      surfaceAlt: '#000000',
      border: 'rgba(255,255,255,0.09)',
      text: '#fafafa',
      textMuted: 'rgba(250,250,250,0.42)',
      accent: '#22d3ee',
      accentSoft: 'rgba(34,211,238,0.14)',
      hn: '#fb923c',
      lemmy: '#22d3ee',
    },
    preview: 'linear-gradient(135deg,#000000,#0891b2)',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Teal & deep sea blue',
    colors: {
      bg: '#08141a',
      surface: '#0f2027',
      surfaceHover: '#173540',
      surfaceAlt: '#0a1a20',
      border: 'rgba(255,255,255,0.07)',
      text: '#e3f2f5',
      textMuted: 'rgba(227,242,245,0.45)',
      accent: '#2dd4bf',
      accentSoft: 'rgba(45,212,191,0.16)',
      hn: '#fbbf24',
      lemmy: '#5eead4',
    },
    preview: 'linear-gradient(135deg,#08141a,#0d9488)',
  },
  {
    id: 'emerald',
    name: 'Emerald Night',
    description: 'Deep forest greens',
    colors: {
      bg: '#022c22',
      surface: '#064e3b',
      surfaceHover: '#065f46',
      surfaceAlt: '#022c22',
      border: 'rgba(255,255,255,0.08)',
      text: '#ecfdf5',
      textMuted: 'rgba(236,253,245,0.45)',
      accent: '#10b981',
      accentSoft: 'rgba(16,185,129,0.15)',
      hn: '#fb923c',
      lemmy: '#34d399',
    },
    preview: 'linear-gradient(135deg,#022c22,#065f46)',
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst',
    description: 'Deep violet & gold',
    colors: {
      bg: '#1e1b4b',
      surface: '#312e81',
      surfaceHover: '#3730a3',
      surfaceAlt: '#1e1b4b',
      border: 'rgba(255,255,255,0.1)',
      text: '#f5f3ff',
      textMuted: 'rgba(245,243,255,0.48)',
      accent: '#a78bfa',
      accentSoft: 'rgba(167,139,250,0.16)',
      hn: '#fb923c',
      lemmy: '#c084fc',
    },
    preview: 'linear-gradient(135deg,#1e1b4b,#4338ca)',
  },
  {
    id: 'gold',
    name: 'Midnight Sun',
    description: 'Pure black & vibrant gold',
    colors: {
      bg: '#000000',
      surface: '#111111',
      surfaceHover: '#1a1a1a',
      surfaceAlt: '#000000',
      border: 'rgba(255,255,255,0.1)',
      text: '#ffffff',
      textMuted: 'rgba(255,255,255,0.45)',
      accent: '#facc15',
      accentSoft: 'rgba(250,204,21,0.15)',
      hn: '#f97316',
      lemmy: '#fbbf24',
    },
    preview: 'linear-gradient(135deg,#000000,#854d0e)',
  },
  {
    id: 'crimson',
    name: 'Crimson Tide',
    description: 'Dark red & charcoal',
    colors: {
      bg: '#0a0a0a',
      surface: '#1a1212',
      surfaceHover: '#2a1a1a',
      surfaceAlt: '#0a0a0a',
      border: 'rgba(255,255,255,0.08)',
      text: '#fef2f2',
      textMuted: 'rgba(254,242,242,0.45)',
      accent: '#ef4444',
      accentSoft: 'rgba(239,68,68,0.14)',
      hn: '#fb923c',
      lemmy: '#f87171',
    },
    preview: 'linear-gradient(135deg,#0a0a0a,#7f1d1d)',
  },
  {
    id: 'slate',
    name: 'Slate Flux',
    description: 'Modern blue-grey',
    colors: {
      bg: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      surfaceAlt: '#0f172a',
      border: 'rgba(255,255,255,0.08)',
      text: '#f8fafc',
      textMuted: 'rgba(248,250,252,0.45)',
      accent: '#38bdf8',
      accentSoft: 'rgba(56,189,248,0.15)',
      hn: '#fb923c',
      lemmy: '#7dd3fc',
    },
    preview: 'linear-gradient(135deg,#0f172a,#1e40af)',
  },
  {
    id: 'nebula',
    name: 'Nebula Dream',
    description: 'Vivid cosmic colors',
    colors: {
      bg: '#050505',
      surface: '#121212',
      surfaceHover: '#1e1b2e',
      surfaceAlt: '#050505',
      border: 'rgba(255,255,255,0.1)',
      text: '#fdf2ff',
      textMuted: 'rgba(253,242,255,0.45)',
      accent: '#e879f9',
      accentSoft: 'rgba(232,121,249,0.16)',
      hn: '#fb923c',
      lemmy: '#d946ef',
    },
    preview: 'linear-gradient(135deg,#050505,#701a75)',
  },
];

export function getTheme(id: ThemeId): ThemePreset {
  return THEME_PRESETS.find(t => t.id === id) || THEME_PRESETS[0];
}
