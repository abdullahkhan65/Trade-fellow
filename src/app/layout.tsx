import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradeFellow — Trading Journal & Risk OS',
  description: 'TradeFellow is a professional trading journal and risk management operating system for prop and personal traders.',
  applicationName: 'TradeFellow',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
  },
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
