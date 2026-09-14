import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="max-w-[480px] mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold mb-3">That sign-in link didn&apos;t work</h1>
      <p className="text-chalk-dim text-sm leading-relaxed mb-7">
        It may have expired or already been used — magic links are single-use and time-limited. Head back and
        request a new one.
      </p>
      <Link href="/" className="inline-block bg-yellow text-[#1A2530] font-semibold text-sm rounded-chalk px-5 py-2.5">
        Back to Chalk
      </Link>
    </div>
  );
}
