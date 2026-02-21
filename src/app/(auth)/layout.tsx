import type { Metadata } from 'next';
import '../globals.css';
import { TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PropTrader — Sign In',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#07090f] text-white min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-tight">PropTrader</p>
              <p className="text-xs text-gray-500">Risk Calculator & Trade Journal</p>
            </div>
          </div>

          {children}

          <p className="mt-8 text-xs text-gray-600 text-center max-w-xs">
            Trading involves risk. This tool is for organizational purposes only and does not constitute financial advice.
          </p>
        </div>
      </body>
    </html>
  );
}
