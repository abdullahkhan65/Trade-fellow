import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PropTrader — Risk Calculator & Trade Journal',
  description: 'Professional prop trader risk management dashboard with trade journal, analytics, and PDF export.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#07090f] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
