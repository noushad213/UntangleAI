import type { Metadata } from 'next';
import { LanguageProvider } from '@/context/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'UntangleAI — Interactive Civic Process Navigator',
  description: 'Turn confusing government processes into clear, personalized step-by-step roadmaps with interactive dependency graphs and official citations.',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" translate="no" className="notranslate" suppressHydrationWarning>
      <body className="notranslate" suppressHydrationWarning>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

