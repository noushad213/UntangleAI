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
    'pmay-housing': [
      'pmay', 'awas', 'housing', 'makaan', 'ghar', 'house', 'gramin', 'pradhan mantri awas',
      'awaassoft', 'awaas', 'kutcha', 'pucca', 'plinth', 'bdo', 'panchayat', 'property', 'land',
      'plot', 'patta', 'gharkul',
      'आवास', 'मकान', 'घर', 'प्रधानमंत्री आवास योजना', 'ग्रामीण', 'पक्का मकान',
      'مکان', 'رہائش', 'گھر',
      'வீடு', 'பிரதம மந்திரி ஆவாஸ்',
      'আবাস', 'ঘর', 'প্রধানমন্ত্রী আবাস যোজনা'
    ],
    'pm-kisan-welfare': [
      'kisan', 'farmer', 'kheti', 'agriculture', 'pmkisan', 'samman', 'nidhi', '6000', '2000',
      'installment', 'bhulekh', 'khasra', 'khata', 'ror', 'welfare', 'dbt', 'crop', 'fasal',
      'shetkari', 'krushak', 'rythu',
      'किसान', 'खेती', 'पीएम किसान', 'सम्मान निधि', 'कृषि', 'खसरा', 'खतौनी',
      'کسان', 'کھیتی', 'زرعی',
      'விவசாயி', 'கிசான்',
      'কৃষক', 'কিষাণ', 'কৃষি'
    ],
    'ayushman-bharat': [
      'ayushman', 'bharat', 'pmjay', 'health', 'hospital', 'card', 'bima', 'insurance',
      'cashless', '500000', '5 lakh', 'ilaj', 'dawa', 'swasthya', 'aarogya', 'abha', 'golden card',
      'treatment', 'doctor', 'hospitalization',
      'आयुष्मान', 'स्वास्थ्य', 'अस्पताल', 'इलाज', 'आरोग्य', 'गोल्डन कार्ड', 'दवा', 'बीमा',
      'صحت', 'علاج', 'ہسپتال', 'بیمہ',
      'சுகாதாரம்', 'மருத்துவமனை', 'ஆயுஷ்மான் பாரத்',
      'আয়ুষ্মান ভারত', 'স্বাস্থ্য', 'হাসপাতাল', 'চিকিৎসা'
    ],
    'sukanya-samriddhi': [
      'sukanya', 'samriddhi', 'ssy', 'beti', 'girl', 'daughter', 'bachat', 'savings',
      'tax', '80c', 'interest', 'post office', 'dakghar', 'exemption', 'finance', 'deduction',
      'deposit', 'passbook',
      'सुकन्या', 'समृद्धि', 'बेटी', 'बचत', 'टैक्स', 'डाकघर', 'आयकर', '८०सी',
      'بچی', 'بچت', 'ٹیکس',
      'செல்வமகள்', 'சேமிப்பு', 'வரி',
      'সুকন্যা সমৃদ্ধি', 'কন্যা', 'সঞ্চয়', 'কর'
    ],
    'nsp-scholarship': [
      'scholarship', 'nsp', 'student', 'matric', 'post matric', 'college', 'school',
      'vidyalaxmi', 'fee', 'tuition', 'padhai', 'shiksha', 'education', 'grant', 'fellowship',
      'chhatravritti', 'university', 'admission',
      'छात्रवृत्ति', 'स्कॉलरशिप', 'शिक्षा', 'पढ़ाई', 'कॉलेज', 'फीस', 'यूनिवर्सिटी',
      'وظیفہ', 'تعلیم', 'اسکول',
      'கல்வி உதவித்தொகை', 'படிப்பு', 'கல்லூரி',
      'বৃত্তি', 'ছাত্রবৃত্তি', 'শিক্ষা', 'কলেজ'
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
