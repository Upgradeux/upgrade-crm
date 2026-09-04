import { NextRequest, NextResponse } from 'next/server';
import { ServiceType, LeadSource } from '@/types/crm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export interface ExtractedLeadData {
  companyName?: string;
  contactName?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  location?: string;
  websiteUrl?: string;
  mapsUrl?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  rating?: number;
  reviewCount?: number;
  followers?: string;
  source?: LeadSource;
  suggestedService?: ServiceType;
  suggestedServices?: ServiceType[];
  hasNoWebsite?: boolean;
  notes?: string;
  confidenceFields: string[];
}

// In-Memory Cache with 15-minute TTL to guarantee instant, 100% consistent results across repeat clicks
interface CacheEntry {
  data: ExtractedLeadData;
  timestamp: number;
}
const EXTRACTION_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Regex helpers
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const IN_MOBILE_REGEX = /(?:\+91[\s-]?)?[6789]\d{4}[\s-]?\d{5}\b/g;
const IN_MOBILE_ZERO_REGEX = /\b0[6789]\d{4}[\s-]?\d{5}\b/g;
const IN_LANDLINE_REGEX = /\b0\d{2,4}[-\s]?\d{6,8}\b/g;
const US_PHONE_REGEX = /\b(?:\+1[-. ]?)?\(?[2-9]\d{2}\)?[-. ]?[2-9]\d{2}[-. ]?\d{4}\b/g;
const UK_PHONE_REGEX = /\b(?:\+44|0)[1-9]\d{8,9}\b/g;

const IG_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p\/|reel\/)?([a-zA-Z0-9_.]+)/i;
const LI_URL_REGEX = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i;
const TW_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i;
const FB_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:p\/|people\/|pages\/)?([a-zA-Z0-9.\-_]{3,50})/i;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
};

// Comprehensive directory list to NEVER mistake for a company's actual website
const DIRECTORY_DOMAINS = [
  'google.', 'instagram.', 'facebook.', 'justdial.', 'cybo.', 'youtube.', 'linkedin.', 'twitter.', 'x.com', 'yelp.',
  'tripadvisor.', 'wikipedia.', 'mapquest.', 'sulekha.', 'indiamart.', 'bharatbz.', 'magicpin.', 'yellowpages.',
  'zomato.', 'swiggy.', 'nearbuy.', 'fresha.', 'setmore.', 'treatwell.', 'dnb.', 'zaubacorp.', 'tring.', 'zenoti.',
  'lbb.', 'jdmagicbox.', 'tradeindia.', 'panchsheel.', 'dialme.', 'vymaps.', 'nicelocal.', 'addressguru.',
  'businesslist.', 'cylex.', 'truelocal.', 'hotfrog.', 'brownbook.', 'contactout.', 'rocketreach.', 'signalhire.',
  'zoominfo.', 'lusha.', 'apollo.io', 'locobiz.', 'wedmegood.', 'piceapp.', 'beautynailhairsalons.', 'indiacom.',
  'showmelocal.', 'spoke.', 'crunchbase.', 'owler.', 'tofler.', 'instafinancials.', 'quickr.', 'olx.', 'asklaila.',
  'worldplaces.', 'pinterest.', 'tiktok.', 'threads.net', 'trustpilot.', 'glassdoor.', 'indeed.', 'mapsofindia.',
  'mygreentrends.', 'mysalongo.', 'salonhub.', 'mrsalonix.', 'naturals.', 'malon.', 'salonsclub.', 'lakmesalon.',
  'healthfrog.', 'whatshot.', 'curlytales.', 'tripoto.', 'mouthshut.', 'practo.', 'lybrate.', '1mg.', 'netmeds.',
  'rightindia.', 'indiabizlist.', 'indiainfo.', 'searchcity.', 'localbiz.', 'citysearch.', 'yellowbook.', 'superpages.',
  'w3.org', 'live.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'apple.com', 'lorealprofessionnel.', 'loreal.'
];

function isDirectoryUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return DIRECTORY_DOMAINS.some((d) => lower.includes(d));
}

