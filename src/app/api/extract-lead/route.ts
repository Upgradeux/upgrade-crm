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

// Regex helpers
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const IN_MOBILE_REGEX = /(?:\+91[\s-]?)?[6789]\d{4}[\s-]?\d{5}\b/g;
const IN_LANDLINE_REGEX = /\b0\d{2,4}[-\s]?\d{6,8}\b/g;
const US_PHONE_REGEX = /\b(?:\+1[-. ]?)?\(?[2-9]\d{2}\)?[-. ]?[2-9]\d{2}[-. ]?\d{4}\b/g;
const UK_PHONE_REGEX = /\b(?:\+44|0)[1-9]\d{8,9}\b/g;

const IG_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/i;
const LI_URL_REGEX = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i;
const TW_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i;
const FB_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:p\/|people\/|pages\/)?([a-zA-Z0-9.\-_]{3,50})/i;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
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
  'loreal.', 'lorealprofessionnel.', 'kerastase.', 'schwarzkopf.', 'matrixprofessional.', 'wella.', 'olaplex.', 'aveda.'
];

function isDirectoryUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return DIRECTORY_DOMAINS.some((d) => lower.includes(d));
}

const KNOWN_INVALID_NAMES = new Set([
  'address at', 'google search', 'view profile', 'contact us', 'privacy policy', 'terms of service',
  'instagram photo', 'facebook post', 'see more', 'sign up', 'log in', 'directors', 'founders', 'proprietors',
  'salon muah', 'beauty salon', 'hair salon', 'ltd', 'pvt ltd', 'partnership', 'company profile', 'gst number',
  'mumbai', 'maharashtra', 'india', 'bandra west', 'new york', 'london', 'duckduckgo', 'justdial', 'asklaila',
  'locobiz', 'worldplaces', 'nearbuy', 'wedmegood', 'at duckduckgo', 'duckduckgo feedback', 'home', 'about',
  'services', 'pricing', 'reviews', 'photos', 'videos', 'locations'
]);

const CITIES = [
  'Mumbai', 'Navi Mumbai', 'Thane', 'Bandra', 'Andheri', 'Juhu', 'Worli', 'Colaba', 'Borivali', 'Powai', 'Dadar', 'Khar', 'Santacruz', 'Goregaon', 'Malad',
  'Delhi', 'New Delhi', 'Gurgaon', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad',
  'Bengaluru', 'Bangalore', 'Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Jayanagar',
  'Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli', 'Jubilee Hills', 'Banjara Hills',
  'Pune', 'Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner', 'Kalyani Nagar', 'Wakad', 'Aundh',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Kochi', 'Goa', 'Chandigarh',
  'London', 'Manchester', 'Birmingham', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Austin', 'San Francisco', 'Miami', 'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Dubai', 'Abu Dhabi', 'Singapore'
];

function isLikelyCompanyWebsite(rawUrl: string, companyName: string): boolean {
  if (!rawUrl || isDirectoryUrl(rawUrl)) return false;
  const domain = rawUrl.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const nameParts = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((p) => p.length > 2);
  if (nameParts.length === 0) return true;
  // If domain matches any significant part of company name or brand
  return nameParts.some((part) => domain.includes(part));
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

async function safeFetchHtml(url: string, timeoutMs = 8000): Promise<{ html: string; finalUrl: string } | null> {
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
  'all rights reserved', 'privacy policy', 'terms', 'help', 'search', 'view'
]);

