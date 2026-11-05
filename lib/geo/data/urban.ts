/**
 * Urban layer of the Bangladesh location tree, hand-curated (en + bn).
 *
 *   City Corporation → Ward (numbered)
 *   City Corporation → Metropolitan thana → Local area / neighbourhood
 *
 * Thanas are police jurisdictions and do not line up exactly with city
 * corporation boundaries; each thana is listed under the corporation that
 * holds most of it. Local areas are the names people actually use
 * ("Gulshan 2", "Agrabad", "Zindabazar").
 *
 * `zone` is the matching cluster (see `lib/geo/build.ts`). In Dhaka several
 * neighbouring thanas share a zone so circles have enough people; other
 * cities match city-wide.
 */

export interface LocalArea {
  en: string;
  bn: string;
  /** Stable slug override (keeps legacy seed slugs such as `gulshan-2`). */
  slug?: string;
}

export interface MetroThana {
  en: string;
  bn: string;
  /** Dhaka only: matching cluster key, see `DHAKA_ZONES`. */
  zone?: string;
  areas?: LocalArea[];
}

export interface CityCorporation {
  slug: string;
  en: string;
  bn: string;
  /** English district name as it appears in `bd-admin.json`. */
  district: string;
  wards: number;
  lat: number;
  lng: number;
  thanas: MetroThana[];
}

/** Matching clusters for Dhaka's two city corporations. */
export const DHAKA_ZONES: Record<string, { en: string; bn: string }> = {
  dhanmondi: { en: "Dhanmondi · Mohammadpur · Lalmatia", bn: "ধানমন্ডি · মোহাম্মদপুর · লালমাটিয়া" },
  gulshan: { en: "Gulshan · Banani · Bashundhara", bn: "গুলশান · বনানী · বসুন্ধরা" },
  mirpur: { en: "Mirpur · Pallabi · Kafrul", bn: "মিরপুর · পল্লবী · কাফরুল" },
  uttara: { en: "Uttara · Airport · Dakshinkhan", bn: "উত্তরা · বিমানবন্দর · দক্ষিণখান" },
  tejgaon: { en: "Tejgaon · Farmgate · Agargaon", bn: "তেজগাঁও · ফার্মগেট · আগারগাঁও" },
  "east-dhaka": { en: "Badda · Rampura · Khilgaon", bn: "বাড্ডা · রামপুরা · খিলগাঁও" },
  "central-dhaka": { en: "Motijheel · Ramna · Shahbag", bn: "মতিঝিল · রমনা · শাহবাগ" },
  "old-dhaka": { en: "Old Dhaka · Lalbagh · Wari", bn: "পুরান ঢাকা · লালবাগ · ওয়ারী" },
  jatrabari: { en: "Jatrabari · Demra · Shyampur", bn: "যাত্রাবাড়ী · ডেমরা · শ্যামপুর" },
};

const a = (en: string, bn: string, slug?: string): LocalArea => (slug ? { en, bn, slug } : { en, bn });

