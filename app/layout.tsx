import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import CursorGlow from './CursorGlow';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'DARK — Promoter Management',
  description: 'Promoter management platform for DARK events.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full antialiased" style={{ background: '#070707', color: '#F2F2EE' }}>
        {children}
        <CursorGlow />
      </body>
    </html>
  );
}