// Clean address string to concise "Area, City"
function cleanLocationString(raw: string): string {
  if (!raw) return '';
  let clean = raw
    .replace(/\s*(?:[-–|•]\s*(?:AskLaila|Locobiz|Justdial|WedMeGood|D&B|Facebook|Instagram|LinkedIn|India|IndiaMART|Sulekha|Zomato|Swiggy|Google|Reviews|Ratings|Website|Contact|WorldPlaces|HealthFrog|Nearbuy)).*$/gi, '')
    .replace(/^https?:\/\/[^\s]+/i, '')
    .replace(/\b(?:Opposite|Opp|Near|Behind|Beside|Sector-\d+|Shop No \d+|Floor \d+|Plot No \d+)\b[^\n,)]*/gi, '')
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
    // Prioritize Area and City
    const cityIdx = parts.findIndex((p) => CITIES.some((c) => p.toLowerCase().includes(c.toLowerCase())));
    if (cityIdx > 0) {
      clean = `${parts[cityIdx - 1]}, ${parts[cityIdx]}`;
    } else if (cityIdx === 0 && parts.length > 1) {
      clean = `${parts[0]}, ${parts[1]}`;
    } else {
      clean = parts.slice(-2).join(', ');
    }
  }

  // If contains Bandra / Khar / Andheri without City
  if (/Bandra/i.test(clean) && !/Mumbai/i.test(clean)) {
    clean = `${clean}, Mumbai`;
  } else if (/Koramangala|Indiranagar|Whitefield|HSR/i.test(clean) && !/Bangalore|Bengaluru/i.test(clean)) {
    clean = `${clean}, Bangalore`;
  } else if (/Gurgaon|Gurugram|Noida/i.test(clean) && !/Delhi|NCR/i.test(clean)) {
    clean = `${clean}, Delhi NCR`;
  }

  return clean.replace(/\s*,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
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

// Extract phone numbers
function extractPhoneNumbers(html: string): { primary?: string; alternate?: string } {
  const candidates: string[] = [];

  // 1. Indian Mobile (+91 or standard 10 digits starting 6,7,8,9)
  for (const m of html.matchAll(IN_MOBILE_REGEX)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))) {
      const clean = digits.length === 12 ? `+${digits}` : cleanIndianMobile(digits);
      if (!candidates.includes(clean)) candidates.push(clean);
    }
  }

  // 2. Indian Landlines with STD code (e.g. 022-26401234)
  for (const m of html.matchAll(IN_LANDLINE_REGEX)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 11) {
      const std = m[0].trim();
      if (!candidates.includes(std)) candidates.push(std);
    }
  }

  // 3. US & UK Phone Numbers
  for (const m of html.matchAll(US_PHONE_REGEX)) {
    const val = m[0].trim();
    if (!candidates.includes(val)) candidates.push(val);
  }
  for (const m of html.matchAll(UK_PHONE_REGEX)) {
    const val = m[0].trim();
    if (!candidates.includes(val)) candidates.push(val);
  }

  // Filter out any known invalid number sequences
  const valid = candidates.filter((p) => {
    const d = p.replace(/\D/g, '');
    return d !== '1234567890' && d !== '0000000000' && !p.includes('2024') && !p.includes('2025') && !p.includes('2026');
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

// Extract Owner / Contact person
function extractContactPerson(html: string, companyName: string): string | undefined {
  // Check LinkedIn URL slug (e.g. in.linkedin.com/in/ryan-d-rozario-0524ab169)
  const liSlugMatch = html.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (liSlugMatch && liSlugMatch[1]) {
    const slug = liSlugMatch[1].replace(/-\d+[a-z0-9]*$/i, '').replace(/[-_]/g, ' ');
    const words = slug.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if (words.length >= 2 && words.length <= 3) {
      const potentialName = words.join(' ');
      if (!KNOWN_INVALID_NAMES.has(potentialName.toLowerCase())) {
        return potentialName;
      }
    }
  }

  // Check LinkedIn Title (e.g. "Ryan D'Rozario - Salon Muah | LinkedIn")
  const liTitleMatch = html.match(/([A-Z][a-z]+(?:\s+[A-Z]['’]?[A-Za-z]+)+)\s*[-–—|]\s*(?:Owner|Director|Founder|Co-Founder|Proprietor|Managing Director|Lead|Stylist|Doctor|Principal|Creative Director|CEO)?\s*[-–—|]?\s*(?:[A-Za-z0-9\s]+)?\|\s*LinkedIn/i);
  if (liTitleMatch && liTitleMatch[1]) {
    const name = liTitleMatch[1].trim();
    if (!KNOWN_INVALID_NAMES.has(name.toLowerCase()) && !name.toLowerCase().includes(companyName.toLowerCase())) {
      return name;
    }
  }

  // Check Director / Founder text
  const dirMatch = html.match(/(?:Director|Directors|Founder|Founders|Owner|Owners|Proprietor|Proprietors)\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)?(?:\s+[A-Z]['’]?[A-Za-z]+)?)/i);
  if (dirMatch && dirMatch[1]) {
    const name = dirMatch[1].replace(/and/gi, '&').trim();
    if (!KNOWN_INVALID_NAMES.has(name.toLowerCase()) && !name.toLowerCase().includes(companyName.toLowerCase()) && name.length > 3 && name.length < 35) {
      return name;
    }
  }

  return undefined;
}

// Multi-engine search helper
async function multiSearchEnrichment(queries: string[]): Promise<string> {
  const pages: string[] = [];

  for (const q of queries) {
    // 1. DuckDuckGo HTML
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=wt-wt`, {
        headers: BROWSER_HEADERS,
      });
      if (res.ok) {
        const text = await res.text();
        pages.push(text);
      }
    } catch {}

    // 2. Yahoo Search Fallback
    try {
      const res = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(q)}&nojs=1`, {
        headers: BROWSER_HEADERS,
      });
      if (res.ok) {
        const text = await res.text();
        pages.push(text);
      }
    } catch {}
  }

  return pages.join('\n');
}

// Scrape business website
async function scrapeCompanyWebsite(websiteUrl: string): Promise<Partial<ExtractedLeadData>> {
  const result: Partial<ExtractedLeadData> = {};
  if (!websiteUrl || isDirectoryUrl(websiteUrl)) {
    return result;
  }

  const fetched = await safeFetchHtml(websiteUrl, 5000);
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
    const username = igMatch[1].toLowerCase();
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
      const igUrlMatch = rawInput.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
      if (igUrlMatch && igUrlMatch[1]) {
        username = igUrlMatch[1].replace(/[/?#].*$/, '');
      }

      data.instagram = `@${username}`;
      data.source = 'Instagram';
      data.confidenceFields.push('Instagram Handle');

      // Fetch public profile and search enrichment
      const [igFetched, searchHtml] = await Promise.all([
        safeFetchHtml(`https://www.instagram.com/${username}/`, 5000),
        multiSearchEnrichment([
          `instagram ${username} phone email contact address`,
          `${username} Mumbai Delhi London New York`,
        ]),
      ]);

      if (igFetched && igFetched.html) {
        const { html } = igFetched;

        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          const rawTitle = decodeHtmlEntities(ogTitleMatch[1]);
          const namePart = rawTitle.split(/\(@|\s*•\s*Instagram|\s*on Instagram/i)[0].trim();
          if (namePart && namePart.toLowerCase() !== username.toLowerCase()) {
            data.companyName = namePart;
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
          const igFollowers = searchHtml.match(/(\d+(?:\.\d+)?[KkMmB]?|\d{1,3}(?:,\d{3})+)\s+Followers/i);
          if (igFollowers && igFollowers[0]) {
            data.followers = igFollowers[0].trim();
            data.confidenceFields.push(data.followers);
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

      const fetched = await safeFetchHtml(targetUrl, 7000);
      let resolvedUrl = targetUrl;
      const mapsHtml = fetched?.html || '';

      if (fetched) {
        resolvedUrl = fetched.finalUrl || targetUrl;
      }

      // 1. Extract from /maps/place/<Name, Address>/
      const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@?]+)/i);
      if (placeMatch && placeMatch[1]) {
        const rawPlace = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        const parts = rawPlace.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          data.companyName = parts[0];
          data.location = cleanLocationString(parts.slice(1).join(', '));
          data.confidenceFields.push('Business Name');
          if (data.location) data.confidenceFields.push('Location');
        } else if (parts.length === 1) {
          data.companyName = parts[0];
          data.confidenceFields.push('Business Name');
        }
      }

      // 2. Extract from /maps/search/<Name+Location>/
      if (!data.companyName) {
        const searchMatch = resolvedUrl.match(/\/maps\/search\/([^/@?]+)/i);
        if (searchMatch && searchMatch[1]) {
          const rawSearch = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
          const parts = rawSearch.split(',').map((p) => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            data.companyName = parts[0];
            data.location = cleanLocationString(parts.slice(1).join(', '));
            data.confidenceFields.push('Business Name');
            if (data.location) data.confidenceFields.push('Location');
          } else {
            data.companyName = rawSearch;
            data.confidenceFields.push('Business Name');
          }
        }
      }

      // 3. Extract from query params (q=Name or query=Name)
      if (!data.companyName || !data.location) {
        try {
          const parsed = new URL(resolvedUrl);
          const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('query');
          if (qParam && !qParam.toLowerCase().includes('google search')) {
            const qClean = qParam.replace(/\+/g, ' ').trim();
            const parts = qClean.split(',').map((p) => p.trim()).filter(Boolean);
            if (parts.length > 1) {
              if (!data.companyName) data.companyName = parts[0];
              if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', '));
              data.confidenceFields.push('Business Name');
              if (data.location) data.confidenceFields.push('Location');
            } else if (!data.companyName) {
              data.companyName = qClean;
              data.confidenceFields.push('Business Name');
            }
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
            if (!data.companyName) data.companyName = parts[0];
            if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', ').replace(/\s*Google Maps\s*/i, ''));
            if (data.location && !data.confidenceFields.includes('Location')) data.confidenceFields.push('Location');
          }
        }

        const titleMatch = mapsHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const cleanTitle = decodeHtmlEntities(titleMatch[1]).replace(/\s*-\s*Google Maps\s*$/i, '').trim();
          const parts = cleanTitle.split(/[-–·•]/).map((p) => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            if (!data.companyName) data.companyName = parts[0];
            if (!data.location) data.location = cleanLocationString(parts.slice(1).join(', '));
            if (data.location && !data.confidenceFields.includes('Location')) data.confidenceFields.push('Location');
          } else if (!data.companyName) {
            data.companyName = cleanTitle;
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
              data.companyName = potentialName;
              data.location = cleanLocationString(potentialLoc);
              if (data.location) data.confidenceFields.push('Location');
              break;
            }
          }
        }
      }

      // If we have the company name, execute multi-search enrichment
      if (data.companyName) {
        data.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.companyName)}`;

        const searchHtml = await multiSearchEnrichment([
          `${data.companyName} ${data.location || ''} phone instagram contact owner address`,
          `${data.companyName} Mumbai Bandra Delhi Bangalore New York London`,
          `${data.companyName} website official`,
        ]);

        // 1. Instagram Handle
        const igMatches = [...searchHtml.matchAll(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/gi)];
        for (const m of igMatches) {
          const handle = m[1].replace(/[/?#].*$/, '').toLowerCase();
          if (!['p', 'reel', 'explore', 'stories', 'tv', 'about', 'tags', 'accounts', 'developer', 'directory', 'salon'].includes(handle)) {
            data.instagram = `@${handle}`;
            data.confidenceFields.push('Instagram Handle');
            break;
          }
        }

        // 2. LinkedIn Profile / Company
        const liMatches = [...searchHtml.matchAll(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9_-]+)/gi)];
        for (const m of liMatches) {
          const full = m[0].startsWith('http') ? m[0] : `https://${m[0]}`;
          if (!full.includes('/pulse/') && !full.includes('/posts/') && !full.includes('/jobs/')) {
            data.linkedin = full;
            data.confidenceFields.push('LinkedIn Profile');
            break;
          }
        }

        // 3. Facebook Page
        const fbMatches = [...searchHtml.matchAll(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:p\/|people\/|pages\/)?([a-zA-Z0-9.\-_]{3,50})/gi)];
        for (const m of fbMatches) {
          const id = m[1].toLowerCase();
          if (!['login', 'share', 'help', 'privacy', 'terms', 'recover', 'dialog'].includes(id)) {
            data.facebook = `https://www.facebook.com/${m[1]}`;
            data.confidenceFields.push('Facebook Page');
            break;
          }
        }

        // 4. Primary & Alternate Phone Numbers
        const { primary, alternate } = extractPhoneNumbers(searchHtml);
        if (primary) {
          data.phone = primary;
          data.confidenceFields.push('Primary Phone');
        }
        if (alternate) {
          data.alternatePhone = alternate;
          data.confidenceFields.push('Alternate Phone');
        }

        // 5. Contact Person / Owner
        const owner = extractContactPerson(searchHtml, data.companyName);
        if (owner) {
          data.contactName = owner;
          data.confidenceFields.push(`Owner: ${owner}`);
        }

        // 6. Location / Address
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

        // 7. Rating & Review Count
        const ratingMatch =
          searchHtml.match(/(\d\.\d)\s*(?:\/5|stars|★|\s*rating)[^\d]*(\d+)\s*(?:reviews|votes|ratings)/i) ||
          searchHtml.match(/Rating:\s*(\d\.\d)[^\d]*(\d+)\s*reviews/i) ||
          searchHtml.match(/Rated\s*(\d\.\d)\/5[^\d]*(\d+)\s*Ratings/i) ||
          searchHtml.match(/(\d\.\d)\s*(?:\d\.\d)?\s*\((\d+)\s*(?:ratings|reviews|votes)\)/i) ||
          searchHtml.match(/(\d\.\d)\s*(?:\/5|★|stars)/i);

        if (ratingMatch) {
          data.rating = parseFloat(ratingMatch[1]);
          if (ratingMatch[2]) {
            data.reviewCount = parseInt(ratingMatch[2], 10);
            data.confidenceFields.push(`Rating: ${data.rating} (${data.reviewCount} Reviews)`);
            data.notes = `Rated ${data.rating}/5.0 (${data.reviewCount} Reviews)`;
          } else {
            data.confidenceFields.push(`Rating: ${data.rating}`);
          }
        }

        // Followers (from Instagram or Social presence)
        const followerMatch = searchHtml.match(/(\d+(?:\.\d+)?[KkMmB]?|\d{1,3}(?:,\d{3})+)\s+Followers/i);
        if (followerMatch && followerMatch[0]) {
          data.followers = followerMatch[0].trim();
          data.confidenceFields.push(data.followers);
        }

        // 8. Genuine Business Website
        const allUrls = [...searchHtml.matchAll(/class="result__url"[^>]*>([^<]+)/gi)].map((m) => m[1].trim());
        for (const raw of allUrls) {
          const clean = raw.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
          if (isLikelyCompanyWebsite(clean, data.companyName) && clean.includes('.')) {
            data.websiteUrl = `https://${clean}`;
            data.confidenceFields.push('Website URL');
            break;
          }
        }

        // If website found, crawl it for email
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

      return NextResponse.json({ success: true, data });
    }

    // 3. GENERAL BUSINESS WEBSITE
    data.source = 'Website Inbound';
    data.websiteUrl = targetUrl;
    data.confidenceFields.push('Website URL');

    const siteData = await scrapeCompanyWebsite(targetUrl);

    if (siteData.companyName) {
      data.companyName = siteData.companyName;
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

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to extract lead data' }, { status: 500 });
  }
}
