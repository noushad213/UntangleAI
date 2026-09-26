import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UntangleAI — Interactive Civic Process Navigator',
  description: 'Turn confusing government processes into clear, personalized step-by-step roadmaps with interactive dependency graphs and official citations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
