'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/AppStateContext';

export default function ApiKeysPanel() {
  const { user, apiKeys, apiKeysLoading, createApiKey, revokeApiKey } = useAppState();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const result = await createApiKey(name.trim());
    setCreating(false);
    if (result.error || !result.fullKey) {
      setError(result.error || 'Could not create a key.');
      return;
    }
    setNewKey(result.fullKey);
    setName('');
  }

  async function copyKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy your API key:', newKey);
    }
  }

  const paid = user?.plan === 'pro' || user?.plan === 'business';

  return (
    <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-5">
      <h2 className="font-display text-[17px] font-semibold mb-1">API access</h2>
      <p className="text-[13px] text-chalk-dim mb-4 leading-relaxed">
        Call Chalk from your own code. Keys work on Pro and Business plans and share your monthly usage limit.
        {!paid && (
          <>
            {' '}
            <a href="/pricing" className="text-yellow no-underline">Upgrade to use the API.</a>
          </>
        )}
      </p>

      {newKey && (
        <div className="border border-sage/50 bg-sage/5 rounded-chalk p-3.5 mb-4">
          <p className="text-[12.5px] text-sage font-semibold mb-1.5">Copy this key now — you won&apos;t see it again.</p>
          <code className="block text-[12.5px] break-all text-chalk mb-2.5">{newKey}</code>
          <div className="flex gap-2">
            <button onClick={copyKey} className="text-[12.5px] border border-chalk-faint rounded-chalk px-3 py-1.5 hover:border-chalk-dim">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => setNewKey(null)} className="text-[12.5px] text-chalk-dim px-3 py-1.5 hover:text-chalk">
              I&apos;ve saved it
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-4 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Production)"
          maxLength={60}
          className="flex-1 min-w-[180px] bg-transparent border border-dashed border-chalk-faint rounded-chalk text-chalk text-[13px] px-3 py-2 focus:outline-none focus:border-yellow"
        />
        <button
          type="submit"
          disabled={creating}
          className="text-[13px] font-semibold bg-yellow text-[#1A2530] rounded-chalk px-3.5 py-2 disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create key'}
        </button>
      </form>
      {error && <p className="text-coral text-xs mb-3">{error}</p>}

      {apiKeysLoading ? (
        <p className="text-xs text-chalk-dim">Loading keys…</p>
      ) : apiKeys.length === 0 ? (
        <p className="text-xs text-chalk-dim">No keys yet.</p>
      ) : (
        <div className="flex flex-col">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 py-2.5 border-t border-chalk-faint text-[13px]">
              <div className="min-w-0">
                <div className="font-medium truncate">{k.name}</div>
                <div className="text-xs text-chalk-dim">
                  {k.keyPrefix}… · {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'never used'}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Revoke "${k.name}"? Anything using it will stop working immediately.`)) revokeApiKey(k.id);
                }}
                className="text-xs text-coral border border-coral/40 rounded-chalk px-2.5 py-1 hover:bg-coral/10 flex-shrink-0"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      <details className="mt-4">
        <summary className="text-xs text-chalk-dim cursor-pointer">Example request</summary>
        <pre className="text-[11.5px] text-chalk-dim bg-black/20 rounded-chalk p-3 mt-2 overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain'}/api/v1/generate \\
  -H "Authorization: Bearer sk_chalk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Your dense paragraph here"}'`}</pre>
      </details>
    </div>
  );
}
