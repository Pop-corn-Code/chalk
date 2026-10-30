import Link from 'next/link';

export default function SharedItemNotFound() {
  return (
    <div className="max-w-[480px] mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold mb-3">This link isn&apos;t available</h1>
      <p className="text-chalk-dim text-sm leading-relaxed mb-7">
        Either the link is wrong, or whoever shared it has since made it private again.
      </p>
      <Link href="/tool" className="inline-block bg-yellow text-[#1A2530] font-semibold text-sm rounded-chalk px-5 py-2.5">
        Try Chalk yourself
      </Link>
    </div>
  );
}
