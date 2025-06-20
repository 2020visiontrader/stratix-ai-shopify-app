import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientAuthProvider from '../components/ClientAuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stratix AI - E-commerce Optimization Platform',
  description: 'AI-powered e-commerce optimization with 75 enterprise features',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#8b5cf6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gradient-to-br from-purple-900 to-purple-800 text-white`}>
        <ClientAuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
