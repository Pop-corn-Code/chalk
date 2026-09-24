'use client';

import { useState, useRef } from 'react';
import { useAppState } from '@/lib/AppStateContext';
import { estimateCost, formatCurrency, isFreeAttempt, PRICING } from '@/lib/pricing';
import type { Concept } from '@/lib/types';
import IconSvg from '@/components/IconSvg';

const EXAMPLE_TEXT =
  "In cryptographic protocols, a zero-knowledge proof is a method by which one party (the prover) can prove to another party (the verifier) that a given statement is true, while avoiding conveying to the verifier any information beyond the mere fact that the statement is indeed true. The essential properties are completeness, soundness, and zero-knowledge itself, meaning the verifier learns nothing other than the fact that the statement holds.";

const MAX_CHARS_SENT = 6000;
const COOLDOWN_MS = 4000;
const ACCENTS = ['#E7B23A', '#E2694E', '#7FB29A', '#F3F0E7'];

export default function ToolPage() {
  const { user, logAttempt, saveToHistory, sessionUsageTotal, usage, openSignin } = useAppState();

  const [inputText, setInputText] = useState('');
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptNote, setAttemptNote] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const lastRunAt = useRef(0);

  const nextAttemptNum = usage.length + 1;

  async function handleGenerate() {
    const text = inputText.trim();
    if (!text) {
      setError('Paste some text first.');
      return;
    }

    const now = Date.now();
    if (now - lastRunAt.current < COOLDOWN_MS) {
      setError('Give it a few seconds between requests.');
      return;
    }

    setError(null);
    setSavedNote(false);
    setLoading(true);
    lastRunAt.current = now;

    const attempt = logAttempt(text.slice(0, MAX_CHARS_SENT).length);

    let res: Response;
    try {
      res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (err) {
      console.error(err);
      setError('Could not reach the server. Check your connection and try again.');
      setLoading(false);
      return;
    }

    if (!res.ok) {
      let message = `Request failed (${res.status}). Try again.`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        // ignore — keep default message
      }
      setError(message);
      setLoading(false);
      return;
    }

    try {
      const data = await res.json();
      if (!data.concepts || !Array.isArray(data.concepts) || data.concepts.length === 0) {
        throw new Error('no-concepts');
      }
      setConcepts(data.concepts);
      if (user) {
        try {
          await saveToHistory(text, data.concepts);
          setSavedNote(true);
        } catch (err) {
          console.error('Failed to save history:', err);
          // Non-fatal — the person still sees their result, it just won't
          // show up on the profile page.
        }
      }
      setAttemptNote(
        attempt.free
          ? `Free — attempt ${attempt.num} of ${PRICING.freeAttempts} used.`
          : `${formatCurrency(attempt.cost)} charged for this attempt — session total ${formatCurrency(sessionUsageTotal() + attempt.cost)}.`
      );
    } catch (err) {
      console.error(err);
      setError("That text didn't come back in a format Chalk could use. Try shorter or simpler text.");
    } finally {
      setLoading(false);
    }
  }

  function useExample() {
    setInputText(EXAMPLE_TEXT);
  }

  function resetResults() {
    setConcepts(null);
    setError(null);
    setSavedNote(false);
  }

  function downloadSVG() {
    if (!concepts || !concepts.length) return;
    const cardW = 220, cardH = 190, gap = 20, pad = 30;
    const cols = Math.min(concepts.length, 3);
    const rows = Math.ceil(concepts.length / cols);
    const width = pad * 2 + cols * cardW + (cols - 1) * gap;
    const height = pad * 2 + rows * cardH + (rows - 1) * gap + 40;
    let body = '';
    concepts.forEach((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = pad + col * (cardW + gap), y = pad + 40 + row * (cardH + gap);
      const color = ACCENTS[i % ACCENTS.length];
      const iconInner = (c.icon || '').replace(/<(\w+)([^>]*)\/?>/g, (m, tag, attrs) => `<${tag}${attrs} stroke="${color}" fill="none" stroke-width="5"/>`);
      body += `<g transform="translate(${x},${y})">
        <rect width="${cardW}" height="${cardH}" rx="4" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 5"/>
        <g transform="translate(${cardW / 2 - 26},20) scale(0.52)">${iconInner}</g>
        <text x="${cardW / 2}" y="112" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="#F3F0E7">${escapeXml(c.title)}</text>
        ${wrapSvgText(c.blurb, cardW - 24, 12, cardW / 2, 132, '#9FADB8')}
      </g>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#212F3D"/>
      <text x="${pad}" y="${pad + 6}" font-family="sans-serif" font-size="18" font-weight="700" fill="#F3F0E7">Simplified with Chalk</text>
      ${body}
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chalk-explanation.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function copyAsText() {
    if (!concepts || !concepts.length) return;
    const text = concepts.map((c, i) => `${i + 1}. ${c.title} — ${c.blurb}`).join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  const charCount = inputText.length;
  const overLimit = charCount > MAX_CHARS_SENT;
  const liveCost = nextAttemptNum > PRICING.freeAttempts && charCount > 0 ? estimateCost(charCount) : null;

  return (
    <div className="max-w-[1080px] mx-auto px-6 pt-6 pb-20">
      <div className="mb-7">
        <h1 className="font-display font-bold text-[30px] mb-1.5 flex items-baseline gap-3 flex-wrap">
          Chalk <span className="font-flourish text-xl text-yellow">— explain it simply</span>
        </h1>
        <p className="text-chalk-dim text-[15px] max-w-[52ch] leading-relaxed">
          Paste a dense paragraph, contract clause, or technical explanation. Chalk breaks it into a few plain ideas,
          each with a small sketch.
        </p>
      </div>

      <div className="grid md:grid-cols-[360px_1fr] gap-7 items-stretch">
        <section className="bg-bg-panel border border-chalk-faint rounded-chalk p-5">
          <label htmlFor="inputText" className="block text-[13px] text-chalk-dim mb-2.5">Your text</label>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={20000}
            placeholder="e.g. an explanation of how vaccines train the immune system, a paragraph from a legal contract, a dense product spec..."
            className="w-full min-h-[200px] bg-transparent border border-dashed border-chalk-faint rounded-chalk text-chalk text-[14.5px] leading-relaxed p-3.5 focus:outline-none focus:border-yellow resize-y"
          />
          <div className={`flex justify-end text-[11.5px] mt-1.5 ${overLimit ? 'text-coral' : 'text-chalk-dim'}`}>
            {charCount.toLocaleString()} / {MAX_CHARS_SENT.toLocaleString()} characters used
            {overLimit && ' — only the first 6,000 will be used'}
          </div>

          <div className="text-[12.5px] text-chalk-dim mt-2.5 flex items-center gap-1.5 flex-wrap">
            {nextAttemptNum <= PRICING.freeAttempts ? (
              <>
                <span className="font-semibold text-sage">Free</span> — attempt {nextAttemptNum} of {PRICING.freeAttempts} included
              </>
            ) : liveCost ? (
              <>
                <span className="font-semibold text-coral">{formatCurrency(liveCost.total)}</span> for this attempt ($0.03 base + {formatCurrency(liveCost.lengthFee)} for {charCount.toLocaleString()} characters)
              </>
            ) : null}
          </div>

          <div className="flex gap-2.5 mt-3.5 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-yellow text-[#1A2530] font-semibold text-sm rounded-chalk px-4 py-2.5 disabled:opacity-60"
            >
              {loading ? 'Sketching…' : 'Turn into pictures'}
            </button>
            <button
              type="button"
              onClick={useExample}
              className="bg-transparent text-chalk-dim border border-chalk-faint rounded-chalk px-4 py-2.5 text-sm hover:text-chalk hover:border-chalk-dim"
            >
              Try an example
            </button>
          </div>

          {error && <p className="mt-3 text-[13px] text-coral leading-relaxed">{error}</p>}

          {attemptNote && !error && (
            <p className="mt-3.5 text-[12.5px] text-chalk-dim">
              {attemptNote}{' '}
              <a href="/pricing" className="border-b border-dashed border-chalk-faint hover:text-chalk cursor-pointer">See pricing</a>
            </p>
          )}

          {!user && !attemptNote && (
            <p className="mt-3.5 text-[12.5px] text-chalk-dim leading-relaxed">
              Results aren&apos;t saved right now.{' '}
              <button onClick={() => openSignin('/tool')} className="border-b border-dashed border-chalk-faint hover:text-chalk">
                Sign in
              </button>{' '}
              to keep a history of what you&apos;ve simplified.
            </p>
          )}
          {savedNote && <p className="mt-3.5 text-[12.5px] text-sage">Saved to your history.</p>}
        </section>

        <section className="bg-bg-panel border border-chalk-faint rounded-chalk p-5 min-h-[320px] flex flex-col">
          {loading ? (
            <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center gap-3.5 text-chalk-dim text-sm">
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-coral animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-sage animate-bounce [animation-delay:300ms]" />
              </div>
              <div>Sketching it out…</div>
            </div>
          ) : concepts ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-[15px] font-semibold text-chalk-dim">
                  {concepts.length} simple idea{concepts.length === 1 ? '' : 's'}
                </h2>
                <button onClick={resetResults} className="text-[12.5px] text-chalk-dim border border-chalk-faint rounded-chalk px-3 py-1.5 hover:text-chalk hover:border-chalk-dim">
                  Start over
                </button>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
                {concepts.map((c, i) => (
                  <div key={i} className="border border-dashed border-chalk-faint rounded-chalk p-5 flex flex-col items-center text-center gap-3 bg-white/[0.015]">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <IconSvg icon={c.icon} color={ACCENTS[i % ACCENTS.length]} className="w-full h-full" />
                    </div>
                    <h3 className="font-display text-[15.5px] font-semibold">{c.title}</h3>
                    <p className="text-[13px] leading-relaxed text-chalk-dim">{c.blurb}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 mt-4 flex-wrap">
                <button onClick={downloadSVG} className="text-[12.5px] text-chalk-dim border border-chalk-faint rounded-chalk px-3 py-1.5 hover:text-chalk hover:border-chalk-dim">
                  Download as image (SVG)
                </button>
                <button onClick={copyAsText} className="text-[12.5px] text-chalk-dim border border-chalk-faint rounded-chalk px-3 py-1.5 hover:text-chalk hover:border-chalk-dim">
                  Copy as text
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center text-center gap-3 text-chalk-dim px-5">
              <svg width={56} height={56} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="opacity-50">
                <path d="M20 70 L20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 55 Q80 65 70 65 L40 65 L25 78 L28 65 Z" />
              </svg>
              <p className="text-sm max-w-[34ch]">Your simplified explanation will appear here as a set of small sketches.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function escapeXml(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrapSvgText(text: string, maxWidth: number, fontSize: number, cx: number, startY: number, fill: string): string {
  const words = (text || '').split(' ');
  const lines: string[] = [];
  let line = '';
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.52));
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > charsPerLine) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  });
  if (line) lines.push(line.trim());
  return lines
    .slice(0, 3)
    .map(
      (l, i) =>
        `<text x="${cx}" y="${startY + i * (fontSize + 5)}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" fill="${fill}">${escapeXml(l)}</text>`
    )
    .join('');
}
