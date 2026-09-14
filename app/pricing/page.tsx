'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/AppStateContext';
import { PRICING, estimateCost, formatCurrency } from '@/lib/pricing';

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" className="flex-shrink-0 mt-0.5">
      <path d="M20 55 L40 75 L82 25" />
    </svg>
  );
}

export default function PricingPage() {
  const { usage, sessionUsageTotal } = useAppState();
  const [calcLength, setCalcLength] = useState(1000);
  const [calcAttempts, setCalcAttempts] = useState(3);

  const freeUsed = Math.min(calcAttempts, PRICING.freeAttempts);
  const paidAttempts = Math.max(calcAttempts - PRICING.freeAttempts, 0);
  const perPaidAttempt = estimateCost(calcLength).total;
  const calcTotal = paidAttempts * perPaidAttempt;

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-6 pb-24">
      <div className="mb-9">
        <h1 className="font-display text-[32px] font-bold mb-2.5">Pricing</h1>
        <p className="text-chalk-dim text-[15px] max-w-[58ch] leading-relaxed">
          Chalk&apos;s cost has two parts: a small fee per attempt (each time you generate an explanation), and a fee
          based on how much text you&apos;re asking it to read. Short texts and fewer attempts cost less.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-11">
        <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-6">
          <p className="text-[15px] font-semibold text-chalk-dim uppercase tracking-wide mb-2">Free</p>
          <p className="font-display text-[30px] font-bold mb-1">$0 <span className="text-sm text-chalk-dim font-medium">/ session</span></p>
          <p className="text-[13px] text-chalk-dim mb-4.5">Your first {PRICING.freeAttempts} attempts, any length up to 6,000 characters.</p>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            <li className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug"><CheckIcon color="#7FB29A" />{PRICING.freeAttempts} free attempts per browser session</li>
            <li className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug"><CheckIcon color="#7FB29A" />Up to 6,000 characters per attempt</li>
            <li className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug"><CheckIcon color="#7FB29A" />Resets when you refresh the page</li>
          </ul>
        </div>
        <div className="bg-bg-panel border border-yellow rounded-chalk p-6">
          <p className="text-[15px] font-semibold text-chalk-dim uppercase tracking-wide mb-2">Pay as you go</p>
          <p className="font-display text-[30px] font-bold mb-1">
            {formatCurrency(PRICING.attemptFee)} <span className="text-sm text-chalk-dim font-medium">/ attempt</span>
          </p>
          <p className="text-[13px] text-chalk-dim mb-4.5">Kicks in automatically after your {PRICING.freeAttempts} free attempts.</p>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            <li className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug"><CheckIcon color="#E7B23A" />{formatCurrency(PRICING.attemptFee)} base fee, every attempt</li>
            <li className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug"><CheckIcon color="#E7B23A" />+ {formatCurrency(PRICING.per500Chars)} for every 500 characters of input</li>
            <li className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug"><CheckIcon color="#E7B23A" />No subscription, no minimum</li>
          </ul>
        </div>
      </div>

      <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-6.5 mb-10">
        <h2 className="font-display text-[17px] font-semibold mb-1.5">Cost calculator</h2>
        <p className="text-chalk-dim text-[13px] mb-5.5">Drag these to estimate what a session would cost.</p>
        <div className="grid md:grid-cols-2 gap-6 mb-5.5">
          <div>
            <label className="flex justify-between text-[13px] text-chalk-dim mb-2">
              Text length <strong className="text-chalk font-semibold">{calcLength.toLocaleString()} characters</strong>
            </label>
            <input
              type="range"
              min={100}
              max={6000}
              step={50}
              value={calcLength}
              onChange={(e) => setCalcLength(Number(e.target.value))}
              className="w-full accent-yellow"
            />
          </div>
          <div>
            <label className="flex justify-between text-[13px] text-chalk-dim mb-2">
              Attempts this session <strong className="text-chalk font-semibold">{calcAttempts}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={calcAttempts}
              onChange={(e) => setCalcAttempts(Number(e.target.value))}
              className="w-full accent-yellow"
            />
          </div>
        </div>
        <div className="flex items-baseline gap-2.5 border-t border-dashed border-chalk-faint pt-4.5 flex-wrap">
          <div className="font-display text-[28px] font-bold">{formatCurrency(calcTotal)}</div>
          <div className="text-[12.5px] text-chalk-dim">
            {paidAttempts === 0
              ? `All ${calcAttempts} attempt${calcAttempts === 1 ? '' : 's'} covered by the free tier`
              : `${freeUsed} free + ${paidAttempts} paid at ${formatCurrency(perPaidAttempt)} each`}
          </div>
        </div>
      </div>

      <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-5.5">
        <h2 className="font-display text-base font-semibold mb-1">Your usage this session</h2>
        <p className="text-[12.5px] text-chalk-dim mb-4">Live — based on what you&apos;ve actually generated in the tool. Resets on refresh, and nothing is really charged.</p>
        {usage.length === 0 ? (
          <div className="text-chalk-dim text-sm border border-dashed border-chalk-faint rounded-chalk p-8 text-center">
            No attempts yet this session.{' '}
            <a href="/tool" className="text-yellow no-underline">Try the tool</a> and this fills in.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5 text-[12.5px]">
              {usage.map((u) => (
                <div key={u.num} className="flex justify-between py-2 border-b border-chalk-faint text-chalk-dim">
                  <span className="text-chalk">Attempt {u.num} — {u.charCount.toLocaleString()} chars</span>
                  <span className={u.free ? 'text-sage font-semibold' : 'text-coral font-semibold'}>
                    {u.free ? 'Free' : formatCurrency(u.cost)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 text-sm font-semibold">
              <span>Total this session</span>
              <span>{formatCurrency(sessionUsageTotal())}</span>
            </div>
          </>
        )}
      </div>

      <p className="mt-10 text-[12.5px] text-chalk-dim leading-relaxed border-t border-dashed border-chalk-faint pt-5">
        This pricing is illustrative for the demo — it shows what a real usage-based plan could look like, calculated
        live from your actual attempts and text length. No payment is collected and no card is required anywhere in
        this app. See the README for how to wire this up to real Stripe metered billing.
      </p>
    </div>
  );
}
