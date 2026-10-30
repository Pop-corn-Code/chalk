import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-chalk-faint px-6 py-8 mt-8">
      <div className="max-w-[1080px] mx-auto flex justify-between items-center flex-wrap gap-4">
        <div className="text-[13px] text-chalk-dim">© 2026 Chalk. A small tool for making dense text make sense.</div>
        <div className="flex gap-5 text-[13.5px] text-chalk-dim">
          <Link href="/tool" className="hover:text-chalk">Open the app</Link>
          <Link href="/pricing" className="hover:text-chalk">Pricing</Link>
          <Link href="/terms" className="hover:text-chalk">Terms</Link>
          <Link href="/privacy" className="hover:text-chalk">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
