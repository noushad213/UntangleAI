'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  X,
  ChevronRight,
  ChevronDown,
  MapPin,
  Mic,
  MicOff,
  FileText,
  AlertCircle,
  Square,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SearchResult } from '@/app/api/v1/search/route';
import styles from './HeroQueryInput.module.css';
import { getPromptAlert, resolvePromptMunicipality, UNSUPPORTED_LOCATION_MESSAGE } from '@/lib/prompt-guardrails';
import { generateRoadmap } from '@/lib/generate-roadmap';

export interface QueryExample {
  text: string;
  query: string;
  lang: string;
  targetRoadmap: string;
  isRtl?: boolean;
}

export const ALL_QUERY_EXAMPLES: QueryExample[] = [
  // English
  {
    text: 'i want to open a restaurant',
    query: 'i want to open a restaurant',
    lang: 'en',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'how to renew my driving license',
    query: 'how to renew my driving license',
    lang: 'en',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'register a private limited company',
    query: 'register a private limited company',
    lang: 'en',
    targetRoadmap: 'pvt-ltd-delhi',
  },

  // Hinglish
  {
    text: 'mujhe restaurant kholna hai',
    query: 'mujhe restaurant kholna hai',
    lang: 'hinglish',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'driving license renew kaise karein',
    query: 'driving license renew kaise karein',
    lang: 'hinglish',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'pvt ltd company register karni hai',
    query: 'pvt ltd company register karni hai',
    lang: 'hinglish',
    targetRoadmap: 'pvt-ltd-delhi',
  },

  // Hindi
  {
    text: 'मुझे रेस्टोरेंट खोलना है',
    query: 'मुझे रेस्टोरेंट खोलना है',
    lang: 'hi',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'नया ड्राइविंग लाइसेंस कैसे बनवाएं',
    query: 'नया ड्राइविंग लाइसेंस कैसे बनवाएं',
    lang: 'hi',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'प्राइवेट लिमिटेड कंपनी कैसे रजिस्टर करें',
    query: 'प्राइवेट लिमिटेड कंपनी कैसे रजिस्टर करें',
    lang: 'hi',
    targetRoadmap: 'pvt-ltd-delhi',
  },

  // Urdu
  {
    text: 'مجھے ریسٹورنٹ کھولنا ہے',
    query: 'مجھے ریسٹورنٹ کھولنا ہے',
    lang: 'ur',
    targetRoadmap: 'fssai-food-license',
    isRtl: true,
  },
  {
    text: 'نیا ڈرائیونگ لائسنس کیسے حاصل کریں',
    query: 'نیا ڈرائیونگ لائسنس کیسے حاصل کریں',
    lang: 'ur',
    targetRoadmap: 'driving-license-delhi',
    isRtl: true,
  },
  {
    text: 'پرائیویٹ لمیٹڈ کمپنی کیسے رجسٹر کریں',
    query: 'پرائیویٹ لمیٹڈ کمپنی کیسے رجسٹر کریں',
    lang: 'ur',
    targetRoadmap: 'pvt-ltd-delhi',
    isRtl: true,
  },

  // Tamil
  {
    text: 'புது உணவகம் தொடங்க வேண்டும்',
    query: 'புது உணவகம் தொடங்க வேண்டும்',
    lang: 'ta',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'ஓட்டுநர் உரிமம் புதுப்பிக்க வேண்டும்',
    query: 'ஓட்டுநர் உரிமம் புதுப்பிக்க வேண்டும்',
    lang: 'ta',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'புதிய நிறுவனம் தொடங்க வேண்டும்',
    query: 'புதிய நிறுவனம் தொடங்க வேண்டும்',
    lang: 'ta',
    targetRoadmap: 'pvt-ltd-delhi',
  },

  // Bengali
  {
    text: 'আমি একটি নতুন রেস্তোরাঁ খুলতে চাই',
    query: 'আমি একটি নতুন রেস্তোরাঁ খুলতে চাই',
    lang: 'bn',
    targetRoadmap: 'fssai-food-license',
  },
  {
    text: 'ড্রাইভিং লাইসেন্স নবায়ন করতে চাই',
    query: 'ড্রাইভিং লাইসেন্স নবায়ন করতে চাই',
    lang: 'bn',
    targetRoadmap: 'driving-license-delhi',
  },
  {
    text: 'নতুন কোম্পানি নিবন্ধন করতে চাই',
    query: 'নতুন কোম্পানি নিবন্ধন করতে চাই',
    lang: 'bn',
    targetRoadmap: 'pvt-ltd-delhi',
  },
];

interface HeroQueryInputProps {
  selectedLang?: string;
}

interface FeedbackState {
  text: string;
  type: 'error' | 'listening' | 'info';
}

