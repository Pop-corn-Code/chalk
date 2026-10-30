export const metadata = { title: 'Privacy — Chalk' };

export default function PrivacyPage() {
  return (
    <div className="max-w-[640px] mx-auto px-6 pt-6 pb-24">
      <h1 className="font-display text-[30px] mt-5 mb-1.5">Privacy Policy</h1>
      <p className="text-chalk-dim text-[13px] mb-7">Last updated: September 8, 2026</p>

      <div className="bg-bg-panel border border-dashed border-coral rounded-chalk px-4.5 py-4 text-[13.5px] leading-relaxed text-chalk-dim mb-9">
        <strong className="text-chalk">This is a starting template, not legal advice.</strong> Privacy law varies by
        region (GDPR, CCPA, and others each impose different requirements). Have a qualified attorney review this
        before launch, and update it to match exactly what your deployed app does and where your users are.
      </div>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">What Chalk collects</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        You can try Chalk without an account. Text you paste is sent to Google&apos;s Gemini API to generate a
        response. If you&apos;re signed in, we also save each result to your history: the generated explanation and
        the first ~90 characters of your input as a preview — not the full text. Signing in sets cookies that keep
        you signed in. You can delete your history, or your whole account, from your profile at any time.
      </p>

      <table className="w-full border-collapse mt-2.5 text-[13.5px]">
        <tbody>
          <tr>
            <th className="text-left px-3 py-2.5 border-b border-chalk-faint text-chalk font-semibold">Data</th>
            <th className="text-left px-3 py-2.5 border-b border-chalk-faint text-chalk font-semibold">What happens to it</th>
          </tr>
          <tr>
            <td className="px-3 py-2.5 border-b border-chalk-faint text-chalk-dim">The text you paste</td>
            <td className="px-3 py-2.5 border-b border-chalk-faint text-chalk-dim">Sent from our server to Google&apos;s Gemini API to generate a simplified explanation. Not stored in full by us; for signed-in users, a ~90-character preview is saved with the result</td>
          </tr>
          <tr>
            <td className="px-3 py-2.5 border-b border-chalk-faint text-chalk-dim">Standard technical data</td>
            <td className="px-3 py-2.5 border-b border-chalk-faint text-chalk-dim">Whatever your browser and hosting provider ordinarily log (e.g. IP address, browser type) as part of loading the page and rate-limiting requests</td>
          </tr>
        </tbody>
      </table>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">Third-party processing</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        Chalk uses Google&apos;s Gemini API to generate explanations, called from our server (not your browser).
        Text you submit is processed by Google under its own terms and privacy policy. If you paste confidential,
        sensitive, or personal information, it will be transmitted to that third party — please avoid doing so.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">Payments, email, and usage records</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        If you subscribe to a paid plan, payment is handled by Stripe under its own privacy policy; we store only
        your Stripe customer ID and subscription status. For signed-in users we record each explanation you
        generate (a timestamp and the text length, not the text itself) to enforce plan limits and show your usage.
        If email notifications are enabled, we use Resend to send you account-related messages, such as a notice
        when you&apos;re near your free limit. If you create API keys, only a one-way hash of each key is stored.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">Share links</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        You can choose to make a saved explanation viewable by anyone with its link, via the &quot;Share&quot; button
        on your profile. Only the specific item you share becomes public this way — your account, email, and the
        rest of your history stay private. You can make a shared item private again at any time with
        &quot;Unshare.&quot;
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">What we don&apos;t do</h2>
      <ul className="pl-5 text-[14.5px] leading-relaxed text-chalk-dim">
        <li className="mb-1.5">We don&apos;t sell or share your text with advertisers.</li>
        <li className="mb-1.5">We don&apos;t build a profile of you across visits by default.</li>
        <li className="mb-1.5">We don&apos;t use your submissions to train models on our end.</li>
      </ul>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">Children&apos;s privacy</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        Chalk isn&apos;t directed at children and isn&apos;t intended for use by anyone under 13 (or the minimum age
        required in your region).
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">Changes to this policy</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        This policy may be updated as the app changes. Check back here for the current version.
      </p>

      <h2 className="font-display text-lg font-semibold mt-9 mb-2.5">Contact</h2>
      <p className="text-[14.5px] leading-relaxed text-chalk-dim">
        Questions about this policy can be sent to <em>[add your contact email here]</em>.
      </p>
    </div>
  );
}
