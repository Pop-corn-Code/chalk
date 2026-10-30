// Transactional email via Resend's REST API (no SDK needed for one call
// type). This is separate from the magic-link emails Supabase sends
// itself — this is for app-triggered notifications like "you're close to
// your free tier limit."
//
// If RESEND_API_KEY isn't set, every call here is a silent no-op rather
// than a thrown error — a missing optional feature shouldn't take down
// generation. Check the server logs if an email you expected didn't send.

export async function sendLimitWarningEmail(to: string, name: string, attemptsUsed: number, attemptsAllowed: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log('[email] RESEND_API_KEY or RESEND_FROM_EMAIL not set — skipping limit-warning email.');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: `You're close to your free Chalk limit this month`,
        html: `
          <p>Hi ${escapeHtml(name)},</p>
          <p>You've used ${attemptsUsed} of your ${attemptsAllowed} free explanations this month.</p>
          <p>Once you reach the limit, you can keep going by upgrading to a paid plan — no interruption, just
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/pricing">pick a plan here</a> any time.</p>
          <p>— Chalk</p>
        `,
      }),
    });
    if (!res.ok) {
      console.error('[email] Resend request failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[email] failed to send limit-warning email:', err);
  }
}

function escapeHtml(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