export function HeroQueryInput({ selectedLang }: HeroQueryInputProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { lang, effectiveLang, t, isRtl } = useLanguage();

  const activeLang = selectedLang || lang;

  const [query, setQuery] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Voice recognition and document upload states
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioBars, setAudioBars] = useState<number[]>([15, 25, 40, 25, 15]);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [municipalitySlug, setMunicipalitySlug] = useState('');
  const [municipalities, setMunicipalities] = useState<Array<{ slug: string; name: string }>>([]);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [promptAlert, setPromptAlert] = useState<string | null>(null);

  const loadMunicipalities = async () => {
    try {
      const response = await fetch('/api/v1/municipalities');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const cities: Array<{ slug: string; name: string }> = payload.municipalities || [];
      setMunicipalities(cities);
      return cities;
    } catch {
      setFeedback({ text: 'City list is unavailable. Retry loading cities shortly.', type: 'error' });
      return null;
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech and Audio analysis refs
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Filter examples according to active language
  const examples = useMemo(() => {
    if (!activeLang || activeLang === 'auto') return ALL_QUERY_EXAMPLES;
    const filtered = ALL_QUERY_EXAMPLES.filter((ex) => ex.lang === activeLang);
    return filtered.length > 0 ? filtered : ALL_QUERY_EXAMPLES;
  }, [activeLang]);

  const currentExample = examples[exampleIndex % examples.length] || ALL_QUERY_EXAMPLES[0];

  // Reset index when language selection changes
  useEffect(() => {
    setExampleIndex(0);
    setDisplayText('');
    setIsDeleting(false);
  }, [activeLang]);

  // Clean up speech recognition & audio context on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Typewriter animation loop for the cycling placeholder
  useEffect(() => {
    if (query.length > 0 || isListening) return;

    const targetText = currentExample.text;
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < targetText.length) {
        timer = setTimeout(() => {
          setDisplayText(targetText.slice(0, displayText.length + 1));
        }, 45);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(targetText.slice(0, displayText.length - 1));
        }, 20);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setExampleIndex((prev) => (prev + 1) % examples.length);
        }, 280);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, exampleIndex, query, currentExample.text, examples.length, isListening]);

  // Live search query autocomplete
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(effectiveLang)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      }
    }, 130);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, effectiveLang]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectResult = (resultId: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.push(`/roadmap/${resultId}`);
    });
  };

  // Start real Audio visualizer using Web Audio API
  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const b0 = dataArray[1] || 0;
        const b1 = dataArray[3] || 0;
        const b2 = dataArray[5] || 0;
        const b3 = dataArray[7] || 0;
        const b4 = dataArray[9] || 0;

        setAudioBars([
          Math.round((b0 / 255) * 100),
          Math.round((b1 / 255) * 100),
          Math.round((b2 / 255) * 100),
          Math.round((b3 / 255) * 100),
          Math.round((b4 / 255) * 100),
        ]);

        animFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch {
      // Audio visualizer fallback
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioBars([15, 25, 40, 25, 15]);
  };

  // Automatically determine optimal language locale:
  // en-IN in Google Speech is specially trained for Indian bilingual code-switching (Hinglish)
  // and Indian accents, while regional selections map automatically to their native models.
  const getAutoDetectedLang = (): string => {
    if (activeLang === 'hi') return 'hi-IN';
    if (activeLang === 'ta') return 'ta-IN';
    if (activeLang === 'bn') return 'bn-IN';
    if (activeLang === 'ur') return 'ur-IN';
    // Hinglish, Multilingual ('auto'), or English: 'en-IN' is Google's dedicated Indic/Hinglish model
    return 'en-IN';
  };

  const startRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback({
        text: t.search.voiceUnsupported,
        type: 'error',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getAutoDetectedLang();

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        startAudioVisualizer();
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        const combined = (finalStr + interimStr).trim();
        setInterimTranscript(interimStr);
        if (combined) {
          setQuery(combined);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setIsListening(false);
          stopAudioVisualizer();
          setFeedback({
            text: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
            type: 'error',
          });
        } else if (event.error !== 'no-speech') {
          setFeedback({
            text: `Speech recognition notice: ${event.error}`,
            type: 'error',
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioVisualizer();
        setInterimTranscript('');
      };

      recognition.start();
    } catch {
      setIsListening(false);
      stopAudioVisualizer();
      setFeedback({
        text: t.search.voiceUnsupported,
        type: 'error',
      });
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    stopAudioVisualizer();
    setInterimTranscript('');
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopRecognition();
    } else {
      setFeedback(null);
      startRecognition();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    if (isListening) {
      stopRecognition();
    }

    if (isOpen && activeIndex >= 0 && results[activeIndex]) {
      const selected = results[activeIndex];
      handleSelectResult(selected.id);
      return;
    }

    const effectiveQuery = query.trim();

    if (!effectiveQuery) {
      inputRef.current?.focus();
      return;
    }

    const alert = getPromptAlert(effectiveQuery);
    setPromptAlert(alert);
    if (alert) {
      setIsOpen(false);
      setFeedback(null);
      setNeedsLocation(false);
      inputRef.current?.focus();
      return;
    }

    setIsOpen(false);
    setIsGenerating(true);

    try {
      const cities = municipalities.length ? municipalities : await loadMunicipalities();
      if (!cities) {
        setNeedsLocation(true);
        return;
      }
      const selectedCity = resolvePromptMunicipality(effectiveQuery, cities) || municipalitySlug;
      if (!selectedCity) {
        setNeedsLocation(true);
        setFeedback({ text: 'Choose the city where you need this service. We use its official sources.', type: 'info' });
        return;
      }
      const cityAlert = getPromptAlert(effectiveQuery, selectedCity);
      if (cityAlert) {
        setPromptAlert(cityAlert);
        setNeedsLocation(true);
        setFeedback(null);
        return;
      }
      setMunicipalitySlug(selectedCity);
      setNeedsLocation(false);
      const cityName = cities.find((city) => city.slug === selectedCity)?.name || selectedCity;
      setFeedback({ text: `Checking official sources for ${cityName} and building your roadmap…`, type: 'info' });
      const workflowId = await generateRoadmap({ query: effectiveQuery, municipalitySlug: selectedCity }, () => {
        setFeedback({ text: 'Retrying your roadmap request…', type: 'info' });
      });

      startTransition(() => {
        router.push(
          `/roadmap/${encodeURIComponent(workflowId)}?generated=1&location=${encodeURIComponent(selectedCity)}`
        );
      });
    } catch (error) {
      setFeedback({
        text:
          error instanceof Error
            ? error.message
            : 'We could not build this roadmap. Try a more specific task.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectResult(results[activeIndex].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPromptAlert(null);
    if (isListening) {
      stopRecognition();
    }
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    setFeedback(null);
    setNeedsLocation(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSearchBarClick = (e: React.MouseEvent) => {
    if (
      inputRef.current &&
      e.target !== inputRef.current &&
      !(e.target as HTMLElement).closest('button, [role="button"]')
    ) {
      inputRef.current.focus();
    }
  };

  const hasTyped = query.trim().length > 0;
  const hasActionableInput = hasTyped;

  // Determine text direction for Arabic/Urdu
  const isCurrentRtl =
    Boolean(currentExample.isRtl) ||
    isRtl ||
    activeLang === 'ur' ||
    /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(query);

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <form
        className={`${styles.searchBar} ${hasActionableInput ? styles.searchBarWithActions : ''} ${
          isListening ? styles.searchBarListening : ''
        }`}
        onSubmit={handleSubmit}
        onClick={handleSearchBarClick}
        role="search"
      >
        <Search size={22} className={styles.searchIcon} />

        <input
          ref={inputRef}
          id="hero-civic-search-input"
          type="text"
          className={`${styles.inputField} ${isCurrentRtl ? styles.rtlField : ''}`}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPromptAlert(null); }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening... Speak in any language or Hinglish' : query ? '' : displayText}
          autoComplete="off"
          dir={isCurrentRtl ? 'rtl' : 'ltr'}
          aria-label={t.search.placeholder}
          maxLength={500}
          disabled={isGenerating}
          aria-invalid={Boolean(promptAlert)}
          aria-describedby={promptAlert ? 'civic-prompt-guidance civic-prompt-alert' : 'civic-prompt-guidance'}
        />

        <div className={styles.actionsGroup}>
          {/* Clear Button */}
          {hasActionableInput && (
            <button
              type="button"
              className={styles.clearBtn}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onClick={handleClear}
              aria-label={t.search.clearQuery}
              title={t.search.clearQuery}
            >
              <X size={15} />
            </button>
          )}

          {/* Voice Input Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isListening ? styles.toolBtnListening : ''}`}
            onClick={toggleVoiceInput}
            title={isListening ? t.search.voiceStop : t.search.voiceSearch}
            aria-label={isListening ? t.search.voiceStop : t.search.voiceSearch}
            id="hero-voice-input-btn"
          >
            {isListening ? (
              <>
                <MicOff size={18} className={styles.micListeningIcon} />
                <span className={styles.pulseRing} />
              </>
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* Submit Button */}
          {hasActionableInput && (
            <button
              type="submit"
              className={styles.submitBtn}
              id="hero-query-submit-btn"
              aria-label={t.search.searchBtnAria}
              disabled={isGenerating}
            >
              <span className={styles.submitBtnText}>
                {isGenerating ? 'Building roadmap…' : t.search.submitBtn}
              </span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </form>

      {/* Live Voice HUD & Real-time Transcript */}
      {isListening && (
        <div className={styles.liveVoiceHUD} role="region" aria-label="Live voice transcription">
          <div className={styles.hudTopRow}>
            <div className={styles.hudIndicator}>
              <span className={styles.liveRecordingDot} />
              <span className={styles.liveRecordingText}>LIVE TRANSCRIPT</span>
            </div>

            {/* Reactive Audio Frequency Visualizer */}
            <div className={styles.audioWaveform} aria-label="Mic frequency visualizer">
              {audioBars.map((val, idx) => (
                <span
                  key={idx}
                  className={styles.waveBar}
                  style={{
                    height: `${Math.max(5, Math.min(22, 5 + Math.round((val * 17) / 100)))}px`,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className={styles.hudStopBtn}
              onClick={toggleVoiceInput}
              title="Finish speaking"
            >
              <Square size={10} fill="currentColor" />
              <span>Done</span>
            </button>
          </div>

          <div className={styles.liveTranscriptText}>
            {interimTranscript || query || (
              <span className={styles.listeningHint}>
                Listening... Speak now in any Indian language or Hinglish...
              </span>
            )}
            <span className={styles.blinkingCursor} />
          </div>
        </div>
      )}

      {/* Notification Feedback Banner */}
      <div id="civic-prompt-guidance" className={`${styles.statusBanner} ${styles.statusInfo}`}>
        <span>Name the exact service and where you need it. Say whether you are applying, renewing, paying or making a complaint. You can choose your service city before submission.</span>
      </div>
      {promptAlert && (
        <div id="civic-prompt-alert" className={`${styles.statusBanner} ${styles.statusError}`} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{promptAlert}</span>
          {promptAlert === UNSUPPORTED_LOCATION_MESSAGE && <a href="/roadmap">Browse sample guides</a>}
        </div>
      )}
      {needsLocation && (
        <div className={styles.locationPrompt}>
          <label className={styles.locationLabel} htmlFor="civic-municipality">
            <MapPin size={18} aria-hidden="true" />
            Service city
          </label>
          <div className={styles.locationSelectWrap}>
            <select
              id="civic-municipality"
              className={styles.locationSelect}
              aria-describedby="civic-municipality-help"
              value={municipalitySlug}
              disabled={isGenerating}
              onChange={(event) => {
                setMunicipalitySlug(event.target.value);
                setPromptAlert(event.target.value === '__other__' ? UNSUPPORTED_LOCATION_MESSAGE : null);
              }}
            >
              <option value="">Choose a city</option>
              {municipalities.map((city) => <option key={city.slug} value={city.slug}>{city.name}</option>)}
              <option value="__other__">Other city / state — not supported yet</option>
            </select>
            <ChevronDown size={18} className={styles.locationChevron} aria-hidden="true" />
          </div>
          {municipalities.length === 0 && <button className={styles.locationRetry} type="button" onClick={loadMunicipalities}>Retry loading cities</button>}
          <p id="civic-municipality-help" className={styles.locationHelp}>
            Roadmap generation is available for supported Maharashtra cities.{' '}
            <a href="/roadmap">Browse sample guides</a> for other locations.
          </p>
        </div>
      )}
      {feedback && !isListening && (
        <div
          className={`${styles.statusBanner} ${
            feedback.type === 'error'
              ? styles.statusError
              : styles.statusInfo
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === 'error' && <AlertCircle size={14} className={styles.statusIcon} />}
          {feedback.type === 'info' && <FileText size={14} className={styles.statusIcon} />}
          <span className={styles.statusText}>{feedback.text}</span>
          <button
            type="button"
            className={styles.statusCloseBtn}
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notification"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox" id="hero-query-dropdown">
          <div className={styles.dropdownHeader}>
            <span>
              {t.search.dropdownHeader} ({results.length})
            </span>
            <span>{t.search.dropdownEnterHint}</span>
          </div>

          {results.length > 0 ? (
            results.map((item, idx) => {
              const localizedTitle = t.processes[item.id]?.title || item.title;
              const localizedDesc = t.processes[item.id]?.description || item.description;

              return (
                <div
                  key={item.id}
                  className={`${styles.dropdownItem} ${
                    idx === activeIndex ? styles.dropdownItemActive : ''
                  }`}
                  onClick={() => handleSelectResult(item.id)}
                  role="option"
                  aria-selected={idx === activeIndex}
                >
                  <div className={styles.itemMain}>
                    <span className={styles.itemTitle}>{localizedTitle}</span>
                    <span className={styles.itemDesc}>{localizedDesc}</span>
                  </div>

                  <div className={styles.itemMeta}>
                    <span className={styles.itemPill}>{item.location}</span>
                    <span className={styles.itemPill}>
                      {item.stepCount} {t.search.stepsCount}
                    </span>
                    <ChevronRight size={14} style={{ opacity: 0.6 }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <Search size={20} style={{ opacity: 0.6 }} />
              <span>{t.search.noResults}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
