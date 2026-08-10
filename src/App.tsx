import {
  HashRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CommentsScreen } from './screens/CommentsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Home, Search, Settings } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useFeedStore, type ViewMode } from './stores/feedStore';
import { useState } from 'react';
import { SideNav } from './components/SideNav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function useIsDesktop() {
  const viewMode = useFeedStore(s => s.viewMode);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (viewMode === 'desktop') return true;
  if (viewMode === 'mobile') return false;
  return windowWidth >= 1024;
}

function BottomNav() {
  const location = useLocation();
  const isCommentsPage = location.pathname.startsWith('/comments');
  const isDesktop = useIsDesktop();

  if (isCommentsPage || isDesktop) return null;

  const navItems = [
    { to: '/', icon: Home, label: 'Feed' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className="sticky bottom-0 z-40 backdrop-blur-xl border-t border-theme"
      style={{ backgroundColor: 'color-mix(in srgb, var(--c-surface-alt) 92%, transparent)' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 px-6 transition-all duration-200 relative ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function MainSwipeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const isUserSwiping = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const lastPath = useRef(location.pathname);
  const isLargeScreen = useIsDesktop();

  const paths = ['/', '/search', '/settings'];
  const currentIndex = paths.indexOf(location.pathname);

  // Sync scroll position with URL
  useEffect(() => {
    if (!scrollRef.current || currentIndex === -1 || isLargeScreen) return;

    const container = scrollRef.current;
    const updatePosition = () => {
      const pageWidth = container.offsetWidth;
      if (pageWidth === 0) {
        requestAnimationFrame(updatePosition);
        return;
      }

      const targetX = currentIndex * pageWidth;

      // If the scroll position is significantly different from where it should be based on URL
      if (Math.abs(container.scrollLeft - targetX) > 10) {
        isProgrammaticScroll.current = true;
        container.scrollTo({
          left: targetX,
          behavior: isReady ? 'smooth' : 'auto'
        });

        if (!isReady) {
          setIsReady(true);
          // Small delay to ensure browser doesn't fire spurious scroll events
          setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
        } else {
          setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
        }
      } else if (!isReady) {
        setIsReady(true);
      }
    };

    updatePosition();
    lastPath.current = location.pathname;
  }, [location.pathname, currentIndex, isReady]);

  const handleScroll = () => {
    // CRITICAL: Only allow navigation if the user is actually swiping
    // OR if it's a momentum scroll following a user swipe.
    // This prevents browser scroll restoration from triggering unwanted navigations.
    if (!scrollRef.current || !isReady || isProgrammaticScroll.current) return;

    const container = scrollRef.current;
    const pageWidth = container.offsetWidth;
    if (pageWidth === 0) return;

    const scrollLeft = container.scrollLeft;
    const scrollFraction = scrollLeft / pageWidth;
    const newIndex = Math.round(scrollFraction);

    const isNearPageCenter = Math.abs(scrollFraction - newIndex) < 0.05;

    // Only navigate if we are near a page center AND it's a different page
    // AND we are either touching or the scroll was recently initiated by a touch
    if (isNearPageCenter && paths[newIndex] && paths[newIndex] !== location.pathname) {
      if (isUserSwiping.current || !isProgrammaticScroll.current) {
        lastPath.current = paths[newIndex];
        navigate(paths[newIndex], { replace: true });
      }
    }
  };

  if (isLargeScreen) {
    return (
      <div className="flex-1 h-full overflow-hidden">
        {location.pathname === '/' && <HomeScreen />}
        {location.pathname === '/search' && <SearchScreen />}
        {location.pathname === '/settings' && <SettingsScreen />}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onTouchStart={() => { isUserSwiping.current = true; }}
      onTouchEnd={() => {
        // We keep isUserSwiping true for a moment to allow momentum scroll to finish
        setTimeout(() => { isUserSwiping.current = false; }, 1000);
      }}
      className="flex-1 h-full flex overflow-x-auto snap-x no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-w-full h-full snap-center overflow-y-auto">
        <HomeScreen />
      </div>
      <div className="min-w-full h-full snap-center overflow-y-auto">
        <SearchScreen />
      </div>
      <div className="min-w-full h-full snap-center overflow-y-auto">
        <SettingsScreen />
      </div>
    </div>
  );
}

function AppLayout() {
  useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const startPage = useFeedStore(s => s.startPage);
  const isDesktop = useIsDesktop();

  // Force navigate to preferred start page ONLY on the very first mount of the app
  const hasInitialNavigated = useRef(false);
  useEffect(() => {
    if (!hasInitialNavigated.current) {
      if (location.pathname === '/') { // Only redirect if we are at root, otherwise respect current route
        if (startPage !== '/') {
          navigate(startPage, { replace: true });
        }
      }
      hasInitialNavigated.current = true;
    }
  }, [startPage, navigate]);

  return (
    <div className={`h-screen flex flex-row bg-app mx-auto relative overflow-hidden shadow-2xl ${isDesktop ? 'max-w-none' : 'max-w-2xl shadow-none'}`}>
      <SideNav />
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isDesktop ? 'lg:mx-0 lg:border-r lg:border-theme' : 'max-w-2xl mx-auto'}`}>
        <div className="flex-1 h-full overflow-hidden relative flex flex-col">
          <Routes>
            <Route path="/comments/:sourceType/*" element={<CommentsScreen />} />
            <Route path="/*" element={<MainSwipeLayout />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
      {/* Spacer for desktop to keep content centered relative to the whole screen */}
      {isDesktop && <div className="w-64 bg-app" />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppLayout />
      </Router>
    </QueryClientProvider>
  );
}
