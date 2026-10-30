'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppState } from '@/lib/AppStateContext';
import { PLANS } from '@/lib/plans';

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" className="flex-shrink-0 mt-0.5">
      <path d="M20 55 L40 75 L82 25" />
    </svg>
  );
}

const FAQ = [
  {
    q: 'What counts as one "explanation"?',
    a: 'Each time you click "Turn into pictures" and get a result back, that\'s one explanation, regardless of how many concept cards it produces. Failed requests that return an error don\'t count.',
  },
  {
    q: 'When do limits reset?',
    a: 'On the first day of each calendar month (UTC). Unused explanations don\'t roll over.',
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes. Use "Manage billing" on your profile to cancel or change plans — it takes you to Stripe\'s billing portal. Cancelling takes effect at the end of the period you\'ve already paid for.',
  },
  {
    q: 'What happens to my saved history if I downgrade?',
    a: 'Nothing — your saved explanations and share links stay exactly as they are. Only the monthly generation limit changes.',
  },
  {
    q: 'How does API access work?',
    a: 'Pro and Business plans can create API keys from the profile page and call POST /api/v1/generate with the same usage limits as the web app.',
  },
];

export default function PricingPage() {
  const { user, monthlyUsage, startCheckout, openBillingPortal, openSignin } = useAppState();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubscribe(planId: 'pro' | 'business') {
    if (!user) {
      openSignin('/pricing');
      return;
    }
    setBusyPlan(planId);
    setError(null);
    const result = await startCheckout(planId);
    if (result.error) {
      setError(result.error);
      setBusyPlan(null);
    }
    // On success the browser navigates to Stripe — nothing more to do here.
  }

  async function handlePortal() {
    setBusyPlan('portal');
    setError(null);
    const result = await openBillingPortal();
    if (result.error) {
      setError(result.error);
      setBusyPlan(null);
    }
  }

  return (
    <div className="max-w-[980px] mx-auto px-6 pt-6 pb-24">
      <div className="mb-10 text-center">
        <h1 className="font-display text-[34px] font-bold mb-3">Simple pricing</h1>
        <p className="text-chalk-dim text-[15px] max-w-[52ch] mx-auto leading-relaxed">
          Start free. Upgrade when you need more explanations, or want to call Chalk from your own tools.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        {PLANS.map((plan) => {
          const isCurrent = user?.plan === plan.id;
          const highlight = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              className={`bg-bg-panel border rounded-chalk p-6 flex flex-col ${highlight ? 'border-yellow' : 'border-chalk-faint'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[14px] font-semibold text-chalk-dim uppercase tracking-wide">{plan.name}</p>
                {highlight && (
                  <span className="text-[10.5px] font-semibold text-[#1A2530] bg-yellow rounded-full px-2 py-0.5">Most popular</span>
                )}
              </div>
              <p className="font-display text-[32px] font-bold mb-5">{plan.priceLabel}</p>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-[13.5px] text-chalk-dim flex gap-2 leading-snug">
                    <CheckIcon color={highlight ? '#E7B23A' : '#7FB29A'} />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                isCurrent ? (
                  <div className="text-center text-[13px] text-chalk-dim border border-chalk-faint rounded-chalk py-2.5">Current plan</div>
                ) : (
                  <Link href="/tool" className="text-center text-[13.5px] font-semibold border border-chalk-faint rounded-chalk py-2.5 hover:border-chalk-dim">
                    Start free
                  </Link>
                )
              ) : isCurrent ? (
                <button
                  onClick={handlePortal}
                  disabled={busyPlan === 'portal'}
                  className="text-[13.5px] font-semibold border border-chalk-faint rounded-chalk py-2.5 hover:border-chalk-dim disabled:opacity-60"
                >
                  {busyPlan === 'portal' ? 'Opening…' : 'Manage billing'}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id as 'pro' | 'business')}
                  disabled={busyPlan === plan.id}
                  className={`text-[13.5px] font-semibold rounded-chalk py-2.5 disabled:opacity-60 ${
                    highlight ? 'bg-yellow text-[#1A2530]' : 'border border-chalk-faint hover:border-chalk-dim'
                  }`}
                >
                  {busyPlan === plan.id ? 'Redirecting…' : `Choose ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-coral text-[13px] text-center mb-6">{error}</p>}

      {user && monthlyUsage && (
        <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-5 mb-12">
          <div className="flex items-center justify-between mb-2.5 text-[13px]">
            <span className="text-chalk-dim">Your usage this month</span>
            <span className="font-semibold">
              {monthlyUsage.cap === null ? `${monthlyUsage.used} used · unlimited` : `${monthlyUsage.used} of ${monthlyUsage.cap}`}
            </span>
          </div>
          {monthlyUsage.cap !== null && (
            <div className="h-1.5 rounded-full bg-chalk-faint overflow-hidden">
              <div
                className="h-full bg-yellow"
                style={{ width: `${Math.min(100, (monthlyUsage.used / monthlyUsage.cap) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="max-w-[680px] mx-auto">
        <h2 className="font-display text-[22px] font-semibold mb-5">Questions</h2>
        <div className="flex flex-col">
          {FAQ.map((item, i) => (
            <div key={item.q} className="border-b border-chalk-faint">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="w-full flex justify-between items-center text-left py-4 text-[14.5px] font-medium"
              >
                {item.q}
                <span className="text-chalk-dim ml-4">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="text-[13.5px] text-chalk-dim leading-relaxed pb-4">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
