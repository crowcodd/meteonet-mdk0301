import type { Metadata } from 'next';
import { Geist_Mono, Onest } from 'next/font/google';
import { Providers } from './_providers/providers';
import './globals.css';

const onest = Onest({ variable: '--font-onest', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Метеосеть',
  description: 'Сеть метеорологических станций регионального центра',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${onest.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
