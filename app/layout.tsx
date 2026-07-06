import type { Metadata } from 'next';
import { sora } from './fonts';
import '../styles/globals.css';
import { DialogProvider } from '@/components/ui/dialog-provider';

export const metadata: Metadata = {
  title: 'Devya Sales',
  description: 'Sales pipeline + rep tracking for the Devya team',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={sora.variable}>
      <body className="antialiased font-sora bg-ink-900 text-ink-100" suppressHydrationWarning>
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
