import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Amiplast Auth',
  description: 'Next.js PostgreSQL JWT authentication app'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono`}>{children}</body>
    </html>
  );
}
