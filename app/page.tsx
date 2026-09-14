import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <div className="max-w-[1080px] mx-auto px-6 pt-10 pb-10 grid md:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
        <div>
          <h1 className="font-display text-[46px] leading-[1.12] font-bold mb-4 -tracking-[0.01em]">
            Turn dense text into a few simple pictures.
          </h1>
          <p className="text-[17px] leading-relaxed text-chalk-dim max-w-[46ch] mb-7">
            Paste a paragraph that&apos;s hard to follow — a contract clause, a technical explanation, a wall of
            instructions — and get back a handful of plain ideas, each with a small sketch. Chalk decides how many you
            actually need.
          </p>
          <div className="flex gap-3 flex-wrap items-center">
            <Link href="/tool" className="bg-yellow text-[#1A2530] font-semibold text-[15px] rounded-chalk px-[22px] py-[13px]">
              Try it free
            </Link>
            <a href="#how" className="text-chalk-dim text-[14.5px] border-b border-dashed border-chalk-dim pb-0.5 hover:text-chalk">
              See how it works ↓
            </a>
          </div>
        </div>
        <div>
          <svg viewBox="0 0 460 340" width="100%" fill="none">
            <g stroke="#9FADB8" strokeWidth={3} strokeLinecap="round" opacity={0.55}>
              <line x1="20" y1="30" x2="150" y2="30" /><line x1="20" y1="46" x2="165" y2="46" />
              <line x1="20" y1="62" x2="140" y2="62" /><line x1="20" y1="78" x2="170" y2="78" />
              <line x1="20" y1="94" x2="120" y2="94" /><line x1="20" y1="118" x2="160" y2="118" />
              <line x1="20" y1="134" x2="150" y2="134" /><line x1="20" y1="150" x2="175" y2="150" />
              <line x1="20" y1="166" x2="130" y2="166" /><line x1="20" y1="190" x2="155" y2="190" />
              <line x1="20" y1="206" x2="145" y2="206" /><line x1="20" y1="222" x2="170" y2="222" />
            </g>
            <rect x="8" y="14" width="185" height="235" rx="3" stroke="#9FADB8" strokeWidth={2} opacity={0.3} />
            <path d="M 210 150 Q 250 150 285 150" stroke="#E7B23A" strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
            <path d="M 275 140 L 290 150 L 275 160" stroke="#E7B23A" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <g>
              <rect x="310" y="40" width="120" height="90" rx="3" stroke="#E2694E" strokeWidth={2} strokeDasharray="4 5" />
              <circle cx="345" cy="75" r="16" stroke="#E2694E" strokeWidth={4} />
              <path d="M338 75 l5 6 l12 -14" stroke="#E2694E" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              <line x1="325" y1="105" x2="415" y2="105" stroke="#E2694E" strokeWidth={2} opacity={0.5} />
              <line x1="325" y1="115" x2="395" y2="115" stroke="#E2694E" strokeWidth={2} opacity={0.5} />
            </g>
            <g>
              <rect x="310" y="140" width="120" height="90" rx="3" stroke="#7FB29A" strokeWidth={2} strokeDasharray="4 5" />
              <path d="M330 195 L345 165 L360 185 L375 170 L400 195" stroke="#7FB29A" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="325" y1="205" x2="415" y2="205" stroke="#7FB29A" strokeWidth={2} opacity={0.5} />
              <line x1="325" y1="215" x2="395" y2="215" stroke="#7FB29A" strokeWidth={2} opacity={0.5} />
            </g>
            <g>
              <rect x="310" y="240" width="120" height="90" rx="3" stroke="#E7B23A" strokeWidth={2} strokeDasharray="4 5" />
              <circle cx="345" cy="278" r="13" stroke="#E7B23A" strokeWidth={4} />
              <line x1="365" y1="278" x2="405" y2="278" stroke="#E7B23A" strokeWidth={4} strokeLinecap="round" />
              <line x1="325" y1="305" x2="415" y2="305" stroke="#E7B23A" strokeWidth={2} opacity={0.5} />
              <line x1="325" y1="315" x2="395" y2="315" stroke="#E7B23A" strokeWidth={2} opacity={0.5} />
            </g>
          </svg>
        </div>
      </div>

      <section id="how" className="px-6 py-14">
        <div className="max-w-[1080px] mx-auto">
          <h2 className="font-display text-[28px] font-semibold mb-2.5">How it works</h2>
          <p className="text-chalk-dim text-[15.5px] max-w-[56ch] mb-10 leading-relaxed">
            Three steps. Sign in only if you want your results saved to a profile.
          </p>
          <div className="grid md:grid-cols-3 gap-7">
            <div className="flex flex-col gap-3.5">
              <span className="font-flourish text-[26px] text-yellow font-semibold">1</span>
              <svg width={56} height={56} viewBox="0 0 100 100" fill="none" stroke="#E7B23A" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="22" y="14" width="56" height="72" rx="3" /><line x1="32" y1="32" x2="68" y2="32" />
                <line x1="32" y1="44" x2="68" y2="44" /><line x1="32" y1="56" x2="54" y2="56" />
              </svg>
              <h3 className="font-display text-[17px] font-semibold">Paste your text</h3>
              <p className="text-chalk-dim text-sm leading-relaxed max-w-[32ch]">Drop in the paragraph, clause, or explanation you&apos;re stuck on.</p>
            </div>
            <div className="flex flex-col gap-3.5">
              <span className="font-flourish text-[26px] text-yellow font-semibold">2</span>
              <svg width={56} height={56} viewBox="0 0 100 100" fill="none" stroke="#E2694E" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M50 16 L57 40 L82 47 L57 54 L50 78 L43 54 L18 47 L43 40 Z" />
              </svg>
              <h3 className="font-display text-[17px] font-semibold">Chalk finds the core ideas</h3>
              <p className="text-chalk-dim text-sm leading-relaxed max-w-[32ch]">It picks out exactly as many ideas as the text needs — never padded, never crammed together.</p>
            </div>
            <div className="flex flex-col gap-3.5">
              <span className="font-flourish text-[26px] text-yellow font-semibold">3</span>
              <svg width={56} height={56} viewBox="0 0 100 100" fill="none" stroke="#7FB29A" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="14" y="18" width="32" height="32" rx="2" /><rect x="54" y="18" width="32" height="32" rx="2" />
                <rect x="14" y="54" width="32" height="32" rx="2" /><rect x="54" y="54" width="32" height="32" rx="2" />
              </svg>
              <h3 className="font-display text-[17px] font-semibold">You get simple sketches</h3>
              <p className="text-chalk-dim text-sm leading-relaxed max-w-[32ch]">Each idea comes with a small icon and a plain one-line explanation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="max-w-[1080px] mx-auto">
          <h2 className="font-display text-[28px] font-semibold mb-2.5">See it in action</h2>
          <p className="text-chalk-dim text-[15.5px] max-w-[56ch] mb-10 leading-relaxed">A dense legal clause, simplified into four ideas.</p>
          <div className="bg-bg-panel border border-chalk-faint rounded-chalk p-8 grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div>
              <h4 className="text-xs text-chalk-dim mb-3 font-medium">Before</h4>
              <div className="text-[13.5px] leading-relaxed text-chalk-dim border-l-2 border-chalk-faint pl-3.5">
                &quot;Notwithstanding any provision herein to the contrary, either party may terminate this Agreement upon
                thirty (30) days&apos; prior written notice in the event of a material breach by the other party that remains
                uncured following notice and a reasonable cure period, provided that such termination shall not relieve
                either party of obligations accrued prior to the effective date of termination.&quot;
              </div>
            </div>
            <div className="justify-self-center md:rotate-0 rotate-90">
              <svg width={28} height={28} viewBox="0 0 100 100" fill="none" stroke="#E7B23A" strokeWidth={6} strokeLinecap="round">
                <line x1="15" y1="50" x2="80" y2="50" /><path d="M65 32 L83 50 L65 68" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs text-chalk-dim mb-3 font-medium">After</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-dashed border-chalk-faint rounded-chalk p-3.5 text-center flex flex-col items-center gap-2">
                  <svg width={34} height={34} viewBox="0 0 100 100" fill="none" stroke="#E2694E" strokeWidth={5} strokeLinecap="round"><path d="M30 30 L70 70 M70 30 L30 70" /><circle cx="50" cy="50" r="34" /></svg>
                  <span className="text-xs text-chalk-dim">Either side can walk away</span>
                </div>
                <div className="border border-dashed border-chalk-faint rounded-chalk p-3.5 text-center flex flex-col items-center gap-2">
                  <svg width={34} height={34} viewBox="0 0 100 100" fill="none" stroke="#7FB29A" strokeWidth={5} strokeLinecap="round"><rect x="20" y="30" width="60" height="45" rx="3" /><line x1="20" y1="45" x2="80" y2="45" /></svg>
                  <span className="text-xs text-chalk-dim">Must give 30 days&apos; notice</span>
                </div>
                <div className="border border-dashed border-chalk-faint rounded-chalk p-3.5 text-center flex flex-col items-center gap-2">
                  <svg width={34} height={34} viewBox="0 0 100 100" fill="none" stroke="#E7B23A" strokeWidth={5} strokeLinecap="round"><path d="M50 20 L50 55" /><circle cx="50" cy="72" r="4" fill="#E7B23A" stroke="none" /></svg>
                  <span className="text-xs text-chalk-dim">Only if the problem isn&apos;t fixed</span>
                </div>
                <div className="border border-dashed border-chalk-faint rounded-chalk p-3.5 text-center flex flex-col items-center gap-2">
                  <svg width={34} height={34} viewBox="0 0 100 100" fill="none" stroke="#9FADB8" strokeWidth={5} strokeLinecap="round"><rect x="22" y="22" width="56" height="56" rx="4" /><line x1="35" y1="50" x2="65" y2="50" /></svg>
                  <span className="text-xs text-chalk-dim">Old debts still count</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center px-6 py-16">
        <h2 className="font-display text-[30px] font-bold mb-3.5">Stop re-reading the same paragraph.</h2>
        <p className="text-chalk-dim mb-7">It&apos;s free to try and takes less time than reading this sentence twice.</p>
        <Link href="/tool" className="inline-block bg-yellow text-[#1A2530] font-semibold text-[15px] rounded-chalk px-[22px] py-[13px]">
          Try Chalk now
        </Link>
      </section>
    </>
  );
}