function cleanCompanyName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^[-–—|•:\/,\s]+/, '')
    .replace(/[-–—|•:\/,\s]+$/, '')
    .replace(/\s*[-–—|•]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const JOB_TITLE_WORDS = new Set([
  'analyst', 'engineer', 'developer', 'specialist', 'manager', 'executive', 'technician',
  'consultant', 'officer', 'coordinator', 'administrator', 'representative', 'associate',
  'assistant', 'operator', 'inspector', 'worker', 'employee', 'driver', 'guard', 'helper',
  'security analyst', 'software engineer', 'web developer', 'marketing specialist',
  'pest control', 'pest control service', 'service provider', 'customer support', 'team lead', 'stylist', 'doctor',
  'dentist', 'physician', 'lawyer', 'advocate', 'accountant', 'auditor', 'broker', 'lead',
  'designer', 'photographer', 'videographer', 'writer', 'editor', 'staff', 'member', 'personnel'
]);

const KNOWN_INVALID_NAMES = new Set([
  'address at', 'google search', 'view profile', 'contact us', 'privacy policy', 'terms of service',
  'instagram photo', 'facebook post', 'see more', 'sign up', 'log in', 'directors', 'founders', 'proprietors',
  'salon muah', 'beauty salon', 'hair salon', 'ltd', 'pvt ltd', 'partnership', 'company profile', 'gst number',
  'mumbai', 'maharashtra', 'india', 'bandra west', 'new york', 'london', 'duckduckgo', 'justdial', 'asklaila',
  'locobiz', 'worldplaces', 'nearbuy', 'wedmegood', 'at duckduckgo', 'duckduckgo feedback', 'home', 'about',
  'services', 'pricing', 'reviews', 'photos', 'videos', 'locations', 'address', 'phone', 'email', 'website',
  'hours', 'ratings', 'overview', 'direction', 'directions', 'call now', 'book now', 'send message',
  'security analyst', 'software engineer', 'web developer', 'marketing specialist', 'pest control',
  'ship', 'proprietorship', 'partnership', 'proprietor', 'director', 'founder', 'partnership firm'
]);

function isJobTitleOrInvalidName(name: string, companyName = ''): boolean {
  if (!name || name.length < 3 || name.length > 35) return true;
  const lower = name.toLowerCase().trim();
  
  if (KNOWN_INVALID_NAMES.has(lower) || JOB_TITLE_WORDS.has(lower)) return true;
  if (companyName && (lower.includes(companyName.toLowerCase()) || companyName.toLowerCase().includes(lower))) return true;

  // Check if ends with job title words
  const words = lower.split(/\s+/);
  const lastWord = words[words.length - 1];
  if (JOB_TITLE_WORDS.has(lastWord)) return true;

  // Check company noun endings
  const companyNouns = ['services', 'service', 'solutions', 'enterprises', 'studio', 'salon', 'clinic', 'agency', 'company', 'pvt', 'ltd', 'firm', 'hub', 'care', 'center', 'store', 'shop', 'ship'];
  if (companyNouns.includes(lastWord)) return true;

  return false;
}

const CITIES = [
  'Mumbai', 'Navi Mumbai', 'Thane', 'Bandra', 'Andheri', 'Juhu', 'Worli', 'Colaba', 'Borivali', 'Powai', 'Dadar', 'Khar', 'Santacruz', 'Goregaon', 'Malad',
  'Delhi', 'New Delhi', 'Gurgaon', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad',
  'Bengaluru', 'Bangalore', 'Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Jayanagar',
  'Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli', 'Jubilee Hills', 'Banjara Hills',
  'Pune', 'Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner', 'Kalyani Nagar', 'Wakad', 'Aundh', 'Katraj', 'Swargate', 'Hadapsar', 'Maharshi Nagar', 'Market Yard', 'Chakan', 'Satara Road',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Kochi', 'Goa', 'Chandigarh',
  'London', 'Manchester', 'Birmingham', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Austin', 'San Francisco', 'Miami', 'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Dubai', 'Abu Dhabi', 'Singapore'
];

const GENERIC_INDUSTRY_WORDS = new Set([
  'pest', 'control', 'service', 'services', 'salon', 'beauty', 'clinic', 'hospital',
  'store', 'shop', 'solutions', 'studio', 'cafe', 'restaurant', 'cleaning', 'plumbing',
  'dental', 'hair', 'spa', 'agency', 'consulting', 'management', 'enterprises', 'firm',
  'group', 'india', 'pune', 'mumbai', 'delhi', 'center', 'centre', 'care', 'hub', 'point',
  'house', 'world', 'city', 'best', 'top', 'near', 'fast', 'quick', 'good', 'direct', 'online'
]);

function isLikelyCompanyWebsite(rawUrl: string, companyName: string): boolean {
  if (!rawUrl || isDirectoryUrl(rawUrl)) return false;
  const domain = rawUrl.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const nameParts = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((p) => p.length > 2);
  if (nameParts.length === 0) return false;

  // Filter out generic industry terms to find distinctive brand keywords
  const brandKeywords = nameParts.filter((p) => !GENERIC_INDUSTRY_WORDS.has(p));

  // If there are distinctive brand keywords (e.g. "cockroach", "muah", "ayush"), at least one must match the domain
  if (brandKeywords.length > 0) {
    return brandKeywords.some((part) => domain.includes(part));
  }

  // Purely generic search query (e.g. "Pest Control Services"): require at least 2 distinct word matches
  const matchedCount = nameParts.filter((part) => domain.includes(part)).length;
  return matchedCount >= 2 && domain.includes(nameParts[0]);
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#x113;/gi, 'e')
    .replace(/&#x2022;/gi, '•')
    .replace(/&#064;|&commat;/gi, '@')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function decodeSearchUrl(raw: string): string {
  if (!raw) return '';
  try {
    let decoded = decodeURIComponent(raw);
    if (decoded.includes('%')) decoded = decodeURIComponent(decoded);
    return decoded;
  } catch {
    return raw;
  }
}

async function safeFetchHtml(url: string, timeoutMs = 4500): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    return { html, finalUrl: res.url };
  } catch {
    return null;
  }
}

const INVALID_LOCATION_WORDS = new Set([
  'official', 'website', 'contact', 'home', 'business', 'info', 'page', 'profile', 'dm', 'book',
  'link', 'store', 'shop', 'online', 'welcome', 'about', 'services', 'pricing', 'reviews', 'ratings',
  'all rights reserved', 'privacy policy', 'terms', 'help', 'search', 'view', 'address', 'directions',
  'undefined'
]);

// Clean address string to concise "Area, City"
function cleanLocationString(raw: string): string {
  if (!raw) return '';
  let clean = raw
    .replace(/\s*listed under\b.*$/gi, '')
    .replace(/\s*(?:[-–|•]\s*(?:AskLaila|Locobiz|Justdial|WedMeGood|D&B|Facebook|Instagram|LinkedIn|India|IndiaMART|Sulekha|Zomato|Swiggy|Google|Reviews|Ratings|Website|Contact|WorldPlaces|HealthFrog|Nearbuy)).*$/gi, '')
    .replace(/^https?:\/\/[^\s]+/i, '')
    .replace(/\b(?:Opposite|Opp|Near|Behind|Beside|Sector-\d+|Shop No \d+|Floor \d+|Plot No \d+|House No \d+|Lane No \d+)\b[^\n,)]*/gi, '')
    .replace(/\b(?:Maharashtra|Karnataka|Tamil Nadu|Telangana|Gujarat|Rajasthan|Uttar Pradesh|Haryana|West Bengal)\b/gi, '')
    .replace(/\b\d{6}\b/g, '') // Remove 6-digit postal pincodes
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean.length < 3 || INVALID_LOCATION_WORDS.has(clean.toLowerCase())) {
    return '';
  }

  const parts = clean.split(/[,–|•]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) {
    const cityIdx = parts.findIndex((p) => CITIES.some((c) => p.toLowerCase().includes(c.toLowerCase())));
    if (cityIdx > 0) {
      clean = `${parts[cityIdx - 1]}, ${parts[cityIdx]}`;
    } else if (cityIdx === 0 && parts.length > 1) {
      clean = `${parts[0]}, ${parts[1]}`;
    } else {
      clean = parts.slice(-2).join(', ');
    }
  }

  // Ensure City is attached if area is recognized
  if (/Bandra|Borivali|Andheri|Khar|Juhu|Worli|Powai/i.test(clean) && !/Mumbai/i.test(clean)) {
    clean = `${clean}, Mumbai`;
  } else if (/Katraj|Swargate|Kothrud|Baner|Hinjewadi|Wakad|Maharshi Nagar|Market Yard|Chakan|Satara Road/i.test(clean) && !/Pune/i.test(clean)) {
    clean = `${clean}, Pune`;
  } else if (/Koramangala|Indiranagar|Whitefield|HSR/i.test(clean) && !/Bangalore|Bengaluru/i.test(clean)) {
    clean = `${clean}, Bangalore`;
  } else if (/Gurgaon|Gurugram|Noida/i.test(clean) && !/Delhi|NCR/i.test(clean)) {
    clean = `${clean}, Delhi NCR`;
  }

  return clean.replace(/\s*,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
}

