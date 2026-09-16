import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientKey } from '@/lib/rateLimit';
import { stripDangerousServer } from '@/lib/sanitizeIcon';
import type { GenerateResponse, GenerateErrorResponse } from '@/lib/types';

export const runtime = 'nodejs';

const MAX_CHARS = 6000;

const SYSTEM_PROMPT = `You turn dense or complex text into a small set of very simple visual explanations for someone who understands pictures better than paragraphs.

Given the user's text, respond with ONLY a valid JSON object, no markdown fences, no preamble, matching exactly this shape:
{"concepts":[{"title":"2-4 words","blurb":"one plain sentence, under 16 words, no jargon","icon":"SVG shape elements only"}]}

Rules:
- Decide the number of concepts based on what the text actually needs — don't target a fixed count. A short text that makes one simple point should get 1-2 concepts. A text with several distinct steps, clauses, or ideas should get more. Never pad with filler ideas to reach a round number, and never cram unrelated ideas into one card just to keep the count low.
- Use the smallest number of concepts that fully covers the core ideas without leaving anything important out. Hard limit: never exceed 9 concepts, even for very long or dense text — if there are more than 9 distinct ideas, group closely related ones together.
- "icon" is SVG markup WITHOUT the outer <svg> tag: only <circle>, <rect>, <line>, <ellipse>, <polygon>, <polyline>, <path>, or <g> elements, using coordinates within a 0-100 by 0-100 space. Use at most 5 shape elements per icon. Do not set stroke, fill, or color attributes (the app applies those). Keep icons extremely simple and iconic, like a quick whiteboard sketch, not a detailed illustration.
- Do not include any text elements, logos, or copyrighted characters in icons.
- blurb should explain the idea in plain, concrete language a beginner would understand, not a restatement of jargon.`;

function extractJson(text: string): any {
  let t = text.trim();
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response.');
  return JSON.parse(t.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers);
  const rate = await checkRateLimit(clientKey);
  if (!rate.allowed) {
    return NextResponse.json<GenerateErrorResponse>(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } }
    );
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<GenerateErrorResponse>({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body.text !== 'string' || !body.text.trim()) {
    return NextResponse.json<GenerateErrorResponse>({ error: 'Missing "text" in request body.' }, { status: 400 });
  }

  const trimmedText = body.text.trim().slice(0, MAX_CHARS);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json<GenerateErrorResponse>(
      { error: 'Server is missing ANTHROPIC_API_KEY. Set it in .env.local (see .env.example).' },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: trimmedText }],
      }),
    });
  } catch (err) {
    console.error('[api/generate] network error reaching Anthropic:', err);
    return NextResponse.json<GenerateErrorResponse>({ error: 'Could not reach the model provider.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const status = upstream.status;
    const message =
      status === 429
        ? 'The model provider is rate-limiting this server. Try again shortly.'
        : status >= 500
          ? 'The model provider is having trouble right now. Try again shortly.'
          : `Upstream request failed (${status}).`;
    return NextResponse.json<GenerateErrorResponse>({ error: message }, { status: 502 });
  }

  try {
    const data = await upstream.json();
    const textBlocks: string = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');
    if (!textBlocks) throw new Error('Empty response from model.');

    const parsed = extractJson(textBlocks);
    if (!parsed?.concepts || !Array.isArray(parsed.concepts) || parsed.concepts.length === 0) {
      throw new Error('Response did not contain any concepts.');
    }

    const concepts = parsed.concepts.map((c: any) => ({
      title: typeof c.title === 'string' ? c.title.slice(0, 60) : '',
      blurb: typeof c.blurb === 'string' ? c.blurb.slice(0, 200) : '',
      icon: stripDangerousServer(typeof c.icon === 'string' ? c.icon : ''),
    }));

    return NextResponse.json<GenerateResponse>({ concepts });
  } catch (err) {
    console.error('[api/generate] failed to parse model response:', err);
    return NextResponse.json<GenerateErrorResponse>(
      { error: 'The model response could not be parsed. It may have been declined or truncated — try shorter or simpler text.' },
      { status: 502 }
    );
  }
}
