'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const savedTheme = localStorage.getItem('untangle_theme') as 'light' | 'dark' | null;
    const initialTheme =
      savedTheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('untangle_theme', next);
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      <LandingNav
        theme={theme}
        onToggleTheme={toggleTheme}
        selectedLang={lang}
        onSelectLang={setLang}
      />
      <main style={{ flex: 1 }}>
        <LandingHero selectedLang={lang} />
        <HowItWorks />
      </main>
      <LandingFooter />
    </div>
  );
}
