'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/lib/AppStateContext';

export default function SignInModal() {
  const { signinOpen, closeSignin, sendMagicLink, signInWithGoogle } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (signinOpen) {
      lastFocused.current = document.activeElement;
      nameInputRef.current?.focus();
    } else if (lastFocused.current instanceof HTMLElement) {
      lastFocused.current.focus();
      setStatus('idle');
      setName('');
      setEmail('');
      setErrorMsg('');
      setGoogleLoading(false);
    }
  }, [signinOpen]);

  useEffect(() => {
    if (!signinOpen) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeSignin();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>('button, input, [href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [signinOpen, closeSignin]);

  if (!signinOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('sending');
    const result = await sendMagicLink(name.trim(), email.trim());
    if (result.error) {
      setErrorMsg(result.error);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setErrorMsg('');
    const result = await signInWithGoogle();
    // Success redirects the whole page to Google, so this only runs on failure.
    if (result.error) {
      setErrorMsg(result.error);
      setStatus('error');
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSignin();
      }}
    >
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="signinTitle" className="relative bg-bg-panel border border-chalk-faint rounded-chalk max-w-[380px] w-full p-7">
        <button onClick={closeSignin} aria-label="Close sign-in dialog" className="absolute top-4 right-4 text-chalk-dim text-lg">✕</button>

        {status === 'sent' ? (
          <>
            <h2 id="signinTitle" className="font-display text-xl font-semibold mb-1.5">Check your email</h2>
            <p className="text-chalk-dim text-[13.5px] leading-relaxed mb-2">
              We sent a sign-in link to <strong className="text-chalk">{email}</strong>. Click it to finish signing in
              — you can close this window.
            </p>
            <p className="text-xs text-chalk-dim mt-4 leading-relaxed opacity-80">
              No password needed. The link expires after a while and only works once.
            </p>
          </>
        ) : (
          <>
            <h2 id="signinTitle" className="font-display text-xl font-semibold mb-1.5">Sign in to Chalk</h2>
            <p className="text-chalk-dim text-[13.5px] leading-relaxed mb-5">
              New here? The same form creates your account — nothing extra to fill in.
            </p>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-chalk text-[#1A2530] font-semibold text-sm rounded-chalk py-2.5 mb-4 disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.7 34.5 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C41.9 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>
              </svg>
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-chalk-faint" />
              <span className="text-xs text-chalk-dim">or</span>
              <div className="flex-1 h-px bg-chalk-faint" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3.5">
                <label htmlFor="signinName" className="block text-xs text-chalk-dim mb-1.5">Name</label>
                <input
                  ref={nameInputRef}
                  id="signinName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  className="w-full bg-transparent border border-dashed border-chalk-faint rounded-chalk text-chalk text-sm px-3 py-2.5 focus:outline-none focus:border-yellow"
                />
              </div>
              <div className="mb-3.5">
                <label htmlFor="signinEmail" className="block text-xs text-chalk-dim mb-1.5">Email</label>
                <input
                  id="signinEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ada@example.com"
                  required
                  className="w-full bg-transparent border border-dashed border-chalk-faint rounded-chalk text-chalk text-sm px-3 py-2.5 focus:outline-none focus:border-yellow"
                />
              </div>
              {status === 'error' && <p className="text-coral text-xs mb-3">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full mt-2 bg-yellow text-[#1A2530] font-semibold text-sm rounded-chalk py-2.5 disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
            <p className="text-xs text-chalk-dim mt-4 leading-relaxed opacity-80">
              Your profile and history are stored for real once you sign in — see the Privacy page for details.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
