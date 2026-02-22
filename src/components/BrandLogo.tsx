import Image from 'next/image';
import clsx from 'clsx';

interface BrandLogoProps {
  compact?: boolean;
  subtitle?: string;
  className?: string;
}

export default function BrandLogo({
  compact = false,
  subtitle = 'Trading Journal & Risk OS',
  className,
}: BrandLogoProps) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <Image
        src="/logo-mark.svg"
        alt="TradeFellow"
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        priority
        className={clsx(compact ? 'w-7 h-7' : 'w-9 h-9', 'rounded-lg')}
      />
      <div>
        <p className={clsx(compact ? 'text-sm' : 'text-lg', 'font-bold text-white tracking-tight')}>TradeFellow</p>
        <p className={clsx(compact ? 'text-[11px]' : 'text-xs', 'text-gray-500')}>{subtitle}</p>
      </div>
    </div>
  );
}
