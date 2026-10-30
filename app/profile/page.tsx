'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/AppStateContext';
import { getPlan } from '@/lib/plans';
import UsageChart from '@/components/UsageChart';
import ApiKeysPanel from '@/components/ApiKeysPanel';
import IconSvg from '@/components/IconSvg';
import Avatar from '@/components/Avatar';

const ACCENTS = ['#E7B23A', '#E2694E', '#7FB29A'];

export default function ProfilePage() {
  const {
    user,
    authLoading,
    history,
    historyLoading,
    clearHistory,
    deleteAccount,
    monthlyUsage,
    openBillingPortal,
    openSignin,
    shareHistoryItem,
    unshareHistoryItem,
  } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  if (authLoading) {
    return <div className="text-center py-20 px-6 text-chalk-dim text-sm">Loading your profile…</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-chalk-dim mb-5">Sign in to see your profile and saved history.</p>
        <button
          onClick={() => openSignin('/profile')}
          className="bg-yellow text-[#1A2530] font-semibold text-sm rounded-chalk px-5 py-2.5"
        >
          Sign in
        </button>
      </div>
    );
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function exportData() {
    const payload = { profile: user, history, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chalk-my-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    const ok = confirm(
      'Delete your account and everything in your history? This permanently deletes your row from the database and cannot be undone.'
    );
    if (!ok) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    window.location.href = '/';
  }

  async function handlePortal() {
    setPortalLoading(true);
    setPortalError(null);
    const result = await openBillingPortal();
    if (result.error) {
      setPortalError(result.error);
      setPortalLoading(false);
    }
  }

  async function handleShare(id: string) {
    setShareLoading(true);
    setShareError(null);
    const result = await shareHistoryItem(id);
    setShareLoading(false);
    if (result.error || !result.url) {
      setShareError(result.error || 'Could not create a share link.');
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2500);
    } catch {
      // Clipboard permissions can fail silently in some browsers — the
      // link was still created, so fall back to showing it directly.
      window.prompt('Copy this link:', result.url);
    }
  }

  async function handleUnshare(id: string) {
    setShareLoading(true);
    await unshareHistoryItem(id);
    setShareLoading(false);
  }

  const selected = history.find((h) => h.id === selectedId) || null;

  return (
    <div className="max-w-[780px] mx-auto px-6 pt-6 pb-20">
      <div className="flex items-center gap-4.5 mb-3">
        <Avatar user={user} size={56} />
        <div>
          <p className="font-display text-2xl font-bold m-0">{user.name}</p>
          <p className="text-chalk-dim text-[13.5px] mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-3.5 my-6 flex-wrap">
        <div className="bg-bg-panel border border-chalk-faint rounded-chalk px-5 py-4">
          <div className="font-display text-[26px] font-bold">{history.length}</div>
          <div className="text-[12.5px] text-chalk-dim mt-0.5">Explanations created</div>
        </div>
        <div className="bg-bg-panel border border-chalk-faint rounded-chalk px-5 py-4">
          <div className="font-display text-[26px] font-bold">{getPlan(user.plan).name}</div>
          <div className="text-[12.5px] text-chalk-dim mt-0.5">
            {monthlyUsage
              ? monthlyUsage.cap === null
                ? `${monthlyUsage.used} used this month`
                : `${monthlyUsage.used} of ${monthlyUsage.cap} used this month`
              : 'Current plan'}
          </div>
        </div>
        <div className="bg-bg-panel border border-chalk-faint rounded-chalk px-5 py-4">
          <div className="font-display text-[26px] font-bold">{formatTime(user.joinedAt)}</div>
          <div className="text-[12.5px] text-chalk-dim mt-0.5">Account created at</div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        {user.plan === 'free' ? (
          <a href="/pricing" className="text-[13px] font-semibold bg-yellow text-[#1A2530] rounded-chalk px-4 py-2.5">
            Upgrade plan
          </a>
        ) : (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="text-[13px] font-semibold border border-chalk-faint rounded-chalk px-4 py-2.5 hover:border-chalk-dim disabled:opacity-60"
          >
            {portalLoading ? 'Opening…' : 'Manage billing'}
          </button>
        )}
        {portalError && <p className="text-coral text-xs self-center">{portalError}</p>}
      </div>

      <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-5 mb-6">
        <h2 className="font-display text-[17px] font-semibold mb-3">Activity</h2>
        <UsageChart userId={user.id} />
      </div>

      <div className="mb-10">
        <ApiKeysPanel />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-[17px] font-semibold">Your history</h2>
        {history.length > 0 && (
          <button onClick={() => clearHistory()} className="text-[14.5px] text-chalk-dim hover:text-chalk">
            Clear history
          </button>
        )}
      </div>

      {historyLoading ? (
        <div className="text-chalk-dim text-sm border border-dashed border-chalk-faint rounded-chalk p-8 text-center">
          Loading your history…
        </div>
      ) : history.length === 0 ? (
        <div className="text-chalk-dim text-sm border border-dashed border-chalk-faint rounded-chalk p-8 text-center">
          Nothing here yet.{' '}
          <a href="/tool" className="text-yellow no-underline">Simplify something</a> and it&apos;ll show up here.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
              className="flex items-center gap-3.5 bg-bg-panel border border-chalk-faint rounded-chalk px-4 py-3.5 text-left hover:border-chalk-dim"
            >
              <div className="flex flex-shrink-0">
                {h.concepts.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="w-[22px] h-[22px] -mr-1.5 rounded-full bg-bg p-0.5"
                    style={{ boxShadow: '0 0 0 2px var(--bg-panel)' }}
                  >
                    <IconSvg icon={c.icon} color={ACCENTS[i % ACCENTS.length]} strokeWidth={8} className="w-full h-full" />
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-[14.5px] font-semibold truncate m-0">{h.title}</h4>
                <p className="text-[12.5px] text-chalk-dim truncate m-0">{h.inputPreview}</p>
              </div>
              <div className="text-xs text-chalk-dim flex-shrink-0">{formatTime(h.createdAt)}</div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 bg-bg-panel border border-chalk-faint rounded-chalk p-5">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="font-display text-sm font-semibold text-chalk-dim">{selected.title}</h3>
            {selected.shareSlug ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(selected.id)}
                  disabled={shareLoading}
                  className="text-[12.5px] text-sage border border-sage/40 rounded-chalk px-3 py-1.5 hover:bg-sage/10 disabled:opacity-60"
                >
                  {copiedId === selected.id ? 'Link copied!' : 'Copy share link'}
                </button>
                <button
                  onClick={() => handleUnshare(selected.id)}
                  disabled={shareLoading}
                  className="text-[12.5px] text-chalk-dim border border-chalk-faint rounded-chalk px-3 py-1.5 hover:text-chalk hover:border-chalk-dim disabled:opacity-60"
                >
                  Unshare
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleShare(selected.id)}
                disabled={shareLoading}
                className="text-[12.5px] text-chalk-dim border border-chalk-faint rounded-chalk px-3 py-1.5 hover:text-chalk hover:border-chalk-dim disabled:opacity-60"
              >
                {shareLoading ? 'Creating link…' : 'Share'}
              </button>
            )}
          </div>
          {shareError && <p className="text-coral text-xs mb-3">{shareError}</p>}
          {selected.shareSlug && (
            <p className="text-xs text-chalk-dim mb-4 leading-relaxed">
              Anyone with this link can view this explanation — no account needed. Unshare any time to make it
              private again.
            </p>
          )}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {selected.concepts.map((c, i) => (
              <div key={i} className="border border-dashed border-chalk-faint rounded-chalk p-4 flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11">
                  <IconSvg icon={c.icon} color={ACCENTS[i % ACCENTS.length]} className="w-full h-full" />
                </div>
                <h4 className="font-display text-[13px] font-semibold m-0">{c.title}</h4>
                <p className="text-xs text-chalk-dim m-0">{c.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-11 border-t border-dashed border-chalk-faint pt-5">
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={exportData} className="text-[13px] bg-transparent text-chalk-dim border border-chalk-faint rounded-chalk px-3.5 py-2.5 hover:text-chalk hover:border-chalk-dim">
            Export my data (JSON)
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[13px] bg-transparent text-coral border border-coral/40 rounded-chalk px-3.5 py-2.5 hover:bg-coral/10 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
        {deleteError && <p className="text-coral text-xs mt-2.5">{deleteError}</p>}
      </div>
    </div>
  );
}
