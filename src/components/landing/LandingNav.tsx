'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GitFork, Network, Moon, Sun, Globe, ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const getScrollY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const handleScroll = () => {
      setScrolled(getScrollY() > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsLangOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentLangObj =
    NAV_LANGUAGES.find((l) => l.code === selectedLang) || NAV_LANGUAGES[0];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`${styles.headerShell} ${scrolled ? styles.headerScrolled : ''}`} role="banner">
      <div className={styles.navContainerWrapper}>
        <nav
          ref={navRef}
          className={`${styles.navContainer} ${scrolled ? styles.navScrolled : ''}`}
          role="navigation"
          aria-label="Main Navigation"
        >
          {/* Main Top Capsule Bar */}
          <div className={styles.navMainRow}>
            <Link href="/" className={styles.brandGroup} onClick={handleLinkClick}>
              <div className={styles.logoIcon}>
                <GitFork size={18} strokeWidth={2.5} />
              </div>
              <span className={styles.logoText}>
                UNTANGLE<span className={styles.logoTag}>AI</span>
              </span>
            </Link>

            {/* Desktop Center Links */}
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

            {/* Right Controls Group */}
            <div className={styles.rightGroup}>
              {/* Language selector */}
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
                  <span className={styles.langBtnLabel}>{currentLangObj.native}</span>
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

              {/* Theme Toggle */}
              <button
                type="button"
                className={styles.themeBtn}
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                id="landing-theme-toggle-btn"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {/* Desktop CTA Button */}
              <Link href="/roadmap/pvt-ltd-delhi" className={styles.ctaBtn} id="landing-open-canvas-btn">
                <Network size={14} />
                <span>Interactive Canvas</span>
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                id="landing-mobile-menu-toggle-btn"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          {isMobileMenuOpen && (
            <div className={styles.mobileDrawer} role="menu" id="landing-mobile-menu">
              <div className={styles.mobileLinksList}>
                <Link
                  href="/roadmap/pvt-ltd-delhi"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>Featured Roadmap</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="#about-section"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>About Us</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="#about-section"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>Directory</span>
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>National Portal</span>
                  <span className={styles.externalBadge}>↗</span>
                </a>
              </div>

              <div className={styles.mobileCtaWrapper}>
                <Link
                  href="/roadmap/pvt-ltd-delhi"
                  className={styles.mobileCtaBtn}
                  onClick={handleLinkClick}
                >
                  <Network size={16} />
                  <span>Launch Interactive Canvas</span>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
