export interface MaharashtraPlace {
  slug: string;
  name: string;
  district: string;
  kind: 'city' | 'district' | 'locality';
  municipalitySlug: string | null;
  aliases: string[];
}

// District names: https://plan.maharashtra.gov.in/en/36-districts/
// Town inventory: Maharashtra DMA, July 2025 standing orders, appendix 3 (pp. 82–99).
// Keep district recognition separate from municipal jurisdiction.
const DISTRICT_ROWS: Array<[string, string, string]> = [
  ['Mumbai City', 'मुंबई शहर', 'Bombay|Mumbai'],
  ['Mumbai Suburban', 'मुंबई उपनगर', 'Mumbai Suburbs|Mumbai Suburban District'],
  ['Thane', 'ठाणे', ''], ['Palghar', 'पालघर', ''], ['Raigad', 'रायगड', 'Raigarh'],
  ['Ratnagiri', 'रत्नागिरी', ''], ['Sindhudurg', 'सिंधुदुर्ग', 'Sindhudurga'],
  ['Pune', 'पुणे', 'Poona'], ['Satara', 'सातारा', ''], ['Sangli', 'सांगली', ''],
  ['Solapur', 'सोलापूर', 'Sholapur'], ['Kolhapur', 'कोल्हापूर', ''],
  ['Nashik', 'नाशिक', 'Nasik'], ['Dhule', 'धुळे', 'Dhulia'], ['Jalgaon', 'जळगाव', ''],
  ['Nandurbar', 'नंदुरबार', ''], ['Ahilyanagar', 'अहिल्यानगर', 'Ahmednagar|Ahmadnagar|अहमदनगर'],
  ['Chhatrapati Sambhajinagar', 'छत्रपती संभाजीनगर', 'Aurangabad|Sambhajinagar|औरंगाबाद'],
  ['Jalna', 'जालना', ''], ['Beed', 'बीड', 'Bid'], ['Dharashiv', 'धाराशिव', 'Osmanabad|उस्मानाबाद'],
  ['Latur', 'लातूर', ''], ['Nanded', 'नांदेड', ''], ['Parbhani', 'परभणी', ''], ['Hingoli', 'हिंगोली', ''],
  ['Amravati', 'अमरावती', ''], ['Akola', 'अकोला', ''], ['Buldhana', 'बुलढाणा', 'Buldana'],
  ['Washim', 'वाशिम', ''], ['Yavatmal', 'यवतमाळ', 'Yeotmal|Yevatmal'],
  ['Nagpur', 'नागपूर', 'नागपुर'], ['Wardha', 'वर्धा', ''], ['Bhandara', 'भंडारा', ''],
  ['Gondia', 'गोंदिया', 'Gondiya'], ['Chandrapur', 'चंद्रपूर', ''], ['Gadchiroli', 'गडचिरोली', ''],
];

