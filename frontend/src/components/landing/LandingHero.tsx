'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MoreHorizontal,
  ArrowRight,
  Phone,
  Building2,
  Car,
  Utensils,
  ExternalLink,
  Briefcase,
  Home,
  FileText,
  Users,
  Landmark,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { HeroQueryInput } from './HeroQueryInput';
import { ResumeBanner } from './ResumeBanner';
import styles from './LandingHero.module.css';

interface LandingHeroProps {
  selectedLang?: string;
}

export function LandingHero({ selectedLang }: LandingHeroProps) {
  const { t, lang } = useLanguage();
  const activeLang = selectedLang || lang;

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className={styles.heroSection} aria-label="Hero">
      {/* Full-bleed background photo */}
      <div className={styles.bgWrapper}>
        <Image
          src="/images/hero_civic.jpg"
          alt="Aerial view of Kartavya Path and government buildings, New Delhi"
          className={styles.bgImage}
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* Content — vertically centered */}
      <div className={styles.heroContent}>
        <div className={styles.headingBlock}>
          <h1 className={styles.headline}>{t.hero.title}</h1>
          <p className={styles.subline}>{t.hero.tagline}</p>
        </div>

        <ResumeBanner />

        <HeroQueryInput selectedLang={activeLang} />

        {/* Category shortcuts */}
        <div className={styles.categories} role="region" aria-label="Process categories">
          <Link href="/roadmap/pvt-ltd-delhi?location=maharashtra" className={styles.pill} id="cat-business-licenses">
            <Briefcase size={13} />
            <span>{t.heroCategories.business}</span>
          </Link>
          <Link href="/roadmap/pmay-housing?location=maharashtra" className={styles.pill} id="cat-property-land">
            <Home size={13} />
            <span>{t.heroCategories.property}</span>
          </Link>
          <Link href="/roadmap/driving-license-delhi?location=maharashtra" className={styles.pill} id="cat-id-documents">
            <FileText size={13} />
            <span>{t.heroCategories.idDocs}</span>
          </Link>
          <Link href="/roadmap/pm-kisan-welfare?location=maharashtra" className={styles.pill} id="cat-social-welfare">
            <Users size={13} />
            <span>{t.heroCategories.welfare}</span>
          </Link>
          <Link href="/roadmap/sukanya-samriddhi?location=maharashtra" className={styles.pill} id="cat-tax-finance">
            <Landmark size={13} />
            <span>{t.heroCategories.tax}</span>
          </Link>
          <Link href="/roadmap/nsp-scholarship?location=maharashtra" className={styles.pill} id="cat-education">
            <GraduationCap size={13} />
            <span>{t.heroCategories.education}</span>
          </Link>

          <div className={styles.moreWrapper} ref={moreRef}>
            <button
              type="button"
              className={`${styles.pill} ${styles.pillMore}`}
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              id="cat-more-btn"
              aria-expanded={isMoreMenuOpen}
              aria-label={t.heroCategories.more}
            >
              <MoreHorizontal size={13} />
              <span>{t.heroCategories.more}</span>
            </button>

            {isMoreMenuOpen && (
              <div className={styles.dropdown} role="menu" id="cat-more-menu">
                <div className={styles.dropdownTitle}>{t.nav.directory}</div>
                <Link
                  href="/roadmap/pvt-ltd-delhi?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Building2 size={14} className={styles.dropdownIcon} />
                  <span>Company Incorporation (MCA)</span>
                </Link>
                <Link
                  href="/roadmap/driving-license-delhi?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Car size={14} className={styles.dropdownIcon} />
                  <span>Driving License (Sarathi)</span>
                </Link>
                <Link
                  href="/roadmap/fssai-food-license?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Utensils size={14} className={styles.dropdownIcon} />
                  <span>Food Safety License (FSSAI)</span>
                </Link>
                <Link
                  href="/roadmap/pmay-housing?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Home size={14} className={styles.dropdownIcon} />
                  <span>PMAY Housing for All</span>
                </Link>
                <Link
                  href="/roadmap/pm-kisan-welfare?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Users size={14} className={styles.dropdownIcon} />
                  <span>PM-Kisan Farmer Direct Support</span>
                </Link>
                <Link
                  href="/roadmap/ayushman-bharat?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <FileText size={14} className={styles.dropdownIcon} />
                  <span>Ayushman Bharat (PM-JAY)</span>
                </Link>
                <Link
                  href="/roadmap/sukanya-samriddhi?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Landmark size={14} className={styles.dropdownIcon} />
                  <span>Sukanya Samriddhi (Tax / SSY)</span>
                </Link>
                <Link
                  href="/roadmap/nsp-scholarship?location=maharashtra"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <GraduationCap size={14} className={styles.dropdownIcon} />
                  <span>NSP Student Scholarships</span>
                </Link>
                <div className={styles.dropdownDivider} />
                <a
                  href="tel:1800112026"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <Phone size={14} className={styles.dropdownIcon} />
                  <span>Helpline: 1800 11 2026</span>
                </a>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.dropdownItem}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  <ExternalLink size={14} className={styles.dropdownIcon} />
                  <span>{t.footer.nationalPortal}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Single CTA to roadmap browsing */}
        <Link href="/roadmap" className={styles.ctaLink} id="hero-explore-roadmaps-card">
          <BookOpen size={16} />
          <span>{t.heroStats.exploreTitle}</span>
          <ArrowRight size={14} className={styles.ctaArrow} />
        </Link>
      </div>
    </section>
  );
}
