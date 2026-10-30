import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import IconSvg from '@/components/IconSvg';
import type { Concept } from '@/lib/types';

const ACCENTS = ['#E7B23A', '#E2694E', '#7FB29A', '#F3F0E7'];

interface SharedRow {
  title: string;
  input_preview: string;
  concepts: Concept[];
  created_at: string;
}

async function getSharedItem(slug: string): Promise<SharedRow | null> {
  const supabase = createClient();
  // RLS's "Anyone can view shared history" policy (see supabase/schema.sql)
  // is what makes this readable without the visitor being signed in — this
  // query runs as an anonymous request and Postgres allows it because
  // share_slug is set.
  const { data, error } = await supabase
    .from('history')
    .select('title, input_preview, concepts, created_at')
    .eq('share_slug', slug)
    .single();

  if (error || !data) return null;
  return data as SharedRow;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await getSharedItem(params.slug);
  if (!item) return { title: 'Shared explanation — Chalk' };
  return {
    title: `${item.title} — Chalk`,
    description: `A text simplified into ${item.concepts.length} plain idea${item.concepts.length === 1 ? '' : 's'} with Chalk.`,
    openGraph: {
      title: `${item.title} — Chalk`,
      description: 'Turn dense text into a few simple pictures.',
      type: 'article',
    },
  };
}

export default async function SharedHistoryPage({ params }: { params: { slug: string } }) {
  const item = await getSharedItem(params.slug);
  if (!item) notFound();

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-10 pb-20">
      <div className="mb-8">
        <p className="text-xs text-chalk-dim uppercase tracking-wide mb-2">Shared from Chalk</p>
        <h1 className="font-display text-[28px] font-bold mb-3">{item.title}</h1>
        <p className="text-chalk-dim text-sm leading-relaxed border-l-2 border-chalk-faint pl-3.5 max-w-[70ch]">
          {item.input_preview}
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
        {item.concepts.map((c, i) => (
          <div key={i} className="border border-dashed border-chalk-faint rounded-chalk p-5 flex flex-col items-center text-center gap-3 bg-white/[0.015]">
            <div className="w-16 h-16">
              <IconSvg icon={c.icon} color={ACCENTS[i % ACCENTS.length]} className="w-full h-full" />
            </div>
            <h3 className="font-display text-[15.5px] font-semibold">{c.title}</h3>
            <p className="text-[13px] leading-relaxed text-chalk-dim">{c.blurb}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-dashed border-chalk-faint pt-7 text-center">
        <p className="text-chalk-dim text-sm mb-4">Paste your own dense text and Chalk will do the same.</p>
        <Link href="/tool" className="inline-block bg-yellow text-[#1A2530] font-semibold text-sm rounded-chalk px-5 py-2.5">
          Try Chalk
        </Link>
      </div>
    </div>
  );
}
