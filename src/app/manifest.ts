import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TradeFellow',
    short_name: 'TradeFellow',
    description: 'TradeFellow is a professional trading journal and risk management operating system.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090f',
    theme_color: '#07090f',
    icons: [
      {
        src: '/icon.svg',
        sizes: '64x64',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
