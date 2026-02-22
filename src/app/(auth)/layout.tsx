import type { Metadata } from 'next';
import '../globals.css';
import BrandLogo from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'TradeFellow — Sign In',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <BrandLogo className="mb-8" subtitle="Risk Calculator & Trade Journal" />

      {children}

      <p className="mt-8 text-xs text-gray-600 text-center max-w-xs">
        Trading involves risk. This tool is for organizational purposes only and does not constitute financial advice.
      </p>
    </div>
  );
}
