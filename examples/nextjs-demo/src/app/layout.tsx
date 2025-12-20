import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuietBuild OS™ Demo',
  description: 'Precision Infrastructure for Trust-Based Products',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
