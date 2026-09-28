'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GitFork, Network, Moon, Sun, Globe, ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePersistentSession } from '@/hooks/usePersistentSession';
import { buildResumeUrl } from '@/lib/storage';
import { NAV_LANGUAGES, LanguageOption, LanguageCode } from '@/lib/translations';
import styles from './LandingNav.module.css';

export { NAV_LANGUAGES };
export type { LanguageOption };

interface LandingNavProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  selectedLang?: LanguageCode | string;
  onSelectLang?: (code: LanguageCode) => void;
}

export function LandingNav({
  theme,
  onToggleTheme,
  selectedLang: propSelectedLang,
  onSelectLang: propOnSelectLang,
}: LandingNavProps) {
  const { lang, setLang, t, languages } = useLanguage();
  const { lastSession } = usePersistentSession();
  const currentLang = (propSelectedLang || lang) as LanguageCode;

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
    languages.find((l) => l.code === currentLang) || languages[0];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    setLang(code);
    propOnSelectLang?.(code);
    setIsLangOpen(false);
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
              <Link href="/roadmap/pvt-ltd-delhi?location=maharashtra" className={styles.navLink}>
                {t.nav.featuredRoadmap}
              </Link>
              <Link href="#about-section" className={styles.navLink}>
                {t.nav.aboutUs}
              </Link>
              <a
                href="https://www.india.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navLink}
              >
                {t.footer.nationalPortal}
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
                  aria-label={t.nav.selectLanguage}
                  aria-expanded={isLangOpen}
                  id="nav-language-select-btn"
                >
                  <Globe size={15} />
                  <span className={styles.langBtnLabel}>{currentLangObj.native}</span>
                  <ChevronDown size={13} className={`${styles.caret} ${isLangOpen ? styles.caretOpen : ''}`} />
                </button>

                {isLangOpen && (
                  <div className={styles.langDropdown} role="menu">
                    <div className={styles.dropdownHeader}>{t.nav.selectLanguage}</div>
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        role="menuitem"
                        className={`${styles.langOption} ${currentLang === item.code ? styles.langOptionActive : ''}`}
                        onClick={() => handleSelectLanguage(item.code)}
                      >
                        <span className={styles.langNative}>{item.native}</span>
                        <span className={styles.langEnglish}>{item.label}</span>
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
                aria-label={theme === 'light' ? t.nav.themeDark : t.nav.themeLight}
                id="landing-theme-toggle-btn"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {/* Desktop CTA Button */}
              <Link
                href={lastSession ? buildResumeUrl(lastSession) : '/roadmap/pvt-ltd-delhi?location=maharashtra'}
                className={styles.ctaBtn}
                id="landing-open-canvas-btn"
                title={lastSession ? `Resume ${lastSession.title}` : t.nav.canvasBtn}
              >
                <Network size={14} />
                <span>{lastSession ? 'Resume Roadmap' : t.nav.canvasBtn}</span>
                {lastSession && (
                  <span className={styles.ctaBadge}>{lastSession.progressPercent}%</span>
                )}
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.menu}
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
                  href="/roadmap/pvt-ltd-delhi?location=maharashtra"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>{t.nav.featuredRoadmap}</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="#about-section"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>{t.nav.aboutUs}</span>
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  <span>{t.footer.nationalPortal}</span>
                  <span className={styles.externalBadge}>↗</span>
                </a>
              </div>

              <div className={styles.mobileCtaWrapper}>
                <Link
                  href={lastSession ? buildResumeUrl(lastSession) : '/roadmap/pvt-ltd-delhi?location=maharashtra'}
                  className={styles.mobileCtaBtn}
                  onClick={handleLinkClick}
                >
                  <Network size={16} />
                  <span>{lastSession ? `Resume Progress (${lastSession.progressPercent}%)` : t.nav.canvasBtn}</span>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
