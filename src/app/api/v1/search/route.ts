import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ROADMAPS } from '@/data/mock-roadmaps';
import { TRANSLATIONS, LanguageCode, getEffectiveLang } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  stepCount: number;
  estimatedTotalTime: string;
  estimatedTotalCost: string;
  matchScore: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const location = (searchParams.get('location') || '').trim().toLowerCase();
  const langParam = (searchParams.get('lang') || 'auto') as LanguageCode;
  const effectiveLang = getEffectiveLang(langParam);
  const dict = TRANSLATIONS[effectiveLang] || TRANSLATIONS.en;

  if (!query && !location) {
    // Return all available roadmaps as default recommendations
    const results: SearchResult[] = MOCK_ROADMAPS.map((p) => {
      const trans = dict.processes[p.id];
      return {
        id: p.id,
        title: trans?.title || p.title,
        description: trans?.description || p.description,
        category: trans?.category || p.category,
        location: p.location,
        stepCount: p.steps.length,
        estimatedTotalTime: p.estimatedTotalTime,
        estimatedTotalCost: p.estimatedTotalCost,
        matchScore: 1,
      };
    });
    return NextResponse.json({ results });
  }

  const queryTerms = query.split(/\s+/).filter(Boolean);

  const MULTILINGUAL_ALIASES: Record<string, string[]> = {
    'fssai-food-license': [
      'restaurant', 'resturant', 'restro', 'food', 'foscos', 'fssai', 'kitchen', 'dhaba',
      'cafe', 'catering', 'kholna', 'khana', 'khadya', 'bhojan', 'hotel',
      'mujhe', 'kholna hai',
      'रेस्टोरेंट', 'खाना', 'खाद्य', 'खोलना', 'होटल', 'ढाबा',
      'ریسٹورنٹ', 'کھانا', 'کھولنا', 'ہوٹل',
      'உணவகம்', 'தொடக்க', 'சாப்பாடு',
      'রেস্তোরাঁ', 'খাবার'
    ],
    'driving-license-delhi': [
      'driving', 'license', 'licence', 'dl', 'learner', 'parivahan', 'sarathi', 'rto',
      'gaadi', 'gadi', 'car', 'bike', 'motorcycle', 'renew', 'renewal', 'banwana',
      'ड्राइविंग', 'लाइसेंस', 'गाड़ी', 'परिवहन', 'सारथी', 'रिन्यू',
      'ڈرائیونگ', 'لائسنس', 'گاڑی', 'سارتھی',
      'ஓட்டுநர்', 'உரிமம்',
      'ড্রাইভিং', 'লাইসেন্স'
    ],
    'pvt-ltd-delhi': [
      'company', 'pvt', 'ltd', 'private', 'limited', 'mca', 'spice', 'incorporation',
      'business', 'startup', 'firm', 'register', 'registration', 'director',
      'karobar', 'vyapar', 'dukaan', 'karni',
      'कंपनी', 'व्यापार', 'कारोबार', 'रजिस्ट्रेशन', 'निगमन',
      'کمپنی', 'کاروبار', 'تجارت',
      'நிறுவனம்', 'வணிகம்',
      'কোম্পানি', 'ব্যবসা'
    ],
  };

  const matched = MOCK_ROADMAPS.map((p) => {
    let score = 0;
    const titleLower = p.title.toLowerCase();
    const descLower = p.description.toLowerCase();
    const catLower = p.category.toLowerCase();
    const locLower = p.location.toLowerCase();

    // Check multilingual aliases for this roadmap
    const aliases = MULTILINGUAL_ALIASES[p.id] || [];
    for (const alias of aliases) {
      if (query.includes(alias.toLowerCase())) {
        score += 8;
      }
    }

    // Check individual query terms
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 5;
      if (catLower.includes(term)) score += 3;
      if (descLower.includes(term)) score += 2;
      for (const alias of aliases) {
        if (alias.toLowerCase().includes(term)) score += 3;
      }
      // Also match step titles/keywords
      p.steps.forEach((s) => {
        if (s.title.toLowerCase().includes(term) || (s.shortTitle && s.shortTitle.toLowerCase().includes(term))) {
          score += 1.5;
        }
      });
    }

    // Check location filter
    if (location && location !== 'all') {
      if (locLower.includes(location) || locLower.includes('all india')) {
        score += 4;
      } else {
        // Penalty for mismatched specific location
        score = Math.max(0, score - 2);
      }
    }

    const trans = dict.processes[p.id];

    return {
      id: p.id,
      title: trans?.title || p.title,
      description: trans?.description || p.description,
      category: trans?.category || p.category,
      location: p.location,
      stepCount: p.steps.length,
      estimatedTotalTime: p.estimatedTotalTime,
      estimatedTotalCost: p.estimatedTotalCost,
      matchScore: score,
    };
  })
    .filter((r) => (query ? r.matchScore > 0 : true))
    .sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ results: matched });
}
