'use client';

// User identity and search history are now backed by Supabase (Postgres +
// Auth) instead of in-memory mock state — see supabase/schema.sql for the
// tables and row-level security policies that make this safe.
//
// Still in-memory / demo, deliberately out of scope for this change:
// - `usage` (the pricing meter) — see lib/pricing.ts and the README's
//   "Next steps" section for how to make that real with Stripe.
// - `theme` — a per-visit preference, fine to keep client-only.

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User, HistoryItem, UsageEntry, Concept } from './types';
import { PRICING, estimateCost, isFreeAttempt } from './pricing';

const ACCENTS = ['#E7B23A', '#E2694E', '#7FB29A'];

function initialsFor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

interface HistoryRow {
  id: string;
  input_preview: string;
  title: string;
  concepts: Concept[];
  created_at: string;
}

function rowToHistoryItem(row: HistoryRow): HistoryItem {
  return {
    id: row.id,
    inputPreview: row.input_preview,
    title: row.title,
    concepts: row.concepts,
    createdAt: row.created_at,
  };
}

interface AppState {
  user: User | null;
  authLoading: boolean;
  history: HistoryItem[];
  historyLoading: boolean;
  usage: UsageEntry[];
  theme: 'dark' | 'light';
  signinOpen: boolean;
  openSignin: (returnPath?: string) => void;
  closeSignin: () => void;
  /** Sends a magic-link email. Doesn't sign the user in immediately — Supabase auth is asynchronous by nature (the user has to click the link). */
  sendMagicLink: (name: string, email: string) => Promise<{ error?: string }>;
  /** Redirects the browser to Google's consent screen. Never resolves normally — the page navigates away. */
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  clearHistory: () => Promise<void>;
  toggleTheme: () => void;
  logAttempt: (charCount: number) => UsageEntry;
  saveToHistory: (inputText: string, concepts: Concept[]) => Promise<void>;
  sessionUsageTotal: () => number;
}

const AppStateCtx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [signinOpen, setSigninOpen] = useState(false);
  const [returnPath, setReturnPath] = useState('/tool');

  // Build our lighter-weight `User` shape from a Supabase auth user, plus
  // whatever profile data we have. `fallbackName`/`fallbackAvatar` come from
  // the `profiles` table when available; if that query hasn't resolved yet
  // (or the row doesn't exist for a brand-new user), we fall back to
  // user_metadata, which Google OAuth populates directly and magic-link
  // sign-in populates via the `data: { full_name }` we pass at sign-in time.
  const buildUser = useCallback((supaUser: SupabaseUser, fallbackName?: string, fallbackAvatar?: string | null): User => {
    const name = fallbackName || (supaUser.user_metadata?.full_name as string) || supaUser.email || 'You';
    const avatarUrl = fallbackAvatar ?? (supaUser.user_metadata?.avatar_url as string | undefined) ?? null;
    return {
      id: supaUser.id,
      name,
      email: supaUser.email || '',
      initials: initialsFor(name),
      color: colorFor(supaUser.id),
      avatarUrl,
      joinedAt: supaUser.created_at,
    };
  }, []);

  const loadHistory = useCallback(
    async (userId: string) => {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('history')
        .select('id, input_preview, title, concepts, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load history:', error);
        setHistory([]);
      } else {
        setHistory((data as HistoryRow[]).map(rowToHistoryItem));
      }
      setHistoryLoading(false);
    },
    [supabase]
  );

  // Initial session check + subscribe to sign-in/sign-out events.
  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(async ({ data: { user: supaUser } }) => {
      if (!active) return;
      if (supaUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', supaUser.id)
          .single();
        setUser(buildUser(supaUser, profile?.full_name, profile?.avatar_url));
        loadHistory(supaUser.id);
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        setUser(buildUser(session.user, profile?.full_name, profile?.avatar_url));
        loadHistory(session.user.id);
      } else {
        setUser(null);
        setHistory([]);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, buildUser, loadHistory]);

  const openSignin = useCallback((path?: string) => {
    setReturnPath(path || '/tool');
    setSigninOpen(true);
  }, []);
  const closeSignin = useCallback(() => setSigninOpen(false), []);

  const sendMagicLink = useCallback(
    async (name: string, email: string): Promise<{ error?: string }> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`,
          data: { full_name: name },
        },
      });
      if (error) return { error: error.message };
      return {};
    },
    [supabase, returnPath]
  );

  // Google doesn't ask for a name up front — Supabase pulls full_name and
  // avatar_url straight from the Google profile, which our profiles-table
  // trigger picks up on first sign-in (see supabase/schema.sql).
  const signInWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`,
      },
    });
    if (error) return { error: error.message };
    return {}; // On success the browser navigates to Google — this line rarely runs.
  }, [supabase, returnPath]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    router.push('/');
  }, [supabase, router]);

  const deleteAccount = useCallback(async (): Promise<{ error?: string }> => {
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error || 'Could not delete account.' };
    }
    setUser(null);
    setHistory([]);
    return {};
  }, []);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from('history').delete().eq('user_id', user.id);
    if (error) {
      console.error('Failed to clear history:', error);
      return;
    }
    setHistory([]);
  }, [supabase, user]);

  const saveToHistory = useCallback(
    async (inputText: string, concepts: Concept[]) => {
      if (!user) return;
      const inputPreview = inputText.length > 90 ? inputText.slice(0, 90) + '…' : inputText;
      const title = concepts[0]?.title || 'Untitled explanation';
      const { data, error } = await supabase
        .from('history')
        .insert({ user_id: user.id, input_preview: inputPreview, title, concepts })
        .select('id, input_preview, title, concepts, created_at')
        .single();
      if (error) {
        console.error('Failed to save history:', error);
        return;
      }
      setHistory((prev) => [rowToHistoryItem(data as HistoryRow), ...prev]);
    },
    [supabase, user]
  );

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  // Relies on the caller only invoking this once per attempt, synchronously
  // before the API call — the tool page disables the generate button while
  // a request is in flight, so there's no concurrent-call race here.
  const logAttempt = useCallback(
    (charCount: number): UsageEntry => {
      const num = usage.length + 1;
      const free = isFreeAttempt(num);
      const cost = free ? 0 : estimateCost(charCount).total;
      const entry: UsageEntry = { num, charCount, free, cost, at: new Date().toISOString() };
      setUsage((prev) => [...prev, entry]);
      return entry;
    },
    [usage.length]
  );

  const sessionUsageTotal = useCallback(() => usage.reduce((sum, u) => sum + u.cost, 0), [usage]);

  return (
    <AppStateCtx.Provider
      value={{
        user,
        authLoading,
        history,
        historyLoading,
        usage,
        theme,
        signinOpen,
        openSignin,
        closeSignin,
        sendMagicLink,
        signInWithGoogle,
        signOut,
        deleteAccount,
        clearHistory,
        toggleTheme,
        logAttempt,
        saveToHistory,
        sessionUsageTotal,
      }}
    >
      {children}
    </AppStateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error('useAppState must be used within <AppStateProvider>');
  return ctx;
}

export { PRICING };
