'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  X,
  ChevronRight,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  AlertCircle,
  Languages,
  Check,
  ChevronDown,
  Square,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SearchResult } from '@/app/api/v1/search/route';
import styles from './HeroQueryInput.module.css';

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

export interface IndicVoiceOption {
  code: string;
  name: string;
  native: string;
}

export const INDIC_VOICE_OPTIONS: IndicVoiceOption[] = [
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'en-IN', name: 'English (India)', native: 'English (IN)' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur-IN', name: 'Urdu', native: 'اردو' },
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDefaultVoiceLang(lang?: string): string {
  switch (lang) {
    case 'hi':
    case 'hinglish':
      return 'hi-IN';
    case 'ta':
      return 'ta-IN';
    case 'bn':
      return 'bn-IN';
    case 'ur':
      return 'ur-IN';
    default:
      return 'en-IN';
  }
}

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
  const [voiceLang, setVoiceLang] = useState<string>(getDefaultVoiceLang(activeLang));
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioBars, setAudioBars] = useState<number[]>([15, 25, 40, 25, 15]);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Speech and Audio analysis refs
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync default voice language when global activeLang changes
  useEffect(() => {
    setVoiceLang(getDefaultVoiceLang(activeLang));
  }, [activeLang]);

  // Filter examples according to active language
  const examples = useMemo(() => {
    if (!activeLang || activeLang === 'auto') return ALL_QUERY_EXAMPLES;
    const filtered = ALL_QUERY_EXAMPLES.filter((ex) => ex.lang === activeLang);
    return filtered.length > 0 ? filtered : ALL_QUERY_EXAMPLES;
  }, [activeLang]);

  const currentExample = examples[exampleIndex % examples.length] || ALL_QUERY_EXAMPLES[0];
  const currentVoiceOption =
    INDIC_VOICE_OPTIONS.find((opt) => opt.code === voiceLang) || INDIC_VOICE_OPTIONS[0];

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

  // Close voice language menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(effectiveLang)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      }
    }, 130);

    return () => clearTimeout(timer);
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
      const docParam = attachedFile ? `?doc=${encodeURIComponent(attachedFile.name)}` : '';
      router.push(`/roadmap/${resultId}${docParam}`);
    });
  };

  const handleDocumentProcess = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ text: t.search.fileLimitError, type: 'error' });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFeedback({ text: t.search.fileFormatError, type: 'error' });
      return;
    }

    setAttachedFile(file);
    setFeedback({
      text: `${file.name} attached (${formatFileSize(file.size)})`,
      type: 'info',
    });

    // Auto-dismiss info banner after 3 seconds
    setTimeout(() => {
      setFeedback((prev) => (prev?.type === 'info' ? null : prev));
    }, 3000);

    // Smart civic intent extraction from filename
    const nameLower = file.name.toLowerCase();
    if (!query.trim()) {
      if (nameLower.includes('food') || nameLower.includes('restaurant') || nameLower.includes('fssai') || nameLower.includes('kitchen') || nameLower.includes('dhaba') || nameLower.includes('cafe')) {
        setQuery(`FSSAI food license for ${file.name}`);
      } else if (nameLower.includes('driving') || nameLower.includes('license') || nameLower.includes('dl') || nameLower.includes('sarathi') || nameLower.includes('vehicle')) {
        setQuery(`Driving license verification for ${file.name}`);
      } else if (nameLower.includes('company') || nameLower.includes('pvt') || nameLower.includes('mca') || nameLower.includes('spice') || nameLower.includes('moa') || nameLower.includes('aoa')) {
        setQuery(`Company registration documentation for ${file.name}`);
      } else if (nameLower.includes('rent') || nameLower.includes('electricity') || nameLower.includes('bill') || nameLower.includes('aadhaar') || nameLower.includes('pan') || nameLower.includes('utility')) {
        setQuery(`Address and ID proof verification for ${file.name}`);
      } else {
        setQuery(`Check requirements for ${file.name}`);
      }
    }
  }, [query, t.search.fileLimitError, t.search.fileFormatError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleDocumentProcess(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFeedback(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDocumentProcess(e.dataTransfer.files[0]);
    }
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
      // Audio visualizer fallback (speech recognition still functions)
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

  // Launch Speech Recognition
  const startRecognition = (langCode: string) => {
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
      recognition.lang = langCode;

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
      startRecognition(voiceLang);
    }
  };

  const handleSelectVoiceLang = (code: string) => {
    setVoiceLang(code);
    setIsLangMenuOpen(false);

    if (isListening) {
      stopRecognition();
      setTimeout(() => {
        startRecognition(code);
      }, 150);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isListening) {
      stopRecognition();
    }

    if (isOpen && results.length > 0) {
      const selected = activeIndex >= 0 ? results[activeIndex] : results[0];
      handleSelectResult(selected.id);
      return;
    }

    const effectiveQuery = query.trim() || (attachedFile ? attachedFile.name : '');

    if (!effectiveQuery) {
      inputRef.current?.focus();
      return;
    }

    const qLower = effectiveQuery.toLowerCase();
    const docQueryParam = attachedFile ? `&doc=${encodeURIComponent(attachedFile.name)}` : '';
    setIsOpen(false);

    startTransition(() => {
      if (
        qLower.includes('restaurant') ||
        qLower.includes('resturant') ||
        qLower.includes('food') ||
        qLower.includes('kholna') ||
        qLower.includes('fssai') ||
        qLower.includes('रेस्टोरेंट') ||
        qLower.includes('ریسٹورنٹ') ||
        qLower.includes('உணவகம்') ||
        qLower.includes('রেস্তোরাঁ')
      ) {
        router.push(`/roadmap/fssai-food-license${docQueryParam ? `?${docQueryParam.slice(1)}` : ''}`);
      } else if (
        qLower.includes('driving') ||
        qLower.includes('license') ||
        qLower.includes('licence') ||
        qLower.includes('sarathi') ||
        qLower.includes('ड्राइविंग') ||
        qLower.includes('ڈرائیونگ') ||
        qLower.includes('ஓட்டுநர்') ||
        qLower.includes('ড্রাইভিং')
      ) {
        router.push(`/roadmap/driving-license-delhi${docQueryParam ? `?${docQueryParam.slice(1)}` : ''}`);
      } else if (
        qLower.includes('company') ||
        qLower.includes('pvt') ||
        qLower.includes('mca') ||
        qLower.includes('startup') ||
        qLower.includes('कंपनी') ||
        qLower.includes('کمپنی') ||
        qLower.includes('நிறுவனம்') ||
        qLower.includes('কোম্পানি')
      ) {
        router.push(`/roadmap/pvt-ltd-delhi${docQueryParam ? `?${docQueryParam.slice(1)}` : ''}`);
      } else {
        router.push(`/roadmap/pvt-ltd-delhi?query=${encodeURIComponent(effectiveQuery)}${docQueryParam}`);
      }
    });
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

  const handleClear = () => {
    if (isListening) {
      stopRecognition();
    }
    setQuery('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsOpen(false);
    setActiveIndex(-1);
    setFeedback(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const hasTyped = query.trim().length > 0;
  const hasActionableInput = hasTyped || attachedFile !== null;

  // Determine text direction for Arabic/Urdu
  const isCurrentRtl =
    Boolean(currentExample.isRtl) ||
    isRtl ||
    voiceLang === 'ur-IN' ||
    /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(query);

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <form
        className={`${styles.searchBar} ${hasActionableInput ? styles.searchBarWithActions : ''} ${
          isDragging ? styles.searchBarDragging : ''
        } ${isListening ? styles.searchBarListening : ''}`}
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="search"
      >
        <Search size={22} className={styles.searchIcon} />

        {/* Attached Document Pill */}
        {attachedFile && (
          <div
            className={styles.attachedDocPill}
            title={`${attachedFile.name} (${formatFileSize(attachedFile.size)})`}
          >
            <FileText size={13} className={styles.attachedDocIcon} />
            <span className={styles.attachedDocName}>{attachedFile.name}</span>
            <span className={styles.attachedDocSize}>{formatFileSize(attachedFile.size)}</span>
            <button
              type="button"
              className={styles.attachedDocRemove}
              onClick={handleRemoveFile}
              title={t.search.removeDoc}
              aria-label={t.search.removeDoc}
            >
              <X size={11} />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          id="hero-civic-search-input"
          type="text"
          className={`${styles.inputField} ${isCurrentRtl ? styles.rtlField : ''}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? `Listening in ${currentVoiceOption.name} (${currentVoiceOption.native})...` : query ? '' : displayText}
          autoComplete="off"
          dir={isCurrentRtl ? 'rtl' : 'ltr'}
          aria-label={t.search.placeholder}
        />

        <div className={styles.actionsGroup}>
          {/* Clear Button */}
          {hasActionableInput && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label={t.search.clearQuery}
              title={t.search.clearQuery}
            >
              <X size={15} />
            </button>
          )}

          {/* Document Upload Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${attachedFile ? styles.toolBtnActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            title={t.search.uploadDoc}
            aria-label={t.search.uploadDoc}
            id="hero-doc-upload-btn"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            id="hero-file-upload-input"
          />

          {/* Indian Voice Engine Selector Trigger */}
          <div className={styles.voiceLangContainer} ref={langMenuRef}>
            <button
              type="button"
              className={`${styles.voiceLangToggle} ${isListening ? styles.voiceLangToggleListening : ''}`}
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
              title={`Voice Language: ${currentVoiceOption.name} (${currentVoiceOption.native})`}
              aria-label={`Voice Language: ${currentVoiceOption.name}`}
              id="hero-voice-lang-menu-btn"
            >
              <Languages size={14} />
              <span className={styles.voiceLangLabel}>{currentVoiceOption.native}</span>
              <ChevronDown size={11} className={isLangMenuOpen ? styles.chevronRotated : ''} />
            </button>

            {isLangMenuOpen && (
              <div className={styles.voiceLangDropdown} role="menu" id="hero-voice-lang-dropdown">
                <div className={styles.voiceLangDropdownHeader}>Indian Language Voice Engine</div>
                <div className={styles.voiceLangList}>
                  {INDIC_VOICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      className={`${styles.voiceLangItem} ${opt.code === voiceLang ? styles.voiceLangItemActive : ''}`}
                      onClick={() => handleSelectVoiceLang(opt.code)}
                      role="menuitem"
                    >
                      <div className={styles.voiceLangItemText}>
                        <span className={styles.voiceItemNative}>{opt.native}</span>
                        <span className={styles.voiceItemName}>{opt.name}</span>
                      </div>
                      {opt.code === voiceLang && <Check size={14} className={styles.voiceItemCheck} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice Input Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isListening ? styles.toolBtnListening : ''}`}
            onClick={toggleVoiceInput}
            title={isListening ? t.search.voiceStop : `${t.search.voiceSearch} (${currentVoiceOption.name})`}
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
            >
              <span className={styles.submitBtnText}>{t.search.submitBtn}</span>
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
              <span className={styles.hudLangBadge}>{currentVoiceOption.native}</span>
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
                Speak now in {currentVoiceOption.name} ({currentVoiceOption.native})...
              </span>
            )}
            <span className={styles.blinkingCursor} />
          </div>
        </div>
      )}

      {/* Notification Feedback Banner */}
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
