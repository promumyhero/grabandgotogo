import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FoodMerchant Pricing & Margin Engine | GrabFood & GoFood Calculator',
  description:
    'High-precision financial pricing engine for food delivery merchants. Calculate exact GrabFood and GoFood display prices, PUAS marketing booster deductions, merchant discounts, and net payouts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