const TOWNS: Record<string, string> = {
  akola: 'Akot|Balapur|Murtizapur|Patur|Telhara|Barshi Takali|Hivarkhed',
  amravati: 'Achalpur|Anjangaon Surji|Warud|Chandur Bazar|Chikhaldara|Chandur Railway|Dhamangaon Railway|Daryapur|Morshi|Shendurjana Ghat|Bhatkuli|Dharni|Nandgaon Khandeshwar|Tivsa',
  buldhana: 'Chikhali|Khamgaon|Mehkar|Malkapur|Nandura|Shegaon|Deulgaon Raja|Jalgaon Jamod|Lonar|Sindkhed Raja|Motala|Sangrampur',
  washim: 'Karanja|Mangarulpir|Risod|Manora',
  yavatmal: 'Digras|Pusad|Umarkhed|Wani|Arni|Darwha|Ghatanji|Ner Nawabpur|Pandharkawada|Babhulgaon|Dhanki|Maregaon|Mahagaon|Ralegaon|Zari Jamni',
  beed: 'Ambajogai|Majalgaon|Parli Vaijnath|Dharur|Gevrai|Ashti|Kej|Patoda|Shirur Kasar|Wadwani',
  'chhatrapati-sambhajinagar': 'Kannad|Paithan|Sillod|Vaijapur|Gangapur|Khuldabad|Phulambri|Soygaon',
  dharashiv: 'Bhoom|Kalamb|Murum|Naldurg|Paranda|Tuljapur|Umarga|Lohara',
  hingoli: 'Basmath|Aundha Nagnath|Kalamnuri|Sengaon',
  jalna: 'Ambad|Bhokardan|Partur|Badnapur|Ghansawangi|Jafrabad|Mantha|Tirthpuri',
  latur: 'Udgir|Ahmedpur|Ausa|Nilanga|Chakur|Devni|Jalkot|Renapur|Shirur Anantpal',
  nanded: 'Deglur|Bhokar|Biloli|Dharmabad|Hadgaon|Kinwat|Kundalwadi|Kandhar|Loha|Mudkhed|Mukhed|Umri|Ardhapur|Himayatnagar|Mahur|Naigaon',
  parbhani: 'Gangakhed|Jintur|Selu|Manwath|Pathri|Purna|Sonpeth|Palam',
  palghar: 'Vasai Virar|Dahanu|Jawhar|Mokhada|Talasari|Vikramgad|Wada|Boisar',
  raigad: 'Panvel|Khopoli|Alibag|Karjat|Mahad|Murud Janjira|Matheran|Pen|Roha|Shrivardhan|Uran|Khalapur|Mhasla|Mangaon|Poladpur|Pali|Tala',
  ratnagiri: 'Chiplun|Khed|Rajapur|Dapoli|Devrukh|Guhagar|Lanja|Mandangad',
  sindhudurg: 'Kankavli|Malvan|Sawantwadi|Vengurla|Devgad|Kasai Dodamarg|Kudal|Vaibhavwadi',
  thane: 'Navi Mumbai|Kalyan Dombivli|Mira Bhayandar|Bhiwandi Nizampur|Ulhasnagar|Ambernath|Kulgaon Badlapur|Murbad|Shahapur',
  bhandara: 'Tumsar|Pauni|Lakhandur|Lakhni|Mohadi|Sakoli',
  chandrapur: 'Bhadravati|Ballarpur|Warora|Brahmapuri|Mul|Rajura|Bhishi|Chimur|Gadchandur|Gondpipri|Ghugus|Jiwati|Korpana|Nagbhid|Pombhurna|Sindewahi|Sawali',
  gadchiroli: 'Armori|Desaiganj|Aheri|Bhamragad|Chamorshi|Dhanora|Etapalli|Korchi|Kurkheda|Mulchera|Sironcha',
  gondia: 'Amgaon|Tirora|Arjuni Morgaon|Deori|Sadak Arjuni|Salekasa',
  nagpur: 'Kamptee|Katol|Umred|Wadi|Butibori|Kalmeshwar Brahmani|Khapa|Kanhan Pipri|Mohpa|Mowad|Narkhed|Ramtek|Saoner|Wanadongri|Bahadura|Bhiwapur|Besa Pipla|Hingna|Kandri Kanhan|Kuhi|Mauda|Mahadula|Parseoni',
  wardha: 'Hinganghat|Arvi|Deoli|Pulgaon|Sindi|Samudrapur',
  ahilyanagar: 'Kopargaon|Sangamner|Deolali Pravara|Pathardi|Rahuri|Rahata Pimplas|Shirdi|Shrigonda|Shrirampur|Shevgaon|Akole|Jamkhed|Nevasa|Parner',
  dhule: 'Dondaicha Warwade|Shirpur Warwade|Sindkheda|Sakri',
  jalgaon: 'Bhusawal|Amalner|Chalisgaon|Chopda|Jamner|Pachora|Bhadgaon|Bodwad|Dharangaon|Erandol|Faizpur|Nashirabad|Parola|Raver|Savda|Varangaon|Yawal|Muktainagar|Shendurni',
  nandurbar: 'Navapur|Shahada|Taloda|Dhadgaon Wadphalya',
  nashik: 'Malegaon|Manmad|Ozar|Sinnar|Trimbak|Yeola|Bhagur|Chandwad|Igatpuri|Nandgaon|Satana|Dindori|Deola|Kalwan|Niphad|Peth|Surgana',
  kolhapur: 'Ichalkaranji|Gadhinglaj|Jaysingpur|Kagal|Kurundwad|Murgud|Panhala|Shirol|Vadgaon Kasba|Ajara|Chandgad|Hatkanangale|Hupari',
  pune: 'Pimpri Chinchwad|Baramati|Chakan|Daund|Lonavala|Talegaon Dabhade|Alandi|Bhor|Indapur|Junnar|Jejuri|Manchar|Rajgurunagar|Saswad|Shirur|Dehu|Malegaon Budruk|Vadgaon Maval',
  sangli: 'Sangli Miraj Kupwad|Islampur|Vita|Ashta|Jat|Tasgaon|Atpadi|Kadegaon|Kavathe Mahankal|Khanapur|Palus|Shirala',
  satara: 'Karad|Phaltan|Mahabaleshwar|Panchgani|Rahimatpur|Mhaswad|Wai|Vaduj|Dahiwadi|Koregaon|Khandala|Lonand|Medha|Patan',
  solapur: 'Barshi|Akkalkot|Akluj|Pandharpur|Dudhani|Karmala|Kurduwadi|Mangalwedha|Maindargi|Sangola|Angar|Madha|Mohol|Mahalung Shripur|Malshiras|Natepute|Vairag',
};

