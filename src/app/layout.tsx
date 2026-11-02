import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Super Admin Control Center - Quickserves CRM',
  description: 'Enterprise Field Service & Operations Management',
  icons: {
    icon: '/assets/quickserves-logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f172a] text-[#f8fafc] min-h-screen">
        {children}
      </body>
    </html>
  );
}
