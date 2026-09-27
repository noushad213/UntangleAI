'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, FileCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './HowItWorks.module.css';

export function HowItWorks() {
  const { t } = useLanguage();
  const [applicantType, setApplicantType] = useState<'team' | 'solo'>('team');

  return (
    <section id="about-section" className={styles.sectionContainer} aria-label={t.about.sectionTitle}>
      <div className={styles.contentWrapper}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.about.sectionTitle}</h2>
          <p className={styles.sectionSubtitle}>
            {t.about.sectionSubtitle}
          </p>
        </div>

        <div className={styles.cardsStack}>
          {/* Row 1: Slate Lavender Card on Left, Elevated Action Companion on Right */}
          <div className={styles.rowOne}>
            <div className={styles.cardPeriwinkle}>
              <div className={styles.cardImageWrapper}>
                <Image
                  src="/images/card_official_docs.jpg"
                  alt="Government office desk with official forms, stamps, and a laptop"
                  className={styles.cardImage}
                  fill
                  sizes="(max-width: 768px) 100vw, 44vw"
                />
              </div>

              <div className={styles.cardTextContent}>
                <h3 className={styles.cardHeading}>
                  {t.about.card1Heading}
                </h3>
                <p className={styles.cardBody}>
                  {t.about.card1Body}
                </p>
                <span className={styles.cardTagline}>
                  {t.about.card1Tag}
                </span>
              </div>
            </div>

            <div className={styles.sideBlock}>
              <div className={styles.sideBlockBadge}>
                <Compass size={18} />
              </div>
              <h4 className={styles.sideBlockHeading}>{t.about.side1Heading}</h4>
              <p className={styles.sideBlockText}>
                {t.about.side1Text}
              </p>
              <Link href="/roadmap/pvt-ltd-delhi" className={styles.sidePillBtn}>
                <span>{t.about.side1Btn}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Row 2: In DOM order: Primary Card first, Companion Action second */}
          <div className={styles.rowTwo}>
            <div className={styles.cardEspresso}>
              <div className={styles.cardTextContent}>
                <h3 className={styles.cardHeading}>
                  {t.about.card2Heading}
                </h3>
                <p className={styles.cardBody}>
                  {applicantType === 'team'
                    ? t.about.card2BodyTeam
                    : t.about.card2BodySolo}
                </p>

                <div className={styles.segmentedControl} role="tablist" aria-label="Applicant Mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={applicantType === 'team'}
                    className={`${styles.segmentBtn} ${applicantType === 'team' ? styles.segmentBtnActive : ''}`}
                    onClick={() => setApplicantType('team')}
                  >
                    {t.about.withTeam}
                  </button>
                  <span className={styles.segmentDivider}>{t.about.scope}</span>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={applicantType === 'solo'}
                    className={`${styles.segmentBtn} ${applicantType === 'solo' ? styles.segmentBtnActive : ''}`}
                    onClick={() => setApplicantType('solo')}
                  >
                    {t.about.soloApplicant}
                  </button>
                </div>
              </div>

              <div className={styles.cardImageWrapper}>
                <Image
                  src="/images/card_citizen_service.jpg"
                  alt="Person working on government forms at a modern workspace"
                  className={styles.cardImage}
                  fill
                  sizes="(max-width: 768px) 100vw, 44vw"
                />
              </div>
            </div>

            <div className={styles.sideBlock}>
              <div className={styles.sideBlockBadge}>
                <FileCheck size={18} />
              </div>
              <h4 className={styles.sideBlockHeading}>{t.about.side2Heading}</h4>
              <p className={styles.sideBlockText}>
                {t.about.side2Text}
              </p>
              <Link href="/roadmap/fssai-food-license" className={styles.sidePillBtn}>
                <span>{t.about.side2Btn}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
