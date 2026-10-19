import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FoodMerchant Pricing & Margin Engine — GrabFood & GoFood Calculator',
  description:
    'Sistem kalkulasi presisi harga jual, komisi platform, dan margin bersih merchant kuliner GrabFood & GoFood terkalibrasi ke Order GF-957.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-slate-50/70 text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
