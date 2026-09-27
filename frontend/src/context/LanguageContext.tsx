'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  LanguageCode,
  LanguageOption,
  NAV_LANGUAGES,
  TranslationDictionary,
  getEffectiveLang,
  getTranslations,
  TRANSLATIONS,
} from '@/lib/translations';
import { CivicProcess } from '@/types/roadmap';

interface LanguageContextType {
  lang: LanguageCode;
  effectiveLang: Exclude<LanguageCode, 'auto'>;
  setLang: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  isRtl: boolean;
  languages: LanguageOption[];
  getLocalizedRoadmap: (process: CivicProcess) => CivicProcess;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'untangle_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>('auto');

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && NAV_LANGUAGES.some((l) => l.code === saved)) {
        setLangState(saved);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const setLang = useCallback((newLang: LanguageCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Storage unavailable
    }
  }, []);

  const effectiveLang = useMemo(() => getEffectiveLang(lang), [lang]);
  const isRtl = effectiveLang === 'ur';
  const t = useMemo(() => getTranslations(lang), [lang]);

  // Sync html lang and dir attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', effectiveLang);
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('translate', 'no');
    }
  }, [effectiveLang, isRtl]);

  const getLocalizedRoadmap = useCallback(
    (process: CivicProcess): CivicProcess => {
      const trans = TRANSLATIONS[effectiveLang]?.processes?.[process.id];
      if (!trans) return process;

      const localizedSteps = process.steps.map((step) => {
        const stepTrans = trans.steps?.[step.id];
        if (!stepTrans) return step;
        return {
          ...step,
          title: stepTrans.title || step.title,
          shortTitle: stepTrans.shortTitle || step.shortTitle,
          description: stepTrans.description || step.description,
        };
      });

      return {
        ...process,
        title: trans.title || process.title,
        description: trans.description || process.description,
        category: trans.category || process.category,
        steps: localizedSteps,
      };
    },
    [effectiveLang]
  );

  const value = useMemo(
    () => ({
      lang,
      effectiveLang,
      setLang,
      t,
      isRtl,
      languages: NAV_LANGUAGES,
      getLocalizedRoadmap,
    }),
    [lang, effectiveLang, setLang, t, isRtl, getLocalizedRoadmap]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