export const CITY_CORPORATIONS: CityCorporation[] = [
  {
    slug: "dhaka-north",
    en: "Dhaka North City Corporation",
    bn: "ঢাকা উত্তর সিটি কর্পোরেশন",
    district: "Dhaka",
    wards: 54,
    lat: 23.7935,
    lng: 90.4066,
    thanas: [
      { en: "Gulshan", bn: "গুলশান", zone: "gulshan", areas: [a("Gulshan 1", "গুলশান ১", "gulshan-1"), a("Gulshan 2", "গুলশান ২", "gulshan-2"), a("Niketan", "নিকেতন"), a("Baridhara", "বারিধারা"), a("Baridhara DOHS", "বারিধারা ডিওএইচএস"), a("Shahjadpur", "শাহজাদপুর")] },
      { en: "Banani", bn: "বনানী", zone: "gulshan", areas: [a("Banani", "বনানী", "banani"), a("Banani DOHS", "বনানী ডিওএইচএস"), a("Mohakhali", "মহাখালী"), a("Mohakhali DOHS", "মহাখালী ডিওএইচএস"), a("Korail", "কড়াইল")] },
      { en: "Vatara", bn: "ভাটারা", zone: "gulshan", areas: [a("Bashundhara R/A", "বসুন্ধরা আ/এ", "bashundhara"), a("Nadda", "নদ্দা"), a("Kuril", "কুড়িল"), a("Notun Bazar", "নতুন বাজার"), a("Jagannathpur", "জগন্নাথপুর")] },
      { en: "Khilkhet", bn: "খিলক্ষেত", zone: "gulshan", areas: [a("Khilkhet", "খিলক্ষেত"), a("Nikunja 1", "নিকুঞ্জ ১"), a("Nikunja 2", "নিকুঞ্জ ২")] },
      { en: "Badda", bn: "বাড্ডা", zone: "east-dhaka", areas: [a("Merul Badda", "মেরুল বাড্ডা"), a("Middle Badda", "মধ্য বাড্ডা"), a("Uttar Badda", "উত্তর বাড্ডা"), a("Aftabnagar", "আফতাবনগর")] },
      { en: "Rampura", bn: "রামপুরা", zone: "east-dhaka", areas: [a("Rampura", "রামপুরা"), a("Banasree", "বনশ্রী"), a("Ulon", "উলন")] },
      { en: "Uttara East", bn: "উত্তরা পূর্ব", zone: "uttara", areas: [a("Uttara Sector 1", "উত্তরা সেক্টর ১"), a("Uttara Sector 3", "উত্তরা সেক্টর ৩", "uttara-3"), a("Uttara Sector 4", "উত্তরা সেক্টর ৪"), a("Uttara Sector 5", "উত্তরা সেক্টর ৫"), a("Uttara Sector 6", "উত্তরা সেক্টর ৬"), a("Uttara Sector 7", "উত্তরা সেক্টর ৭", "uttara-7")] },
      { en: "Uttara West", bn: "উত্তরা পশ্চিম", zone: "uttara", areas: [a("Uttara Sector 9", "উত্তরা সেক্টর ৯"), a("Uttara Sector 10", "উত্তরা সেক্টর ১০"), a("Uttara Sector 11", "উত্তরা সেক্টর ১১", "uttara-11"), a("Uttara Sector 12", "উত্তরা সেক্টর ১২"), a("Uttara Sector 13", "উত্তরা সেক্টর ১৩"), a("Uttara Sector 14", "উত্তরা সেক্টর ১৪")] },
      { en: "Turag", bn: "তুরাগ", zone: "uttara", areas: [a("Uttara Sector 15", "উত্তরা সেক্টর ১৫"), a("Uttara Sector 16", "উত্তরা সেক্টর ১৬"), a("Uttara Sector 17", "উত্তরা সেক্টর ১৭"), a("Uttara Sector 18", "উত্তরা সেক্টর ১৮"), a("Diabari", "দিয়াবাড়ি"), a("Kamarpara", "কামারপাড়া")] },
      { en: "Uttarkhan", bn: "উত্তরখান", zone: "uttara", areas: [a("Uttarkhan", "উত্তরখান")] },
      { en: "Dakshinkhan", bn: "দক্ষিণখান", zone: "uttara", areas: [a("Dakshinkhan", "দক্ষিণখান"), a("Ashkona", "আশকোনা", "ashkona"), a("Faydabad", "ফায়দাবাদ")] },
      { en: "Airport", bn: "বিমানবন্দর", zone: "uttara", areas: [a("Kawla", "কাওলা")] },
      { en: "Cantonment", bn: "ক্যান্টনমেন্ট", zone: "mirpur", areas: [a("Dhaka Cantonment", "ঢাকা সেনানিবাস"), a("Manikdi", "মানিকদি"), a("Matikata", "মাটিকাটা")] },
      { en: "Bhashantek", bn: "ভাষানটেক", zone: "mirpur", areas: [a("Bhashantek", "ভাষানটেক"), a("Mirpur 14", "মিরপুর ১৪")] },
      { en: "Kafrul", bn: "কাফরুল", zone: "mirpur", areas: [a("Kafrul", "কাফরুল"), a("Kazipara", "কাজীপাড়া", "kazipara"), a("Shewrapara", "শেওড়াপাড়া"), a("Ibrahimpur", "ইব্রাহিমপুর"), a("Senpara Parbata", "সেনপাড়া পর্বতা"), a("Mirpur 13", "মিরপুর ১৩")] },
      { en: "Mirpur Model", bn: "মিরপুর মডেল", zone: "mirpur", areas: [a("Mirpur 2", "মিরপুর ২"), a("Mirpur 6", "মিরপুর ৬", "mirpur-6"), a("Mirpur 10", "মিরপুর ১০", "mirpur-10"), a("Monipur", "মণিপুর"), a("Pirerbag", "পীরেরবাগ")] },
      { en: "Pallabi", bn: "পল্লবী", zone: "mirpur", areas: [a("Pallabi", "পল্লবী"), a("Mirpur 7", "মিরপুর ৭"), a("Mirpur 11", "মিরপুর ১১"), a("Mirpur 12", "মিরপুর ১২"), a("Mirpur DOHS", "মিরপুর ডিওএইচএস")] },
      { en: "Shah Ali", bn: "শাহ আলী", zone: "mirpur", areas: [a("Mirpur 1", "মিরপুর ১"), a("Mazar Road", "মাজার রোড")] },
      { en: "Rupnagar", bn: "রূপনগর", zone: "mirpur", areas: [a("Rupnagar", "রূপনগর", "rupnagar"), a("Duaripara", "দুয়ারীপাড়া"), a("Eastern Housing", "ইস্টার্ন হাউজিং")] },
      { en: "Darus Salam", bn: "দারুস সালাম", zone: "mirpur", areas: [a("Darus Salam", "দারুস সালাম"), a("Gabtoli", "গাবতলী"), a("Technical", "টেকনিক্যাল")] },
      { en: "Mohammadpur", bn: "মোহাম্মদপুর", zone: "dhanmondi", areas: [a("Mohammadpur", "মোহাম্মদপুর", "mohammadpur"), a("Lalmatia", "লালমাটিয়া", "lalmatia"), a("Shyamoli", "শ্যামলী"), a("Asad Gate", "আসাদগেট"), a("Mohammadia Housing", "মোহাম্মদিয়া হাউজিং"), a("Basila", "বছিলা")] },
      { en: "Adabor", bn: "আদাবর", zone: "dhanmondi", areas: [a("Adabor", "আদাবর"), a("Ring Road", "রিং রোড"), a("Shekhertek", "শেখেরটেক")] },
      { en: "Sher-e-Bangla Nagar", bn: "শেরেবাংলা নগর", zone: "tejgaon", areas: [a("Agargaon", "আগারগাঁও"), a("Sher-e-Bangla Nagar", "শেরেবাংলা নগর")] },
      { en: "Tejgaon", bn: "তেজগাঁও", zone: "tejgaon", areas: [a("Farmgate", "ফার্মগেট"), a("Karwan Bazar", "কারওয়ান বাজার"), a("Tejkunipara", "তেজকুনিপাড়া"), a("Indira Road", "ইন্দিরা রোড"), a("Monipuripara", "মণিপুরীপাড়া")] },
      { en: "Tejgaon Industrial Area", bn: "তেজগাঁও শিল্পাঞ্চল", zone: "tejgaon", areas: [a("Tejgaon I/A", "তেজগাঁও শিল্প এলাকা"), a("Nakhalpara", "নাখালপাড়া"), a("Begunbari", "বেগুনবাড়ি")] },
    ],
  },
  {
    slug: "dhaka-south",
    en: "Dhaka South City Corporation",
    bn: "ঢাকা দক্ষিণ সিটি কর্পোরেশন",
    district: "Dhaka",
    wards: 75,
    lat: 23.7231,
    lng: 90.4086,
    thanas: [
      { en: "Dhanmondi", bn: "ধানমন্ডি", zone: "dhanmondi", areas: [a("Dhanmondi", "ধানমন্ডি", "dhanmondi"), a("Jigatola", "জিগাতলা"), a("Shankar", "শংকর")] },
      { en: "Kalabagan", bn: "কলাবাগান", zone: "dhanmondi", areas: [a("Kalabagan", "কলাবাগান", "kalabagan"), a("Panthapath", "পান্থপথ"), a("Green Road", "গ্রিন রোড")] },
      { en: "New Market", bn: "নিউ মার্কেট", zone: "dhanmondi", areas: [a("New Market", "নিউ মার্কেট"), a("Elephant Road", "এলিফ্যান্ট রোড"), a("Nilkhet", "নীলক্ষেত")] },
      { en: "Hazaribagh", bn: "হাজারীবাগ", zone: "dhanmondi", areas: [a("Hazaribagh", "হাজারীবাগ"), a("Rayer Bazar", "রায়েরবাজার")] },
      { en: "Lalbagh", bn: "লালবাগ", zone: "old-dhaka", areas: [a("Lalbagh", "লালবাগ"), a("Azimpur", "আজিমপুর")] },
      { en: "Kamrangirchar", bn: "কামরাঙ্গীরচর", zone: "old-dhaka", areas: [a("Kamrangirchar", "কামরাঙ্গীরচর")] },
      { en: "Chawkbazar", bn: "চকবাজার", zone: "old-dhaka", areas: [a("Chawkbazar", "চকবাজার"), a("Bakshibazar", "বকশীবাজার")] },
      { en: "Bangshal", bn: "বংশাল", zone: "old-dhaka", areas: [a("Bangshal", "বংশাল"), a("Nazira Bazar", "নাজিরা বাজার"), a("Siddique Bazar", "সিদ্দিক বাজার")] },
      { en: "Kotwali", bn: "কোতোয়ালী", zone: "old-dhaka", areas: [a("Islampur", "ইসলামপুর"), a("Sadarghat", "সদরঘাট"), a("Patuatuli", "পাটুয়াটুলী")] },
      { en: "Sutrapur", bn: "সূত্রাপুর", zone: "old-dhaka", areas: [a("Sutrapur", "সূত্রাপুর"), a("Farashganj", "ফরাশগঞ্জ"), a("Shankhari Bazar", "শাঁখারী বাজার"), a("Laxmibazar", "লক্ষ্মীবাজার")] },
      { en: "Wari", bn: "ওয়ারী", zone: "old-dhaka", areas: [a("Wari", "ওয়ারী"), a("Tikatuli", "টিকাটুলী"), a("Narinda", "নারিন্দা")] },
      { en: "Gendaria", bn: "গেন্ডারিয়া", zone: "old-dhaka", areas: [a("Gendaria", "গেন্ডারিয়া")] },
      { en: "Shyampur", bn: "শ্যামপুর", zone: "jatrabari", areas: [a("Shyampur", "শ্যামপুর"), a("Postagola", "পোস্তগোলা")] },
      { en: "Kadamtali", bn: "কদমতলী", zone: "jatrabari", areas: [a("Kadamtali", "কদমতলী")] },
      { en: "Jatrabari", bn: "যাত্রাবাড়ী", zone: "jatrabari", areas: [a("Jatrabari", "যাত্রাবাড়ী"), a("Shanir Akhra", "শনির আখড়া"), a("Kajla", "কাজলা")] },
      { en: "Demra", bn: "ডেমরা", zone: "jatrabari", areas: [a("Demra", "ডেমরা"), a("Staff Quarter", "স্টাফ কোয়ার্টার"), a("Matuail", "মাতুয়াইল")] },
      { en: "Sabujbagh", bn: "সবুজবাগ", zone: "east-dhaka", areas: [a("Basabo", "বাসাবো"), a("Sabujbagh", "সবুজবাগ"), a("Madartek", "মাদারটেক")] },
      { en: "Mugda", bn: "মুগদা", zone: "east-dhaka", areas: [a("Mugda", "মুগদা"), a("Manda", "মান্ডা")] },
      { en: "Khilgaon", bn: "খিলগাঁও", zone: "east-dhaka", areas: [a("Khilgaon", "খিলগাঁও"), a("Malibagh", "মালিবাগ"), a("Goran", "গোড়ান"), a("Meradia", "মেরাদিয়া")] },
      { en: "Shahjahanpur", bn: "শাহজাহানপুর", zone: "central-dhaka", areas: [a("Shahjahanpur", "শাহজাহানপুর"), a("Shantibagh", "শান্তিবাগ"), a("Rajarbagh", "রাজারবাগ")] },
      { en: "Motijheel", bn: "মতিঝিল", zone: "central-dhaka", areas: [a("Motijheel", "মতিঝিল"), a("Arambagh", "আরামবাগ"), a("Fakirapool", "ফকিরাপুল"), a("Dilkusha", "দিলকুশা")] },
      { en: "Paltan", bn: "পল্টন", zone: "central-dhaka", areas: [a("Purana Paltan", "পুরানা পল্টন"), a("Bijoynagar", "বিজয়নগর"), a("Kakrail", "কাকরাইল")] },
      { en: "Ramna", bn: "রমনা", zone: "central-dhaka", areas: [a("Eskaton", "ইস্কাটন"), a("Siddheshwari", "সিদ্ধেশ্বরী"), a("Shantinagar", "শান্তিনগর"), a("Bailey Road", "বেইলি রোড")] },
      { en: "Shahbag", bn: "শাহবাগ", zone: "central-dhaka", areas: [a("Shahbag", "শাহবাগ"), a("Dhaka University", "ঢাকা বিশ্ববিদ্যালয়"), a("Kataban", "কাঁটাবন"), a("Bangla Motor", "বাংলামোটর")] },
      { en: "Hatirjheel", bn: "হাতিরঝিল", zone: "central-dhaka", areas: [a("Moghbazar", "মগবাজার"), a("Hatirjheel", "হাতিরঝিল"), a("Mouchak", "মৌচাক")] },
    ],
  },
  {
    slug: "chattogram-city",
    en: "Chattogram City Corporation",
    bn: "চট্টগ্রাম সিটি কর্পোরেশন",
    district: "Chattogram",
    wards: 41,
    lat: 22.3569,
    lng: 91.7832,
    thanas: [
      { en: "Kotwali", bn: "কোতোয়ালী", areas: [a("Anderkilla", "আন্দরকিল্লা"), a("Jamal Khan", "জামালখান"), a("Patharghata", "পাথরঘাটা")] },
      { en: "Panchlaish", bn: "পাঁচলাইশ", areas: [a("Panchlaish R/A", "পাঁচলাইশ আ/এ"), a("GEC Circle", "জিইসি মোড়"), a("Nasirabad", "নাসিরাবাদ"), a("Muradpur", "মুরাদপুর"), a("2 No. Gate", "২ নম্বর গেট")] },
      { en: "Chandgaon", bn: "চান্দগাঁও", areas: [a("Chandgaon R/A", "চান্দগাঁও আ/এ"), a("Bahaddarhat", "বহদ্দারহাট")] },
      { en: "Double Mooring", bn: "ডবলমুরিং", areas: [a("Agrabad", "আগ্রাবাদ"), a("Dewanhat", "দেওয়ানহাট")] },
      { en: "Pahartali", bn: "পাহাড়তলী", areas: [a("Pahartali", "পাহাড়তলী"), a("AK Khan", "এ কে খান")] },
      { en: "Bandar", bn: "বন্দর" },
      { en: "Bakalia", bn: "বাকলিয়া" },
      { en: "Bayazid Bostami", bn: "বায়েজিদ বোস্তামী", areas: [a("Oxygen", "অক্সিজেন"), a("Sholoshahar", "ষোলশহর")] },
      { en: "Chawkbazar", bn: "চকবাজার" },
      { en: "Halishahar", bn: "হালিশহর", areas: [a("Halishahar Housing Estate", "হালিশহর হাউজিং এস্টেট")] },
      { en: "Khulshi", bn: "খুলশী", areas: [a("Khulshi", "খুলশী"), a("Lalkhan Bazar", "লালখান বাজার")] },
      { en: "Akbar Shah", bn: "আকবর শাহ", areas: [a("Foy's Lake", "ফয়েস লেক")] },
      { en: "Patenga", bn: "পতেঙ্গা" },
      { en: "EPZ", bn: "ইপিজেড" },
      { en: "Sadarghat", bn: "সদরঘাট" },
      { en: "Karnaphuli", bn: "কর্ণফুলী" },
    ],
  },
  {
    slug: "khulna-city",
    en: "Khulna City Corporation",
    bn: "খুলনা সিটি কর্পোরেশন",
    district: "Khulna",
    wards: 31,
    lat: 22.8456,
    lng: 89.5403,
    thanas: [
      { en: "Kotwali", bn: "কোতোয়ালী", areas: [a("Shibbari", "শিববাড়ি"), a("Dakbangla", "ডাকবাংলা")] },
      { en: "Sonadanga", bn: "সোনাডাঙ্গা", areas: [a("Sonadanga R/A", "সোনাডাঙ্গা আ/এ"), a("Gollamari", "গল্লামারী")] },
      { en: "Khalishpur", bn: "খালিশপুর", areas: [a("Boyra", "বয়রা")] },
      { en: "Daulatpur", bn: "দৌলতপুর" },
      { en: "Khan Jahan Ali", bn: "খানজাহান আলী" },
      { en: "Labanchora", bn: "লবণচরা" },
      { en: "Harintana", bn: "হরিণটানা" },
      { en: "Aranghata", bn: "আড়ংঘাটা" },
    ],
  },
  {
    slug: "rajshahi-city",
    en: "Rajshahi City Corporation",
    bn: "রাজশাহী সিটি কর্পোরেশন",
    district: "Rajshahi",
    wards: 30,
    lat: 24.3745,
    lng: 88.6042,
    thanas: [
      { en: "Boalia", bn: "বোয়ালিয়া", areas: [a("Shaheb Bazar", "সাহেব বাজার"), a("Uposhohor", "উপশহর")] },
      { en: "Rajpara", bn: "রাজপাড়া", areas: [a("Laxmipur", "লক্ষ্মীপুর")] },
      { en: "Motihar", bn: "মতিহার", areas: [a("Rajshahi University", "রাজশাহী বিশ্ববিদ্যালয়"), a("Binodpur", "বিনোদপুর")] },
      { en: "Shah Makhdum", bn: "শাহ মখদুম" },
      { en: "Chandrima", bn: "চন্দ্রিমা" },
      { en: "Kashiadanga", bn: "কাশিয়াডাঙ্গা" },
      { en: "Katakhali", bn: "কাটাখালী" },
      { en: "Airport", bn: "বিমানবন্দর" },
    ],
  },
  {
    slug: "sylhet-city",
    en: "Sylhet City Corporation",
    bn: "সিলেট সিটি কর্পোরেশন",
    district: "Sylhet",
    wards: 42,
    lat: 24.8949,
    lng: 91.8687,
    thanas: [
      { en: "Kotwali", bn: "কোতোয়ালী", areas: [a("Zindabazar", "জিন্দাবাজার"), a("Bandar Bazar", "বন্দরবাজার"), a("Amberkhana", "আম্বরখানা"), a("Uposhohor", "উপশহর"), a("Chowhatta", "চৌহাট্টা")] },
      { en: "Jalalabad", bn: "জালালাবাদ", areas: [a("Akhalia", "আখালিয়া")] },
      { en: "Shah Poran", bn: "শাহপরাণ" },
      { en: "Moglabazar", bn: "মোগলাবাজার" },
      { en: "Dakshin Surma", bn: "দক্ষিণ সুরমা" },
      { en: "Airport", bn: "বিমানবন্দর" },
    ],
  },
  {
    slug: "barishal-city",
    en: "Barishal City Corporation",
    bn: "বরিশাল সিটি কর্পোরেশন",
    district: "Barishal",
    wards: 30,
    lat: 22.701,
    lng: 90.3535,
    thanas: [
      { en: "Kotwali", bn: "কোতোয়ালী", areas: [a("Sadar Road", "সদর রোড"), a("Nathullabad", "নথুল্লাবাদ"), a("Band Road", "বান্দ রোড")] },
      { en: "Airport", bn: "বিমানবন্দর" },
      { en: "Kawnia", bn: "কাউনিয়া" },
      { en: "Bandar", bn: "বন্দর" },
    ],
  },
  {
    slug: "rangpur-city",
    en: "Rangpur City Corporation",
    bn: "রংপুর সিটি কর্পোরেশন",
    district: "Rangpur",
    wards: 33,
    lat: 25.7439,
    lng: 89.2752,
    thanas: [
      { en: "Kotwali", bn: "কোতোয়ালী", areas: [a("Jahaj Company Mor", "জাহাজ কোম্পানি মোড়"), a("Dhap", "ধাপ")] },
      { en: "Tajhat", bn: "তাজহাট" },
      { en: "Haragach", bn: "হারাগাছ" },
      { en: "Mahiganj", bn: "মাহিগঞ্জ" },
      { en: "Parshuram", bn: "পরশুরাম" },
      { en: "Hajirhat", bn: "হাজিরহাট" },
    ],
  },
  {
    slug: "mymensingh-city",
    en: "Mymensingh City Corporation",
    bn: "ময়মনসিংহ সিটি কর্পোরেশন",
    district: "Mymensingh",
    wards: 33,
    lat: 24.7471,
    lng: 90.4203,
    thanas: [
      { en: "Kotwali Model", bn: "কোতোয়ালী মডেল", areas: [a("Ganginarpar", "গাঙ্গিনারপাড়"), a("Charpara", "চরপাড়া"), a("Agricultural University", "কৃষি বিশ্ববিদ্যালয়")] },
    ],
  },
  {
    slug: "cumilla-city",
    en: "Cumilla City Corporation",
    bn: "কুমিল্লা সিটি কর্পোরেশন",
    district: "Cumilla",
    wards: 27,
    lat: 23.4607,
    lng: 91.1809,
    thanas: [
      { en: "Kotwali Model", bn: "কোতোয়ালী মডেল", areas: [a("Kandirpar", "কান্দিরপাড়"), a("Tomsom Bridge", "টমছম ব্রিজ"), a("Jhawtola", "ঝাউতলা")] },
      { en: "Sadar Dakshin Model", bn: "সদর দক্ষিণ মডেল" },
    ],
  },
  {
    slug: "narayanganj-city",
    en: "Narayanganj City Corporation",
    bn: "নারায়ণগঞ্জ সিটি কর্পোরেশন",
    district: "Narayanganj",
    wards: 27,
    lat: 23.6238,
    lng: 90.5,
    thanas: [
      { en: "Narayanganj Sadar Model", bn: "নারায়ণগঞ্জ সদর মডেল", areas: [a("Chashara", "চাষাঢ়া"), a("Nitaiganj", "নিতাইগঞ্জ")] },
      { en: "Fatullah", bn: "ফতুল্লা" },
      { en: "Siddhirganj", bn: "সিদ্ধিরগঞ্জ" },
      { en: "Bandar", bn: "বন্দর" },
    ],
  },
  {
    slug: "gazipur-city",
    en: "Gazipur City Corporation",
    bn: "গাজীপুর সিটি কর্পোরেশন",
    district: "Gazipur",
    wards: 57,
    lat: 23.9999,
    lng: 90.4203,
    thanas: [
      { en: "Joydebpur", bn: "জয়দেবপুর" },
      { en: "Basan", bn: "বাসন", areas: [a("Chandna Chowrasta", "চান্দনা চৌরাস্তা")] },
      { en: "Gacha", bn: "গাছা" },
      { en: "Konabari", bn: "কোনাবাড়ী" },
      { en: "Kashimpur", bn: "কাশিমপুর" },
      { en: "Pubail", bn: "পূবাইল" },
      { en: "Tongi East", bn: "টঙ্গী পূর্ব" },
      { en: "Tongi West", bn: "টঙ্গী পশ্চিম", areas: [a("Tongi Bazar", "টঙ্গী বাজার")] },
    ],
  },
];
