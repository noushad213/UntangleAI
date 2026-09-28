'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './LandingFooter.module.css';

export function LandingFooter() {
  const { t } = useLanguage();

  return (
    <footer className={styles.footerWrapper} role="contentinfo" aria-label="Site footer">
      {/* City Skyline Silhouette */}
      <div className={styles.skylineWrapper}>
        <svg
          viewBox="0 0 1440 260"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax slice"
          className={styles.skylineSvg}
          aria-hidden="true"
        >
          {/* Main Skyline Silhouette */}
          <path
            d="
              M 0,260
              L 0,210
              L 18,210 L 18,198 L 32,198 L 32,212 L 52,212 L 52,190 L 64,190 L 64,215 L 85,215 L 85,182 L 102,182 L 102,210
              L 115,210 L 115,175 L 128,175 L 128,160 L 132,160 L 132,145 L 134,145 L 134,160 L 138,160 L 138,175 L 145,175 L 145,212
              L 165,212 L 165,165 L 182,165 L 182,150 L 195,150 L 195,170 L 210,170 L 210,195 L 225,195 L 225,158 L 245,158 L 245,145 L 258,145 L 258,172
              L 272,172 L 272,138 L 288,138 L 288,155 L 305,155 L 305,130 L 325,130 L 325,148 L 340,148 L 340,122 L 358,122 L 358,142 L 375,142 L 375,115
              L 395,115 L 395,135 L 412,135 L 412,108 L 430,108 L 430,125 L 448,125 L 448,145 L 465,145 L 465,118 L 485,118 L 485,100 L 500,100 L 500,125
              L 518,125 L 518,92 L 532,92 L 532,70 L 535,70 L 535,45 L 537,45 L 537,70 L 540,70 L 540,92 L 555,92 L 555,120
              L 575,120 L 575,105 L 595,105 L 595,130 L 615,130 L 615,98 L 635,98 L 635,115 L 652,115 L 652,88 L 670,88 L 670,120
              L 692,120 L 692,75 L 702,75 L 702,48 L 706,48 L 706,20 L 708,20 L 708,8 L 710,8 L 710,20 L 712,20 L 712,48 L 716,48 L 716,75 L 728,75 L 728,125
              L 738,125 L 738,65 L 748,65 L 748,35 L 751,35 L 751,12 L 753,12 L 753,35 L 756,35 L 756,65 L 766,65 L 766,115
              L 778,115 L 778,55 L 784,55 L 784,25 L 786,25 L 786,8 L 788,8 L 788,25 L 790,25 L 790,55 L 796,55 L 796,120
              L 815,120 L 815,82 L 838,82 L 838,105 L 858,105 L 858,72 L 880,72 L 880,125 L 902,125 L 902,90 L 925,90 L 925,135
              L 945,135 L 945,110 L 968,110 L 968,140 L 990,140 L 990,120 L 1015,120 L 1015,145 L 1038,145 L 1038,130 L 1060,130 L 1060,150
              L 1085,150 L 1085,138 L 1110,138 L 1110,165
              L 1150,165 L 1150,90 L 1158,90 L 1158,60 L 1162,60 L 1162,90 L 1170,90 L 1170,165
              L 1170,185
              L 1440,130
              L 1440,260
              L 0,260
              Z
            "
          />

          {/* Suspension Bridge Tower and Cables */}
          <polygon points="1210,260 1218,80 1224,80 1232,260" />
          <polygon points="1216,75 1221,45 1226,75" />
          <path
            d="M 1170,185 Q 1215,95 1221,48 Q 1320,135 1440,118"
            stroke="#090b10"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M 1170,195 Q 1218,105 1221,55 Q 1325,148 1440,128"
            stroke="#090b10"
            strokeWidth="3.5"
            fill="none"
          />
          <polygon points="1170,180 1440,125 1440,145 1170,200" />
        </svg>
      </div>

      {/* Solid Dark Footer Section with Giant Typography and Civic Navigation */}
      <div className={styles.footerBody}>
        <div className={styles.giantTextWrapper}>
          <span className={styles.giantBrandText}>{t.footer.brand}</span>
        </div>

        <div className={styles.footerMetaBar}>
          <div className={styles.footerLinksRow}>
            <Link href="/roadmap/pvt-ltd-delhi?location=maharashtra" className={styles.footerLink}>
              {t.footer.mcaLink}
            </Link>
            <Link href="/roadmap/driving-license-delhi?location=maharashtra" className={styles.footerLink}>
              {t.footer.sarathiLink}
            </Link>
            <Link href="/roadmap/fssai-food-license?location=maharashtra" className={styles.footerLink}>
              {t.footer.fssaiLink}
            </Link>
            <a
              href="https://www.india.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              {t.footer.nationalPortal}
            </a>
          </div>

          <p className={styles.footerDisclaimer}>
            {t.footer.disclaimer}
          </p>

          <p className={styles.footerCopyright}>
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