const MUNICIPAL_ALIASES: Record<string, string[]> = {
  'navi-mumbai': ['नवी मुंबई'], 'pimpri-chinchwad': ['PCMC', 'Pimpri', 'Chinchwad', 'पिंपरी चिंचवड'],
  'kalyan-dombivli': ['Kalyan', 'Dombivli', 'कल्याण', 'डोंबिवली'],
  'mira-bhayandar': ['Mira Road', 'Mira Bhayander', 'Bhayandar', 'Bhayander'],
  'vasai-virar': ['Vasai', 'Virar', 'वसई', 'विरार'],
  'bhiwandi-nizampur': ['Bhiwandi', 'भिवंडी'], 'kulgaon-badlapur': ['Badlapur', 'बदलापूर'],
  'sangli-miraj-kupwad': ['Miraj', 'Kupwad'],
  alibag: ['Alibaug'], lonavala: ['Lonavla'], ambernath: ['Ambarnath'],
};

const LOCALITIES: Record<string, string> = {
  mumbai: 'Andheri|अंधेरी|Bandra|वांद्रे|Borivali|बोरिवली|Dahisar|दहिसर|Kandivali|कांदिवली|Malad|मालाड|Goregaon|गोरेगाव|Jogeshwari|जोगेश्वरी|Vile Parle|विले पार्ले|Santacruz|Santa Cruz|सांताक्रूझ|Khar|खार|Juhu|जुहू|Versova|वर्सोवा|Oshiwara|Lokhandwala|Marol|Chakala|Saki Naka|Sakinaka|Powai|पवई|Chandivali|Ghatkopar|घाटकोपर|Vikhroli|विक्रोळी|Kanjurmarg|Bhandup|भांडुप|Mulund|मुलुंड|Kurla|कुर्ला|Chembur|चेंबूर|Govandi|Mankhurd|Trombay|Deonar|Wadala|वडाळा|Sion|सायन|Dadar|दादर|Matunga|माटुंगा|Mahim|माहीम|Prabhadevi|Worli|वरळी|Lower Parel|Parel|परळ|Byculla|भायखळा|Mazgaon|Tardeo|Girgaon|Charni Road|Marine Lines|Churchgate|Colaba|कुलाबा|Cuffe Parade|Nariman Point|Malabar Hill|Breach Candy|BKC|Bandra Kurla Complex|Fort Mumbai|Mumbai Central|मुंबई सेंट्रल',
  'navi-mumbai': 'Vashi|वाशी|Nerul|नेरुळ|Belapur|CBD Belapur|बेलापूर|Sanpada|सानपाडा|Turbhe|तुर्भे|Kopar Khairane|Koparkhairane|Ghansoli|घणसोली|Airoli|ऐरोली|Digha',
  panvel: 'Kharghar|खारघर|Kamothe|कामोठे|Kalamboli|कळंबोली|New Panvel|पनवेल',
  pune: 'Kothrud|कोथरूड|Baner|बाणेर|Aundh|औंध|Hadapsar|हडपसर|Kharadi|खराडी|Viman Nagar|Shivajinagar|शिवाजीनगर|Swargate|Kondhwa|Bibwewadi|Katraj|Warje|Bavdhan|Wagholi|Yerawada|Koregaon Park|Deccan Gymkhana|Bhosale Nagar',
  'pimpri-chinchwad': 'Wakad|वाकड|Bhosari|भोसरी|Akurdi|आकुर्डी|Nigdi|निगडी|Ravet|रावेत|Pimple Saudagar|Pimple Nilakh|Pimple Gurav|Sangvi|Chikhali PCMC|Moshi|मोशी|Dapodi|दापोडी',
  thane: 'Ghodbunder|Majiwada|Manpada|Vartak Nagar|Kopri|Naupada|Wagle Estate|Kasarvadavali|Kalwa|Mumbra|मुंब्रा|Diva Thane',
  nagpur: 'Dharampeth|Sitabuldi|Sadar Nagpur|Manish Nagar|Pratap Nagar Nagpur|Medical Square Nagpur',
  nashik: 'Panchavati|पंचवटी|Nashik Road|Nasik Road|Satpur|Ambad Nashik|Indira Nagar Nashik',
};

