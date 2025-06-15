import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stratix AI - E-commerce Optimization Platform',
  description: 'AI-powered e-commerce optimization with 75 enterprise features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
