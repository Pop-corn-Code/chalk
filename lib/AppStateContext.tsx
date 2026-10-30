'use client';

// User identity, search history, plan, and usage are all backed by
// Supabase (Postgres + Auth) — see supabase/schema.sql for the tables and
// row-level security policies that make this safe.
//
// Still client-only / demo, deliberately: `theme`, a per-visit preference
// with no reason to be durable.

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { generateApiKey } from '@/lib/apiKeys';
import { getPlan, monthStartISO } from '@/lib/plans';
import type { User, HistoryItem, ApiKey, PlanId, Concept } from './types';

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
  share_slug: string | null;
}

function rowToHistoryItem(row: HistoryRow): HistoryItem {
  return {
    id: row.id,
    inputPreview: row.input_preview,
    title: row.title,
    concepts: row.concepts,
    createdAt: row.created_at,
    shareSlug: row.share_slug,
  };
}

// Short, URL-safe token for /share/[slug]. Not a security boundary by
// itself — the UNIQUE constraint in the database is — just needs to be
// hard to guess and unlikely to collide.
function generateShareSlug(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

interface AppState {
  user: User | null;
  authLoading: boolean;
  history: HistoryItem[];
  historyLoading: boolean;
  monthlyUsage: { used: number; cap: number | null } | null;
  monthlyUsageLoading: boolean;
  refreshMonthlyUsage: () => Promise<void>;
  apiKeys: ApiKey[];
  apiKeysLoading: boolean;
  /** Returns the full key exactly once — it can't be retrieved again after this. */
  createApiKey: (name: string) => Promise<{ fullKey?: string; error?: string }>;
  revokeApiKey: (id: string) => Promise<void>;
  /** Redirects to Stripe Checkout on success. */
  startCheckout: (planId: 'pro' | 'business') => Promise<{ error?: string }>;
  /** Redirects to the Stripe Customer Portal on success. */
  openBillingPortal: () => Promise<{ error?: string }>;
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
  saveToHistory: (inputText: string, concepts: Concept[]) => Promise<void>;
  /** Generates a share_slug if the item doesn't have one yet, and returns the full public URL either way. */
  shareHistoryItem: (id: string) => Promise<{ url?: string; error?: string }>;
  unshareHistoryItem: (id: string) => Promise<void>;
}

const AppStateCtx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<{ used: number; cap: number | null } | null>(null);
  const [monthlyUsageLoading, setMonthlyUsageLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [signinOpen, setSigninOpen] = useState(false);
  const [returnPath, setReturnPath] = useState('/tool');

  // Build our lighter-weight `User` shape from a Supabase auth user, plus
  // whatever profile data we have. `fallbackName`/`fallbackAvatar` come from
  // the `profiles` table when available; if that query hasn't resolved yet
  // (or the row doesn't exist for a brand-new user), we fall back to
  // user_metadata, which Google OAuth populates directly and magic-link
  // sign-in populates via the `data: { full_name }` we pass at sign-in time.
  const buildUser = useCallback(
    (
      supaUser: SupabaseUser,
      fallbackName?: string,
      fallbackAvatar?: string | null,
      plan?: PlanId,
      subscriptionStatus?: string | null
    ): User => {
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
        plan: plan || 'free',
        subscriptionStatus: subscriptionStatus ?? null,
      };
    },
    []
  );

  const loadHistory = useCallback(
    async (userId: string) => {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('history')
        .select('id, input_preview, title, concepts, created_at, share_slug')
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

  const loadMonthlyUsage = useCallback(
    async (userId: string, plan: PlanId) => {
      setMonthlyUsageLoading(true);
      const { count, error } = await supabase
        .from('usage_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStartISO());
      if (error) {
        console.error('Failed to load usage:', error);
        setMonthlyUsage(null);
      } else {
        setMonthlyUsage({ used: count ?? 0, cap: getPlan(plan).monthlyAttempts });
      }
      setMonthlyUsageLoading(false);
    },
    [supabase]
  );

  const loadApiKeys = useCallback(
    async (userId: string) => {
      setApiKeysLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, created_at, last_used_at')
        .eq('user_id', userId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load API keys:', error);
        setApiKeys([]);
      } else {
        setApiKeys(
          (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            keyPrefix: row.key_prefix,
            createdAt: row.created_at,
            lastUsedAt: row.last_used_at,
          }))
        );
      }
      setApiKeysLoading(false);
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
          .select('full_name, avatar_url, plan, subscription_status')
          .eq('id', supaUser.id)
          .single();
        const plan = (profile?.plan as PlanId) || 'free';
        setUser(buildUser(supaUser, profile?.full_name, profile?.avatar_url, plan, profile?.subscription_status));
        loadHistory(supaUser.id);
        loadMonthlyUsage(supaUser.id, plan);
        loadApiKeys(supaUser.id);
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
          .select('full_name, avatar_url, plan, subscription_status')
          .eq('id', session.user.id)
          .single();
        const plan = (profile?.plan as PlanId) || 'free';
        setUser(buildUser(session.user, profile?.full_name, profile?.avatar_url, plan, profile?.subscription_status));
        loadHistory(session.user.id);
        loadMonthlyUsage(session.user.id, plan);
        loadApiKeys(session.user.id);
      } else {
        setUser(null);
        setHistory([]);
        setMonthlyUsage(null);
        setApiKeys([]);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, buildUser, loadHistory, loadMonthlyUsage, loadApiKeys]);

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
    setMonthlyUsage(null);
    setApiKeys([]);
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
    setMonthlyUsage(null);
    setApiKeys([]);
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
        .select('id, input_preview, title, concepts, created_at, share_slug')
        .single();
      if (error) {
        console.error('Failed to save history:', error);
        return;
      }
      setHistory((prev) => [rowToHistoryItem(data as HistoryRow), ...prev]);
    },
    [supabase, user]
  );

  const shareHistoryItem = useCallback(
    async (id: string): Promise<{ url?: string; error?: string }> => {
      if (!user) return { error: 'Not signed in.' };

      const existing = history.find((h) => h.id === id);
      if (existing?.shareSlug) {
        return { url: `${window.location.origin}/share/${existing.shareSlug}` };
      }

      const slug = generateShareSlug();
      const { data, error } = await supabase
        .from('history')
        .update({ share_slug: slug })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('share_slug')
        .single();

      if (error || !data) {
        console.error('Failed to share history item:', error);
        return { error: 'Could not create a share link. Try again.' };
      }

      setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, shareSlug: data.share_slug } : h)));
      return { url: `${window.location.origin}/share/${data.share_slug}` };
    },
    [supabase, user, history]
  );

  const unshareHistoryItem = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('history')
        .update({ share_slug: null })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('Failed to unshare history item:', error);
        return;
      }
      setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, shareSlug: null } : h)));
    },
    [supabase, user]
  );

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  // Called by the tool page right after a successful generation, so the
  // "X of Y used this month" display updates immediately rather than
  // waiting for the next page load. The server (app/api/generate) is the
  // one actually enforcing the limit and writing the usage_events row —
  // this just re-reads the count to keep the UI in sync.
  const refreshMonthlyUsage = useCallback(async () => {
    if (!user) return;
    await loadMonthlyUsage(user.id, user.plan);
  }, [user, loadMonthlyUsage]);

  const createApiKey = useCallback(
    async (name: string): Promise<{ fullKey?: string; error?: string }> => {
      if (!user) return { error: 'Not signed in.' };
      const { fullKey, hash, prefix } = await generateApiKey();
      const { error } = await supabase
        .from('api_keys')
        .insert({ user_id: user.id, name: name || 'Default key', key_hash: hash, key_prefix: prefix });
      if (error) {
        console.error('Failed to create API key:', error);
        return { error: 'Could not create a key. Try again.' };
      }
      await loadApiKeys(user.id);
      return { fullKey }; // shown once — not retrievable after this
    },
    [supabase, user, loadApiKeys]
  );

  const revokeApiKey = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('Failed to revoke API key:', error);
        return;
      }
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    },
    [supabase, user]
  );

  const startCheckout = useCallback(async (planId: 'pro' | 'business'): Promise<{ error?: string }> => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      return { error: body.error || 'Could not start checkout.' };
    }
    window.location.href = body.url; // Stripe-hosted Checkout — navigates away
    return {};
  }, []);

  const openBillingPortal = useCallback(async (): Promise<{ error?: string }> => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      return { error: body.error || 'Could not open the billing portal.' };
    }
    window.location.href = body.url;
    return {};
  }, []);

  return (
    <AppStateCtx.Provider
      value={{
        user,
        authLoading,
        history,
        historyLoading,
        monthlyUsage,
        monthlyUsageLoading,
        refreshMonthlyUsage,
        apiKeys,
        apiKeysLoading,
        createApiKey,
        revokeApiKey,
        startCheckout,
        openBillingPortal,
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
        saveToHistory,
        shareHistoryItem,
        unshareHistoryItem,
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

