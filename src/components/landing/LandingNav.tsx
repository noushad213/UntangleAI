'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GitFork, Network, Moon, Sun, Globe, ChevronDown } from 'lucide-react';
import styles from './LandingNav.module.css';

export interface LanguageOption {
  code: string;
  label: string;
  native: string;
}

export const NAV_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Multilingual', native: 'All Languages' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

interface LandingNavProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  selectedLang?: string;
  onSelectLang?: (code: string) => void;
}

export function LandingNav({
  theme,
  onToggleTheme,
  selectedLang = 'auto',
  onSelectLang,
}: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj =
    NAV_LANGUAGES.find((l) => l.code === selectedLang) || NAV_LANGUAGES[0];

  return (
    <nav
      className={`${styles.navContainer} ${scrolled ? styles.navScrolled : ''}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <Link href="/" className={styles.brandGroup}>
        <div className={styles.logoIcon}>
          <GitFork size={18} strokeWidth={2.5} />
        </div>
        <span className={styles.logoText}>
          UNTANGLE<span className={styles.logoTag}>AI</span>
        </span>
      </Link>

      <div className={styles.navLinks}>
        <Link href="/roadmap/pvt-ltd-delhi" className={styles.navLink}>
          Featured Roadmap
        </Link>
        <Link href="#about-section" className={styles.navLink}>
          About Us
        </Link>
        <Link href="#about-section" className={styles.navLink}>
          Directory
        </Link>
        <a
          href="https://www.india.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          National Portal ↗
        </a>
      </div>

      <div className={styles.rightGroup}>
        {/* Language selector button near light/dark mode button */}
        <div className={styles.langWrapper} ref={langMenuRef}>
          <button
            type="button"
            className={styles.langBtn}
            onClick={() => setIsLangOpen((prev) => !prev)}
            aria-label="Select language"
            aria-expanded={isLangOpen}
            id="nav-language-select-btn"
          >
            <Globe size={15} />
            <span>{currentLangObj.native}</span>
            <ChevronDown size={13} className={`${styles.caret} ${isLangOpen ? styles.caretOpen : ''}`} />
          </button>

          {isLangOpen && (
            <div className={styles.langDropdown} role="menu">
              <div className={styles.dropdownHeader}>Select Language</div>
              {NAV_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  className={`${styles.langOption} ${selectedLang === lang.code ? styles.langOptionActive : ''}`}
                  onClick={() => {
                    onSelectLang?.(lang.code);
                    setIsLangOpen(false);
                  }}
                >
                  <span className={styles.langNative}>{lang.native}</span>
                  <span className={styles.langEnglish}>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className={styles.themeBtn}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          id="landing-theme-toggle-btn"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <Link href="/roadmap/pvt-ltd-delhi" className={styles.ctaBtn} id="landing-open-canvas-btn">
          <Network size={14} />
          <span>Interactive Canvas</span>
        </Link>
      </div>
    </nav>
  );
}