export function normalizeLocation(value: string): string {
  return value.toLowerCase().replace(new RegExp('[^\\p{L}\\p{M}\\p{N}\\s]', 'gu'), ' ').replace(/\s+/g, ' ').trim();
}

const slugify = (value: string) => normalizeLocation(value).replace(/ /g, '-');
export const MAHARASHTRA_DISTRICTS: MaharashtraPlace[] = DISTRICT_ROWS.map(([name, marathi, oldNames]) => ({
  slug: slugify(name), name, district: slugify(name), kind: 'district', municipalitySlug: null,
  aliases: [name, marathi, ...oldNames.split('|').filter(Boolean)],
}));

const districtCities = MAHARASHTRA_DISTRICTS.filter(place => !['mumbai-city', 'mumbai-suburban', 'raigad', 'sindhudurg'].includes(place.slug))
  .map(place => ({ ...place, kind: 'city' as const, municipalitySlug: place.slug }));
const towns: MaharashtraPlace[] = Object.entries(TOWNS).flatMap(([district, names]) => names.split('|').map(name => ({
  slug: slugify(name), name, district, kind: 'city' as const, municipalitySlug: slugify(name),
  aliases: [name, ...(MUNICIPAL_ALIASES[slugify(name)] || [])],
})));
const mumbai: MaharashtraPlace = { slug: 'mumbai', name: 'Mumbai', district: 'mumbai-suburban', kind: 'city', municipalitySlug: 'mumbai', aliases: ['Mumbai', 'Bombay', 'मुंबई', 'Mumbai City', 'Mumbai Suburban', 'मुंबई शहर', 'मुंबई उपनगर'] };
const seenMuniSlugs = new Set<string>();
const municipalities: MaharashtraPlace[] = [];
for (const place of [mumbai, ...districtCities, ...towns]) {
  if (!seenMuniSlugs.has(place.slug)) {
    seenMuniSlugs.add(place.slug);
    municipalities.push(place);
  }
}
const localities: MaharashtraPlace[] = Object.entries(LOCALITIES).flatMap(([municipalitySlug, names]) => names.split('|').map(name => ({
  slug: slugify(name), name, district: municipalities.find(place => place.slug === municipalitySlug)!.district,
  kind: 'locality' as const, municipalitySlug, aliases: [name],
})));

export const MAHARASHTRA_PLACES: MaharashtraPlace[] = [...municipalities, ...localities, ...MAHARASHTRA_DISTRICTS];
