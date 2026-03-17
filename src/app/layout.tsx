import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Price Tester — AI-Powered Shopping',
  description: 'Paste any product URL and get real prices across Indian e-commerce platforms instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', sans-serif", background: '#0a0a0f', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