// Extract GPS Coordinates from Google Maps URLs or HTML
function extractCoordinatesFromMapsUrl(url: string, html = ''): { lat: number; lng: number } | null {
  if (!url && !html) return null;

  // 1. Check pinpoint coordinates !3dLAT!4dLNG in URL or HTML
  const pinMatch = (url + ' ' + html).match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pinMatch) {
    return { lat: parseFloat(pinMatch[1]), lng: parseFloat(pinMatch[2]) };
  }

  // 2. Check viewport center coordinates /@lat,lng
  const centerMatch = (url + ' ' + html).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (centerMatch) {
    return { lat: parseFloat(centerMatch[1]), lng: parseFloat(centerMatch[2]) };
  }

  // 3. Check [lat, lng] array structure in Google Maps HTML
  const coordArrayMatch = html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
  if (coordArrayMatch) {
    return { lat: parseFloat(coordArrayMatch[1]), lng: parseFloat(coordArrayMatch[2]) };
  }

  return null;
}

// Reverse geocode (lat, lng) to "Area, City" using OpenStreetMap & BigDataCloud
async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string | null> {
  // 1. Try Nominatim (high precision neighborhood / suburb + city)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'AgencyCRM-LeadBot/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.commercial || addr.subdistrict || '';
      const city = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || '';
      if (suburb && city && suburb.toLowerCase() !== city.toLowerCase()) {
        return cleanLocationString(`${suburb}, ${city}`);
      }
      if (city) return cleanLocationString(city);
    }
  } catch {}

  // 2. Fallback to BigDataCloud
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || '';
      const locality = data.locality && data.locality !== city ? data.locality : '';
      if (locality && city) return cleanLocationString(`${locality}, ${city}`);
      if (city) return cleanLocationString(city);
    }
  } catch {}

  return null;
}

// Extract clean emails
function extractCleanEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.js', '.css', '.woff'];
  const invalidKeywords = ['sentry', 'example', 'wixpress', 'schema.org', 'domain.com', 'email.com', 'polyfill', 'user@', 'noreply', 'support@google.com'];

  const cleaned = matches
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      if (invalidExtensions.some((ext) => e.endsWith(ext))) return false;
      if (invalidKeywords.some((kw) => e.includes(kw))) return false;
      return true;
    });

  return Array.from(new Set(cleaned));
}

// Known aggregator & directory PBX numbers to exclude
const AGGREGATOR_PHONES = new Set([
  '09644211212', '9644211212', '08888888888', '8888888888', '02261234567', '02228888888',
  '01140000000', '18002000000', '18001088888', '18002660000', '08048000000', '08047000000'
]);

// Extract phone numbers (handles leading zero formats like 084120 14757)
function extractPhoneNumbers(html: string): { primary?: string; alternate?: string } {
  const candidates: string[] = [];

  // 1. Explicit Indian Mobile with +91 (highest confidence)
  for (const m of html.matchAll(/\+91[\s-]?[6789]\d{4}[\s-]?\d{5}\b/g)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      const clean = `+${digits}`;
      if (!candidates.includes(clean)) candidates.push(clean);
    }
  }

  // 2. Mobile with leading 0 (e.g. 084120 14757)
  for (const m of html.matchAll(IN_MOBILE_ZERO_REGEX)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
      const clean = cleanIndianMobile(digits);
      if (!candidates.includes(clean) && !AGGREGATOR_PHONES.has(digits)) candidates.push(clean);
    }
  }

  // 3. Indian Mobile (standard 10 digits starting 6,7,8,9)
  for (const m of html.matchAll(IN_MOBILE_REGEX)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length === 10) {
      const clean = cleanIndianMobile(digits);
      if (!candidates.includes(clean) && !AGGREGATOR_PHONES.has(digits)) candidates.push(clean);
    }
  }

  // 4. Indian Landlines with STD code (e.g. 022-26401234, 020-24361234)
  for (const m of html.matchAll(IN_LANDLINE_REGEX)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 11) {
      const std = m[0].trim();
      if (!candidates.includes(std) && !AGGREGATOR_PHONES.has(digits)) candidates.push(std);
    }
  }

  // 5. US & UK Phone Numbers
  for (const m of html.matchAll(US_PHONE_REGEX)) {
    const val = m[0].trim();
    if (!candidates.includes(val)) candidates.push(val);
  }
  for (const m of html.matchAll(UK_PHONE_REGEX)) {
    const val = m[0].trim();
    if (!candidates.includes(val)) candidates.push(val);
  }

  const valid = candidates.filter((p) => {
    const d = p.replace(/\D/g, '');
    return (
      d !== '1234567890' &&
      d !== '0000000000' &&
      !AGGREGATOR_PHONES.has(d) &&
      !p.includes('2024') &&
      !p.includes('2025') &&
      !p.includes('2026')
    );
  });

  return {
    primary: valid[0],
    alternate: valid[1],
  };
}

