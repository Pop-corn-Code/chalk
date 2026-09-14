import type { Metadata } from 'next';
import { Space_Grotesk, Inter, Caveat } from 'next/font/google';
import './globals.css';
import { AppStateProvider } from '@/lib/AppStateContext';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import SignInModal from '@/components/SignInModal';
import ThemeBody from '@/components/ThemeBody';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600'] });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', weight: ['600', '700'] });

export const metadata: Metadata = {
  title: 'Chalk — turn dense text into simple pictures',
  description:
    "Paste dense text — a contract clause, a technical explanation — and get back a few plain ideas, each with a simple sketch.",
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23212F3D'/%3E%3Cpath d='M20 70 L20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 55 Q80 65 70 65 L40 65 L25 78 L28 65 Z' fill='none' stroke='%23E7B23A' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: 'Chalk — turn dense text into simple pictures',
    description: "Paste a paragraph that's hard to follow and get back a few plain ideas, each with a small sketch.",
    type: 'website',
  },
  twitter: { card: 'summary' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="font-body">
        <AppStateProvider>
          <ThemeBody>
            <a href="#main-content" className="skip-link">Skip to content</a>
            <NavBar />
            <SignInModal />
            <main id="main-content">{children}</main>
            <Footer />
          </ThemeBody>
        </AppStateProvider>
      </body>
    </html>
  );
}
