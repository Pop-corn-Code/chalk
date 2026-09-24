'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/lib/AppStateContext';
import Avatar from './Avatar';

export default function NavBar() {
  const { user, theme, toggleTheme, signOut, openSignin } = useAppState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between max-w-[1080px] mx-auto px-6 py-5 relative z-20">
      <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-chalk">
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" stroke="#E7B23A" strokeWidth={6} strokeLinecap="round">
          <path d="M20 70 L20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 55 Q80 65 70 65 L40 65 L25 78 L28 65 Z" />
        </svg>
        Chalk
      </Link>

      <div className="hidden md:flex items-center gap-6 text-[14.5px] text-chalk-dim">
        <Link href="/" className="hover:text-chalk">Home</Link>
        <Link href="/tool" className="hover:text-chalk">Try it</Link>
        {/* <Link href="/pricing" className="hover:text-chalk">Pricing</Link> */}
        <Link href="/terms" className="hover:text-chalk">Terms</Link>
        <Link href="/privacy" className="hover:text-chalk">Privacy</Link>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title="Switch theme"
          className="w-[34px] h-[34px] rounded-full border border-chalk-faint flex items-center justify-center text-chalk-dim hover:text-chalk hover:border-chalk-dim"
        >
          {theme === 'dark' ? '◐' : '◑'}
        </button>

        {!user ? (
          <button
            onClick={() => openSignin('/tool')}
            className="px-3.5 py-2 text-[13.5px] rounded-chalk border border-chalk-faint text-chalk-dim hover:text-chalk hover:border-chalk-dim"
          >
            Sign in
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 border border-chalk-faint rounded-full pl-1.5 pr-3 py-1.5 text-[13.5px] text-chalk hover:border-chalk-dim"
            >
              <Avatar user={user} size={26} />
              {user.name.split(' ')[0]}
            </button>
            {dropdownOpen && (
              <div className="absolute top-11 right-0 bg-bg-panel border border-chalk-faint rounded-chalk min-w-[170px] p-1.5 flex flex-col z-30">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="text-left px-2.5 py-2 rounded-chalk text-[13.5px] text-chalk-dim hover:bg-white/5 hover:text-chalk"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setDropdownOpen(false);
                  }}
                  className="text-left px-2.5 py-2 rounded-chalk text-[13.5px] text-chalk-dim hover:bg-white/5 hover:text-chalk"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        aria-controls="mobileMenu"
        className="md:hidden w-[34px] h-[34px] rounded-full border border-chalk-faint flex items-center justify-center text-chalk-dim"
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          id="mobileMenu"
          className="md:hidden absolute top-[62px] right-6 left-6 bg-bg-panel border border-chalk-faint rounded-chalk p-2.5 flex flex-col z-40"
        >
          <Link href="/" onClick={() => setMobileOpen(false)} className="px-2.5 py-3 rounded-chalk text-chalk hover:bg-white/5">Home</Link>
          <Link href="/tool" onClick={() => setMobileOpen(false)} className="px-2.5 py-3 rounded-chalk text-chalk hover:bg-white/5">Try it</Link>
          <Link href="/pricing" onClick={() => setMobileOpen(false)} className="px-2.5 py-3 rounded-chalk text-chalk hover:bg-white/5">Pricing</Link>
          <Link href="/terms" onClick={() => setMobileOpen(false)} className="px-2.5 py-3 rounded-chalk text-chalk hover:bg-white/5">Terms</Link>
          <Link href="/privacy" onClick={() => setMobileOpen(false)} className="px-2.5 py-3 rounded-chalk text-chalk hover:bg-white/5">Privacy</Link>
          {!user ? (
            <button
              onClick={() => { setMobileOpen(false); openSignin('/tool'); }}
              className="px-2.5 py-3 rounded-chalk text-left text-yellow"
            >
              Sign in
            </button>
          ) : (
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="px-2.5 py-3 rounded-chalk text-left text-coral"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