function cleanIndianMobile(digits: string): string {
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function isRelevantInstagramHandle(handle: string, companyName: string): boolean {
  if (!handle || !companyName) return false;
  const h = handle.toLowerCase().replace(/^@+/, '').replace(/[._-]/g, '');
  const cParts = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((p) => p.length > 2);
  
  if (cParts.length <= 1) {
    return h === (cParts[0] || '') || h.startsWith(cParts[0] || '');
  }

  // Multi-word company (e.g. Snehal Pest Control or Salon Muah)
  // Must match at least 2 distinct words from the company name (e.g. "snehal" + "pest")
  const matchedParts = cParts.filter((p) => h.includes(p));
  if (matchedParts.length >= 2) return true;

  // Or full joined name (e.g. "snehalpestcontrol" in "@snehalpestcontrol_pune")
  const joined = cParts.join('');
  if (h.includes(joined)) return true;

  return false;
}

// Extract Instagram Handle from any search HTML (direct links, encoded URLs, captions, title snippets)
function extractInstagramHandle(html: string, companyName = ''): string | undefined {
  if (!html) return undefined;
  const decoded = decodeSearchUrl(html);

  const invalidHandles = [
    'p', 'reel', 'explore', 'stories', 'tv', 'about', 'tags', 'accounts', 'developer',
    'directory', 'salon', 'locations', 'pvt', 'ltd', 'instagram', 'help', 'privacy', 'legal'
  ];

  // 1. Direct or decoded URL matches
  const igPatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p\/|reel\/)?([a-zA-Z0-9_.]+)/gi,
    /uddg=https?%3A%2F%2F(?:www\.)?instagram\.com%2F([a-zA-Z0-9_.]+)/gi,
    /RU=https?%3a%2f%2f(?:www\.)?instagram\.com%2f([a-zA-Z0-9_.]+)/gi,
    /url\?q=https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi,
    /\(@([a-zA-Z0-9_.]+)\)\s*•\s*Instagram/gi,
  ];

  for (const regex of igPatterns) {
    for (const m of html.matchAll(regex)) {
      const h = m[1].toLowerCase().replace(/[/?#].*$/, '');
      if (!invalidHandles.includes(h) && h.length >= 3 && isRelevantInstagramHandle(h, companyName)) {
        return `@${h}`;
      }
    }
    for (const m of decoded.matchAll(regex)) {
      const h = m[1].toLowerCase().replace(/[/?#].*$/, '');
      if (!invalidHandles.includes(h) && h.length >= 3 && isRelevantInstagramHandle(h, companyName)) {
        return `@${h}`;
      }
    }
  }

  // 2. Search snippet text near "Followers"
  const nearMatch = html.match(/([a-zA-Z0-9_.]+)\s*(?:\(@([a-zA-Z0-9_.]+)\))?[^<]{0,80}\b\d+(?:\.\d+)?[KkMmB]?\s+Followers/i);
  if (nearMatch) {
    const candidate = (nearMatch[2] || nearMatch[1]).toLowerCase().replace(/^@+/, '');
    if (!invalidHandles.includes(candidate) && candidate.length >= 3 && isRelevantInstagramHandle(candidate, companyName)) {
      return `@${candidate}`;
    }
  }

  return undefined;
}

// Extract Followers count string
function extractFollowers(html: string): string | undefined {
  if (!html) return undefined;
  const m = html.match(/(\d+(?:\.\d+)?[KkMmB]?|\d{1,3}(?:,\d{3})+)\s+Followers/i);
  return m ? m[0].trim() : undefined;
}

// Extract Owner / Contact person (strictly filtered against generic words, job titles & locations)
function extractContactPerson(html: string, companyName: string): string | undefined {
  if (!html) return undefined;

  // 1. Strict LinkedIn Title pattern: Name - Owner/Founder/CEO | LinkedIn
  const liTitleMatch = html.match(/([A-Z][a-z]+(?:\s+[A-Z]['’]?[A-Za-z]+){1,2})\s*[-–—|]\s*(?:Owner|Founder|Co-Founder|Proprietor|Managing Director|CEO|MD)\b[^-–—|]*\|\s*LinkedIn/i);
  if (liTitleMatch && liTitleMatch[1]) {
    const name = liTitleMatch[1].trim();
    if (!isJobTitleOrInvalidName(name, companyName)) {
      return name;
    }
  }

  // 2. Explicit Director/Founder/Owner pattern: "Founder: First Last"
  const dirMatch = html.match(/\b(?:Director|Directors|Founder|Founders|Owner|Owners|Proprietor|Proprietors)\b\s*[:–-]?\s*([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)?(?:\s+[A-Z]['’]?[A-Za-z]+)?)/i);
  if (dirMatch && dirMatch[1]) {
    const name = dirMatch[1].replace(/\s+\band\b\s+/gi, ' & ').trim();
    if (!isJobTitleOrInvalidName(name, companyName)) {
      return name;
    }
  }

  return undefined;
}

// Parallel Multi-Engine search across diverse resilient providers (Yahoo, DDG Lite, DDG HTML, Bing)
async function multiSearchEnrichment(queries: string[]): Promise<string> {
  const fetchUrls: string[] = [];

  for (const q of queries) {
    const cleanQ = cleanCompanyName(q);
    if (!cleanQ) continue;
    const encoded = encodeURIComponent(cleanQ);
    fetchUrls.push(
      `https://lite.duckduckgo.com/lite/?q=${encoded}`,
      `https://html.duckduckgo.com/html/?q=${encoded}&kl=wt-wt`,
      `https://search.yahoo.com/search?p=${encoded}&ei=UTF-8`,
      `https://www.bing.com/search?q=${encoded}&setlang=en`
    );
  }

  const results = await Promise.allSettled(
    fetchUrls.map((url) => safeFetchHtml(url, 4000))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ html: string; finalUrl: string } | null> => r.status === 'fulfilled' && !!r.value?.html)
    .map((r) => r.value!.html)
    .join('\n');
}

// Scrape business website
async function scrapeCompanyWebsite(websiteUrl: string): Promise<Partial<ExtractedLeadData>> {
  const result: Partial<ExtractedLeadData> = {};
  if (!websiteUrl || isDirectoryUrl(websiteUrl)) {
    return result;
  }

  const fetched = await safeFetchHtml(websiteUrl, 4500);
  if (!fetched) return result;

  const { html } = fetched;

  // Emails
  const emails = extractCleanEmails(html);
  if (emails.length > 0) {
    result.email = emails[0];
  }

  // Phone
  const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
  if (telMatch && telMatch[1]) {
    result.phone = telMatch[1].replace(/[^\d+]/g, '').trim();
  } else {
    const { primary, alternate } = extractPhoneNumbers(html);
    if (primary) result.phone = primary;
    if (alternate) result.alternatePhone = alternate;
  }

  // Socials from website links
  const igMatch = html.match(IG_URL_REGEX);
  if (igMatch && igMatch[1]) {
    const username = igMatch[1].toLowerCase().replace(/[/?#].*$/, '');
    if (!['p', 'explore', 'reel', 'stories', 'tv'].includes(username)) {
      result.instagram = `@${username}`;
    }
  }

  const liMatch = html.match(LI_URL_REGEX);
  if (liMatch && liMatch[0]) {
    result.linkedin = liMatch[0].startsWith('http') ? liMatch[0] : `https://${liMatch[0]}`;
  }

  const twMatch = html.match(TW_URL_REGEX);
  if (twMatch && twMatch[1]) {
    result.twitter = `@${twMatch[1]}`;
  }

  const fbMatch = html.match(FB_URL_REGEX);
  if (fbMatch && fbMatch[0]) {
    result.facebook = fbMatch[0].startsWith('http') ? fbMatch[0] : `https://${fbMatch[0]}`;
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = (body?.url || body?.input || '').trim();

    if (!rawInput) {
      return NextResponse.json({ error: 'Please provide a valid URL or Instagram username' }, { status: 400 });
    }

    // Check In-Memory Cache for instant, 100% consistent results across repeat clicks
    const cacheKey = rawInput.toLowerCase();
    const cached = EXTRACTION_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cached.data });
    }

    const data: ExtractedLeadData = {
      confidenceFields: [],
    };

    let targetUrl = rawInput;

    // 1. INSTAGRAM HANDLE OR URL
    const isInstagramInput =
      rawInput.startsWith('@') ||
      rawInput.includes('instagram.com') ||
      (!rawInput.includes('.') && !rawInput.includes('/') && !rawInput.startsWith('http'));

    if (isInstagramInput) {
      let username = rawInput.replace(/^@+/, '').trim();
      const igUrlMatch = rawInput.match(/instagram\.com\/(?:p\/|reel\/)?([a-zA-Z0-9_.]+)/i);
      if (igUrlMatch && igUrlMatch[1]) {
        username = igUrlMatch[1].replace(/[/?#].*$/, '');
      }

      data.instagram = `@${username}`;
      data.source = 'Instagram';
      data.confidenceFields.push('Instagram Handle');

      // Fetch public profile and search enrichment in parallel
      const [igFetched, searchHtml] = await Promise.all([
        safeFetchHtml(`https://www.instagram.com/${username}/`, 4000),
        multiSearchEnrichment([
          `instagram ${username} phone email contact address`,
          `${username} Mumbai Delhi London New York website`,
        ]),
      ]);

      if (igFetched && igFetched.html) {
        const { html } = igFetched;

        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          const rawTitle = decodeHtmlEntities(ogTitleMatch[1]);
          const namePart = rawTitle.split(/\(@|\s*•\s*Instagram|\s*on Instagram/i)[0].trim();
          if (namePart && namePart.toLowerCase() !== username.toLowerCase()) {
            data.companyName = cleanCompanyName(namePart);
            data.confidenceFields.push('Company Name');
          }
        }

        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        if (ogDescMatch && ogDescMatch[1]) {
          const desc = ogDescMatch[1];
          data.notes = `Instagram Bio: ${desc}`;

          const emails = extractCleanEmails(desc);
          if (emails.length > 0) {
            data.email = emails[0];
            data.confidenceFields.push('Email');
          }

          const { primary, alternate } = extractPhoneNumbers(desc);
          if (primary) {
            data.phone = primary;
            data.confidenceFields.push('Phone');
          }
          if (alternate) {
            data.alternatePhone = alternate;
          }

          const linkMatch = desc.match(/https?:\/\/[^\s,]+/i);
          if (linkMatch && linkMatch[0] && !isDirectoryUrl(linkMatch[0])) {
            data.websiteUrl = linkMatch[0];
            data.confidenceFields.push('Website URL');
          }

          const igFollowers = desc.match(/(\d+(?:\.\d+)?[KkMmB]?|\d{1,3}(?:,\d{3})+)\s+Followers/i);
          if (igFollowers && igFollowers[0]) {
            data.followers = igFollowers[0].trim();
            data.confidenceFields.push(data.followers);
          }
        }
      }

      // Enrich from multi-search pages
      if (searchHtml) {
        if (!data.followers) {
          const f = extractFollowers(searchHtml);
          if (f) {
            data.followers = f;
            data.confidenceFields.push(f);
          }
        }
        const { primary, alternate } = extractPhoneNumbers(searchHtml);
        if (!data.phone && primary) {
          data.phone = primary;
          data.confidenceFields.push('Phone');
        }
        if (!data.alternatePhone && alternate) {
          data.alternatePhone = alternate;
          data.confidenceFields.push('Alt Phone');
        }

        const pinMatch = searchHtml.match(/(?:📍|📌)\s*([A-Za-z0-9\s,–-]+?)(?=[|•\n\r"&<]|$)/i);
        if (pinMatch && pinMatch[1]) {
          const loc = cleanLocationString(pinMatch[1]);
          if (loc) {
            data.location = loc;
            data.confidenceFields.push('Location');
          }
        }

        const contact = extractContactPerson(searchHtml, data.companyName || username);
        if (contact) {
          data.contactName = contact;
          data.confidenceFields.push(`Owner: ${contact}`);
        }
      }

      if (!data.companyName) {
        data.companyName = username;
        data.confidenceFields.push('Username');
      }

      // Check website
      if (!data.websiteUrl || data.websiteUrl.trim() === '') {
        data.hasNoWebsite = true;
        data.suggestedService = 'Web Development';
        data.suggestedServices = ['Web Development'];
        data.confidenceFields.push('No Website (Recommended: Web Development)');
      } else {
        data.hasNoWebsite = false;
        data.suggestedService = 'AI Voice Agent';
        data.suggestedServices = ['AI Voice Agent'];
      }

      data.confidenceFields = Array.from(new Set(data.confidenceFields));
      EXTRACTION_CACHE.set(cacheKey, { data, timestamp: Date.now() });
      return NextResponse.json({ success: true, data });
    }

    // Ensure URL has protocol
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    // 2. GOOGLE MAPS / GOOGLE SHARE / LOCAL SEARCH URL
    const isGoogleSource =
      targetUrl.includes('share.google') ||
      targetUrl.includes('maps.app.goo.gl') ||
      targetUrl.includes('goo.gl/maps') ||
      targetUrl.includes('google.com/maps') ||
      targetUrl.includes('maps.google.com') ||
      targetUrl.includes('google.com/search');

    if (isGoogleSource) {
      data.source = 'Google Maps';
      data.mapsUrl = targetUrl;
      data.confidenceFields.push('Google Maps Link');

      const fetched = await safeFetchHtml(targetUrl, 6000);
      let resolvedUrl = targetUrl;
      const mapsHtml = fetched?.html || '';

      if (fetched) {
        resolvedUrl = fetched.finalUrl || targetUrl;
      }

      // 1. Extract from /maps/place/<Name, Address>/
      const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@?]+)/i);
      if (placeMatch && placeMatch[1]) {
        let rawPlace = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        
        // Extract city from "Place - City" or "Place, City"
        for (const city of CITIES) {
          const regex = new RegExp(`\\s*[-–—|•,]\\s*(${city})\\b.*$`, 'i');
          const m = rawPlace.match(regex);
          if (m && m.index && m.index > 3) {
            data.location = cleanLocationString(m[1].trim());
            rawPlace = rawPlace.substring(0, m.index).trim();
            break;
          }
        }
        
        const parts = rawPlace.split(/[,–|•]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          data.companyName = cleanCompanyName(parts[0]);
          if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', '));
        } else {
          data.companyName = cleanCompanyName(rawPlace);
        }
        
        if (data.companyName) data.confidenceFields.push('Business Name');
        if (data.location) data.confidenceFields.push('Location');
      }

      // 2. Extract from /maps/search/<Name+Location>/
      if (!data.companyName) {
        const searchMatch = resolvedUrl.match(/\/maps\/search\/([^/@?]+)/i);
        if (searchMatch && searchMatch[1]) {
          let rawSearch = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
          for (const city of CITIES) {
            const regex = new RegExp(`\\s*[-–—|•,]\\s*(${city})\\b.*$`, 'i');
            const m = rawSearch.match(regex);
            if (m && m.index && m.index > 3) {
              data.location = cleanLocationString(m[1].trim());
              rawSearch = rawSearch.substring(0, m.index).trim();
              break;
            }
          }
          const parts = rawSearch.split(/[,–|•]/).map((p) => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            data.companyName = cleanCompanyName(parts[0]);
            if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', '));
          } else {
            data.companyName = cleanCompanyName(rawSearch);
          }
          if (data.companyName) data.confidenceFields.push('Business Name');
          if (data.location) data.confidenceFields.push('Location');
        }
      }

      // 3. Extract from query params (q=Name or query=Name)
      if (!data.companyName || !data.location) {
        try {
          const parsed = new URL(resolvedUrl);
          const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('query');
          if (qParam && !qParam.toLowerCase().includes('google search')) {
            let qClean = qParam.replace(/\+/g, ' ').trim();
            for (const city of CITIES) {
              const regex = new RegExp(`\\s*[-–—|•,]\\s*(${city})\\b.*$`, 'i');
              const m = qClean.match(regex);
              if (m && m.index && m.index > 3) {
                if (!data.location) data.location = cleanLocationString(m[1].trim());
                qClean = qClean.substring(0, m.index).trim();
                break;
              }
            }
            const parts = qClean.split(/[,–|•]/).map((p) => p.trim()).filter(Boolean);
            if (parts.length > 1) {
              if (!data.companyName) data.companyName = cleanCompanyName(parts[0]);
              if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', '));
            } else if (!data.companyName) {
              data.companyName = cleanCompanyName(qClean);
            }
            if (data.companyName) data.confidenceFields.push('Business Name');
            if (data.location && !data.confidenceFields.includes('Location')) data.confidenceFields.push('Location');
          }
        } catch {}
      }

      // 4. Extract from Google Maps HTML title & meta tags
      if (mapsHtml && (!data.companyName || !data.location)) {
        const ogTitle = mapsHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitle && ogTitle[1]) {
          const rawOg = decodeHtmlEntities(ogTitle[1]);
          const parts = rawOg.split(/[·•|-]/).map((p) => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            if (!data.companyName) data.companyName = cleanCompanyName(parts[0]);
            if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', ').replace(/\s*Google Maps\s*/i, ''));
            if (data.location && !data.confidenceFields.includes('Location')) data.confidenceFields.push('Location');
          }
        }

        const titleMatch = mapsHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const cleanTitle = decodeHtmlEntities(titleMatch[1]).replace(/\s*-\s*Google Maps\s*$/i, '').trim();
          const parts = cleanTitle.split(/[-–·•]/).map((p) => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            if (!data.companyName) data.companyName = cleanCompanyName(parts[0]);
            if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', '));
            if (data.location && !data.confidenceFields.includes('Location')) data.confidenceFields.push('Location');
          } else if (!data.companyName) {
            data.companyName = cleanCompanyName(cleanTitle);
          }
        }
      }

      // 5. If company name still contains City / Area suffix (e.g. "Salon Muah Bandra West Mumbai")
      if (data.companyName && !data.location) {
        for (const city of CITIES) {
          const regex = new RegExp(`\\b(${city})\\b.*$`, 'i');
          const m = data.companyName.match(regex);
          if (m && m.index && m.index > 3) {
            const potentialName = data.companyName.substring(0, m.index).trim();
            const potentialLoc = data.companyName.substring(m.index).trim();
            if (potentialName.length > 2) {
              data.companyName = cleanCompanyName(potentialName);
              data.location = cleanLocationString(potentialLoc);
              if (data.location) data.confidenceFields.push('Location');
              break;
            }
          }
        }
      }

      // 6. Reverse Geocode exact GPS Coordinates from Google Maps URL / HTML (e.g. Pune, Bandra Mumbai)
      if (!data.location) {
        const coords = extractCoordinatesFromMapsUrl(resolvedUrl, mapsHtml);
        if (coords) {
          const revLoc = await reverseGeocodeCoordinates(coords.lat, coords.lng);
          if (revLoc) {
            data.location = revLoc;
            if (!data.confidenceFields.includes('Location')) data.confidenceFields.push('Location');
          }
        }
      }

      // Direct phone extraction from Google Maps page if available
      if (mapsHtml && !data.phone) {
        const { primary, alternate } = extractPhoneNumbers(mapsHtml);
        if (primary) {
          data.phone = primary;
          data.confidenceFields.push('Primary Phone');
        }
        if (alternate) {
          data.alternatePhone = alternate;
          data.confidenceFields.push('Alternate Phone');
        }
      }

      // Final clean of companyName
      if (data.companyName) {
        data.companyName = cleanCompanyName(data.companyName);
      }

      // If we have the company name, execute parallel multi-search enrichment
      if (data.companyName) {
        data.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.companyName + (data.location ? ' ' + data.location : ''))}`;

        const searchHtml = await multiSearchEnrichment([
          `${data.companyName} ${data.location || ''} phone contact Justdial`,
          `${data.companyName} ${data.location || ''} phone contact address`,
          `${data.companyName} ${data.location || ''} instagram`,
        ]);

        // 1. Instagram Handle & Followers (strictly validated against company keywords)
        const igHandle = extractInstagramHandle(searchHtml, data.companyName);
        if (igHandle) {
          data.instagram = igHandle;
          data.confidenceFields.push('Instagram Handle');

          const followersCount = extractFollowers(searchHtml);
          if (followersCount) {
            data.followers = followersCount;
            data.confidenceFields.push(followersCount);
          }
        }

        // 2. LinkedIn Profile / Company (strictly validated)
        const cParts = data.companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((p) => p.length > 2);
        const liMatches = [...searchHtml.matchAll(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9_-]+)/gi)];
        for (const m of liMatches) {
          const full = m[0].startsWith('http') ? m[0] : `https://${m[0]}`;
          const slug = m[1].toLowerCase().replace(/[-_]/g, '');
          if (!full.includes('/pulse/') && !full.includes('/posts/') && !full.includes('/jobs/')) {
            const isRelevantLi = cParts.some((p) => slug.includes(p)) && (cParts.length <= 1 || cParts.filter((p) => slug.includes(p)).length >= 2 || slug.includes(cParts.join('')));
            if (isRelevantLi) {
              data.linkedin = full;
              data.confidenceFields.push('LinkedIn Profile');
              break;
            }
          }
        }

        // 3. Facebook Page (strictly validated)
        const fbMatches = [...searchHtml.matchAll(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:p\/|people\/|pages\/)?([a-zA-Z0-9.\-_]{3,50})/gi)];
        for (const m of fbMatches) {
          const slug = m[1].toLowerCase().replace(/[-_]/g, '');
          if (!['login', 'share', 'help', 'privacy', 'terms', 'recover', 'dialog', 'profile.php', 'sharer.php'].includes(slug)) {
            const isRelevantFb = cParts.some((p) => slug.includes(p)) && (cParts.length <= 1 || cParts.filter((p) => slug.includes(p)).length >= 2 || slug.includes(cParts.join('')));
            if (isRelevantFb) {
              data.facebook = `https://www.facebook.com/${m[1]}`;
              data.confidenceFields.push('Facebook Page');
              break;
            }
          }
        }

        // 4. Primary & Alternate Phone Numbers from Search
        const { primary, alternate } = extractPhoneNumbers(searchHtml);
        if (primary) {
          data.phone = primary;
          data.confidenceFields.push('Primary Phone');
        }
        if (alternate) {
          data.alternatePhone = alternate;
          data.confidenceFields.push('Alternate Phone');
        }

        // 5. Contact Person / Owner (Strict zero-hallucination validation)
        const owner = extractContactPerson(searchHtml, data.companyName);
        if (owner) {
          data.contactName = owner;
          data.confidenceFields.push(`Owner: ${owner}`);
        }

        // 6. Location / Address (if not found from Google Maps)
        if (!data.location) {
          const pinMatch = searchHtml.match(/(?:📍|📌)\s*([A-Za-z0-9\s,–-]+?)(?=[|•\n\r"&<]|$)/i);
          if (pinMatch && pinMatch[1]) {
            const loc = cleanLocationString(pinMatch[1]);
            if (loc) {
              data.location = loc;
              data.confidenceFields.push('Location');
            }
          } else {
            for (const city of CITIES) {
              const cityRegex = new RegExp(`(?:in|at|near|location|address)\\s+([A-Za-z0-9\\s,–-]*${city}[A-Za-z0-9\\s,–-]*)`, 'i');
              const m = searchHtml.match(cityRegex);
              if (m && m[1]) {
                const parts = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').split(/[,–|•]/).map((p) => p.trim()).filter(Boolean);
                if (parts.length > 0) {
                  const loc = cleanLocationString(parts.slice(0, 2).join(', '));
                  if (loc) {
                    data.location = loc;
                    data.confidenceFields.push('Location');
                    break;
                  }
                }
              }
            }
          }
        }

        // 7. Rating & Review Count (Ignores 0.0 unrated entries)
        const ratingMatch =
          searchHtml.match(/Rated\s*([1-5](?:\.\d)?)\s*based on\s*([1-9]\d*)\s*Customer Reviews/i) ||
          searchHtml.match(/([1-5]\.\d)\s*(?:\/5|stars|★|\s*rating)[^\d]*([1-9]\d*)\s*(?:reviews|votes|ratings)/i) ||
          searchHtml.match(/Rating:\s*([1-5]\.\d)[^\d]*([1-9]\d*)\s*reviews/i) ||
          searchHtml.match(/Rated\s*([1-5]\.\d)\/5[^\d]*([1-9]\d*)\s*Ratings/i) ||
          searchHtml.match(/([1-5]\.\d)\s*(?:\d\.\d)?\s*\(([1-9]\d*)\s*(?:ratings|reviews|votes)\)/i) ||
          searchHtml.match(/([1-5]\.\d)\s*(?:\/5|★|stars)/i);

        if (ratingMatch && parseFloat(ratingMatch[1]) > 0) {
          data.rating = parseFloat(ratingMatch[1]);
          if (ratingMatch[2] && parseInt(ratingMatch[2], 10) > 0) {
            data.reviewCount = parseInt(ratingMatch[2], 10);
            data.confidenceFields.push(`Rating: ${data.rating} (${data.reviewCount} Reviews)`);
            data.notes = `Rated ${data.rating}/5.0 (${data.reviewCount} Reviews)`;
          } else {
            data.confidenceFields.push(`Rating: ${data.rating}`);
          }
        }

        // 8. If Instagram handle found, fetch Instagram profile directly to get bio website link & followers!
        if (data.instagram) {
          const igUser = data.instagram.replace(/^@/, '');
          const igProfile = await safeFetchHtml(`https://www.instagram.com/${igUser}/`, 3500);
          if (igProfile && igProfile.html) {
            const descMatch = igProfile.html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) {
              const desc = descMatch[1];
              if (!data.followers) {
                const fMatch = desc.match(/(\d+(?:\.\d+)?[KkMmB]?|\d{1,3}(?:,\d{3})+)\s+Followers/i);
                if (fMatch) {
                  data.followers = fMatch[0].trim();
                  data.confidenceFields.push(data.followers);
                }
              }
              const webMatch = desc.match(/https?:\/\/[^\s,]+/i);
              if (webMatch && webMatch[0] && !isDirectoryUrl(webMatch[0])) {
                data.websiteUrl = webMatch[0];
                data.confidenceFields.push('Website URL');
              }
            }
          }
        }

        // 9. Genuine Business Website from Search
        if (!data.websiteUrl) {
          const allUrls: string[] = [];
          for (const m of searchHtml.matchAll(/\/RU=(https?[^/]+)/gi)) {
            try { allUrls.push(decodeURIComponent(m[1])); } catch {}
          }
          for (const m of searchHtml.matchAll(/class="result__url"[^>]*>([^<]+)/gi)) {
            allUrls.push(m[1].trim());
          }
          for (const m of searchHtml.matchAll(/href=["'](https?:\/\/(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^"']*)["']/gi)) {
            allUrls.push(m[1]);
          }

          for (const raw of allUrls) {
            const clean = raw.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
            if (isLikelyCompanyWebsite(clean, data.companyName) && clean.includes('.') && !isDirectoryUrl(clean)) {
              data.websiteUrl = `https://${clean}`;
              data.confidenceFields.push('Website URL');
              break;
            }
          }
        }

        // 10. If website found, crawl it for Email & direct Phone
        if (data.websiteUrl) {
          const siteData = await scrapeCompanyWebsite(data.websiteUrl);
          if (siteData.email) {
            data.email = siteData.email;
            data.confidenceFields.push('Email');
          }
          if (siteData.phone && !data.phone) {
            data.phone = siteData.phone;
            data.confidenceFields.push('Primary Phone');
          }
          if (siteData.alternatePhone && !data.alternatePhone) {
            data.alternatePhone = siteData.alternatePhone;
            data.confidenceFields.push('Alternate Phone');
          }
          if (siteData.instagram && !data.instagram) {
            data.instagram = siteData.instagram;
            data.confidenceFields.push('Instagram Handle');
          }
          if (siteData.linkedin && !data.linkedin) {
            data.linkedin = siteData.linkedin;
            data.confidenceFields.push('LinkedIn Profile');
          }
          if (siteData.facebook && !data.facebook) {
            data.facebook = siteData.facebook;
            data.confidenceFields.push('Facebook Page');
          }
        }
      }

      // Smart Service Recommendation
      if (!data.websiteUrl || data.websiteUrl.trim() === '') {
        data.hasNoWebsite = true;
        data.suggestedService = 'Web Development';
        data.suggestedServices = ['Web Development'];
        data.confidenceFields.push('No Website (Recommended: Web Development)');
      } else {
        data.hasNoWebsite = false;
        data.suggestedService = 'AI Voice Agent';
        data.suggestedServices = ['AI Voice Agent'];
      }

      // Deduplicate confidence badges
      data.confidenceFields = Array.from(new Set(data.confidenceFields));

      // Store in memory cache
      EXTRACTION_CACHE.set(cacheKey, { data, timestamp: Date.now() });
      return NextResponse.json({ success: true, data });
    }

    // 3. GENERAL BUSINESS WEBSITE
    data.source = 'Website Inbound';
    data.websiteUrl = targetUrl;
    data.confidenceFields.push('Website URL');

    const siteData = await scrapeCompanyWebsite(targetUrl);

    if (siteData.companyName) {
      data.companyName = cleanCompanyName(siteData.companyName);
      data.confidenceFields.push('Company Name');
    }
    if (siteData.email) {
      data.email = siteData.email;
      data.confidenceFields.push('Email');
    }
    if (siteData.phone) {
      data.phone = siteData.phone;
      data.confidenceFields.push('Primary Phone');
    }
    if (siteData.alternatePhone) {
      data.alternatePhone = siteData.alternatePhone;
      data.confidenceFields.push('Alternate Phone');
    }
    if (siteData.instagram) {
      data.instagram = siteData.instagram;
      data.confidenceFields.push('Instagram Handle');
    }
    if (siteData.linkedin) {
      data.linkedin = siteData.linkedin;
      data.confidenceFields.push('LinkedIn Profile');
    }
    if (siteData.twitter) {
      data.twitter = siteData.twitter;
      data.confidenceFields.push('X (Twitter)');
    }
    if (siteData.facebook) {
      data.facebook = siteData.facebook;
      data.confidenceFields.push('Facebook Page');
    }

    if (!data.companyName) {
      try {
        const hostname = new URL(targetUrl).hostname.replace(/^www\./, '');
        const domainBase = hostname.split('.')[0];
        data.companyName = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);
        data.confidenceFields.push('Domain Name');
      } catch {}
    }

    // Smart Service Recommendation
    if (!data.websiteUrl || data.websiteUrl.trim() === '') {
      data.hasNoWebsite = true;
      data.suggestedService = 'Web Development';
      data.suggestedServices = ['Web Development'];
      data.confidenceFields.push('No Website (Recommended: Web Development)');
    } else {
      data.hasNoWebsite = false;
      data.suggestedService = 'AI Voice Agent';
      data.suggestedServices = ['AI Voice Agent'];
    }

    // Deduplicate confidence badges
    data.confidenceFields = Array.from(new Set(data.confidenceFields));

    EXTRACTION_CACHE.set(cacheKey, { data, timestamp: Date.now() });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to extract lead data' }, { status: 500 });
  }
}
