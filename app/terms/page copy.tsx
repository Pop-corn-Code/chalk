export const metadata = { title: 'Terms — Chalk' };

export default function TermsPage() {
  return (
    <div className="max-w-[640px] mx-auto px-6 pt-6 pb-24">
      <h1 className="font-display text-[30px] mt-5 mb-1">Terms of Service</h1>
      <p className="text-chalk-dim text-[13px] mb-7">Last updated: September 8, 2026</p>

      <div className="bg-bg-panel border border-dashed border-coral rounded-chalk px-4 py-4 text-[13px] leading-relaxed text-chalk-dim mb-9">
        <strong className="text-chalk">This is a starting template, not legal advice.</strong> It&apos;s written to be a
        reasonable, plain-language draft for a small tool like this one — not a substitute for a lawyer. Before using
        this with real users, have a qualified attorney review and adapt it to your business, your jurisdiction, and
        how the app actually works.
      </div>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">What Chalk is</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        Chalk is a tool that takes text you paste in and turns it into a short set of simplified explanations and
        icons, using an AI model. It&apos;s provided as-is, for helping you understand dense text more easily.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Using the service</h2>
      <ul className="pl-5 text-[14px] leading-relaxed text-chalk-dim">
        <li className="mb-1">You&apos;re responsible for the text you submit. Don&apos;t paste anything you don&apos;t have the right to share, or anything confidential, private, or sensitive (see our Privacy Policy for why).</li>
        <li className="mb-1">Don&apos;t use Chalk to generate or distribute unlawful, abusive, or infringing content.</li>
        <li className="mb-1">Chalk simplifies text automatically. Simplified output can omit nuance or be inaccurate — don&apos;t rely on it for legal, medical, financial, or safety-critical decisions without checking the original text.</li>
      </ul>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Pricing and billing</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        The pricing shown in the app is illustrative for this demo — no payment is currently collected. If real
        billing is enabled in a live deployment, its own terms (what&apos;s metered, refund policy, etc.) would be
        added here.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">No account, no guarantee of availability</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        Chalk currently doesn&apos;t require a verified account and doesn&apos;t promise uptime, data retention, or
        continued availability. Features may change or the service may be discontinued at any time.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Ownership</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        You retain rights to the text you submit. You&apos;re free to use the simplified explanations Chalk generates
        for you. Chalk itself, its design, and its code belong to its operator.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Disclaimer of warranties</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        Chalk is provided &quot;as is,&quot; without warranties of any kind, express or implied, including accuracy,
        fitness for a particular purpose, or non-infringement.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Limitation of liability</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        To the fullest extent permitted by law, Chalk&apos;s operator isn&apos;t liable for indirect, incidental, or
        consequential damages arising from your use of the service, including decisions made based on simplified
        output.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Changes to these terms</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        These terms may be updated from time to time. Continued use of Chalk after a change means you accept the
        updated terms.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2">Contact</h2>
      <p className="text-[14px] leading-relaxed text-chalk-dim">
        Questions about these terms can be sent to <em>[add your contact email here]</em>.
      </p>
    </div>
  );
}
