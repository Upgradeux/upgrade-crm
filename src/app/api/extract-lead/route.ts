import { NextRequest, NextResponse } from 'next/server';
import { ServiceType } from '@/types/crm';

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
  source?: 'Google Maps' | 'Instagram' | 'Website Inbound' | 'LinkedIn' | 'Cold Email' | 'Other';
  suggestedService?: ServiceType;
  suggestedServices?: ServiceType[];
  hasNoWebsite?: boolean;
  notes?: string;
  confidenceFields: string[];
}

// Regex helpers
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?91|0)?[ -]?[6789]\d{9}|(?:\+?1[-. ]?)?\(?[2-9]\d{2}\)?[-. ]?\d{3}[-. ]?\d{4}/g;
const IG_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i;
const LI_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i;
const TW_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i;

const COMMON_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function safeFetchHtml(url: string, timeoutMs = 6000): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      headers: {
        'User-Agent': COMMON_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
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

// Comprehensive directory list to NEVER mistake for a company's actual website
const DIRECTORY_DOMAINS = [
  'google.',
  'instagram.',
  'facebook.',
  'justdial.',
  'cybo.',
  'youtube.',
  'linkedin.',
  'twitter.',
  'x.com',
  'yelp.',
  'tripadvisor.',
  'wikipedia.',
  'mapquest.',
  'sulekha.',
  'indiamart.',
  'bharatbz.',
  'magicpin.',
  'yellowpages.',
  'zomato.',
  'swiggy.',
  'nearbuy.',
  'fresha.',
  'setmore.',
  'treatwell.',
  'dnb.',
  'zaubacorp.',
  'tring.',
  'zenoti.',
  'lbb.',
  'jdmagicbox.',
  'tradeindia.',
  'panchsheel.',
  'dialme.',
  'vymaps.',
  'nicelocal.',
  'addressguru.',
  'businesslist.',
  'cylex.',
  'truelocal.',
  'hotfrog.',
  'brownbook.',
];

function isDirectoryUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return DIRECTORY_DOMAINS.some((d) => lower.includes(d));
}

// Clean address string to concise "Area, City"
function cleanLocationString(raw: string): string {
  if (!raw) return '';
  // Remove business name repeats and extra junk
  let clean = raw
    .replace(/^https?:\/\/[^\s]+/i, '')
    .replace(/^(Navi-Mumbai|Mumbai|Delhi|Bangalore|Pune|Austin|London|New-York)\//i, '')
    .replace(/\b(Opposite|Opp|Near|Behind|Beside|Sector-\d+|Shop No|Floor)\b[^\n,)]*/gi, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If still long, take the primary 2-3 words
  if (clean.length > 35) {
    const parts = clean.split(/[,()]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      clean = parts.slice(0, 2).join(', ');
    }
  }
  return clean;
}

// Extract clean emails
function extractCleanEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.js', '.css'];
  const invalidKeywords = ['sentry', 'example', 'wixpress', 'schema.org', 'domain.com', 'email.com', 'polyfill', 'user@'];

  const cleaned = matches
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      if (invalidExtensions.some((ext) => e.endsWith(ext))) return false;
      if (invalidKeywords.some((kw) => e.includes(kw))) return false;
      return true;
    });

  return Array.from(new Set(cleaned));
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
    const phoneMatches = html.match(PHONE_REGEX);
    if (phoneMatches && phoneMatches.length > 0) {
      result.phone = phoneMatches[0].trim();
    }
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

  return result;
}

// Search DuckDuckGo open web for business enrichment
async function searchWebForBusiness(query: string): Promise<Partial<ExtractedLeadData>> {
  const result: Partial<ExtractedLeadData> = {};
  try {
    const ddgRes = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' phone instagram contact owner')}`,
      {
        headers: { 'User-Agent': COMMON_USER_AGENT },
      }
    );
    if (!ddgRes.ok) return result;

    const ddgHtml = await ddgRes.text();

    // Instagram handle
    const igMatch = ddgHtml.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
    if (igMatch && igMatch[1]) {
      const user = igMatch[1].replace(/[/?#].*$/, '').toLowerCase();
      if (!['p', 'reel', 'explore', 'stories', 'tv', 'about', 'tags'].includes(user)) {
        result.instagram = `@${user}`;
      }
    }

    // LinkedIn
    const liMatch = ddgHtml.match(/linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i);
    if (liMatch && liMatch[0]) {
      result.linkedin = `https://${liMatch[0]}`;
    }

    // Direct Website (strictly filter directories)
    const allUrls = [...ddgHtml.matchAll(/class="result__url"[^>]*>([^<]+)/gi)].map((m) => m[1].trim());
    for (const rawUrl of allUrls) {
      const clean = rawUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
      if (!isDirectoryUrl(clean) && clean.includes('.')) {
        result.websiteUrl = `https://${clean}`;
        break;
      }
    }

    // Facebook Profile
    const fbMatch = ddgHtml.match(/facebook\.com\/(?:p\/|people\/|pages\/)?([a-zA-Z0-9.\-_]{3,50})/i);
    if (fbMatch && fbMatch[0] && !fbMatch[0].includes('login') && !fbMatch[0].includes('share')) {
      result.facebook = `https://www.${fbMatch[0].replace(/^https?:\/\//, '').replace(/^www\./, '')}`;
    }

    // Phone numbers from search snippets (Main + Alternate)
    const phoneMatches = ddgHtml.match(PHONE_REGEX) || [];
    const validPhones = Array.from(
      new Set(phoneMatches.filter((p) => !p.startsWith('000') && p.replace(/\D/g, '').length >= 10))
    );
    if (validPhones.length > 0) {
      result.phone = validPhones[0].trim();
      if (validPhones.length > 1) {
        result.alternatePhone = validPhones[1].trim();
      }
    }

    // Rating & Reviews from Google / Justdial / Local snippets
    const ratingMatch =
      ddgHtml.match(/(\d\.\d)\s*(?:\/5|stars|★|\s*rating)[^\d]*(\d+)\s*(?:reviews|votes|ratings)/i) ||
      ddgHtml.match(/Rating:\s*(\d\.\d)[^\d]*(\d+)\s*reviews/i) ||
      ddgHtml.match(/Rated\s*(\d\.\d)\/5[^\d]*(\d+)\s*Ratings/i) ||
      ddgHtml.match(/(\d\.\d)\s*stars[^\d]*(\d+)\s*reviews/i);

    if (ratingMatch) {
      result.rating = parseFloat(ratingMatch[1]);
      result.reviewCount = parseInt(ratingMatch[2], 10);
    }

    // Location / Address from local business listings
    const jdMatch = ddgHtml.match(/justdial\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/i);
    if (jdMatch && jdMatch[1]) {
      const city = jdMatch[1].replace(/-/g, ' ');
      const rawArea = jdMatch[2].replace(/-/g, ' ');
      const area = rawArea.split(' ').slice(-3).join(' '); // Keep concise area
      result.location = `${area}, ${city}`;
    }

    // Contact Person / Owner Detection
    const ownerMatch =
      ddgHtml.match(/(?:Owner|Proprietor|Founder|Key Person|Manager|Dr\.|Mr\.|Ms\.)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
      ddgHtml.match(/(?:owned by|founded by|managed by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);

    const invalidNames = ['Instagram', 'Facebook', 'Google', 'Justdial', 'Navi', 'Mumbai', 'DuckDuckGo', 'Feedback', 'Privacy', 'About', 'Help', 'Terms', 'Settings', 'Search', 'All'];
    if (ownerMatch && ownerMatch[1] && !invalidNames.some(inv => ownerMatch[1].toLowerCase().includes(inv.toLowerCase()))) {
      result.contactName = ownerMatch[1].trim();
    }
  } catch {}

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
      const [igFetched, webEnrich] = await Promise.all([
        safeFetchHtml(`https://www.instagram.com/${username}/`, 5000),
        searchWebForBusiness(username),
      ]);

      if (igFetched && igFetched.html) {
        const { html } = igFetched;

        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          const rawTitle = ogTitleMatch[1];
          const namePart = rawTitle.split(/\(@/)[0].trim();
          if (namePart && namePart !== username) {
            data.companyName = namePart;
            data.confidenceFields.push('Company / Name');
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

          const phoneMatches = desc.match(PHONE_REGEX);
          if (phoneMatches && phoneMatches.length > 0) {
            data.phone = phoneMatches[0].trim();
            data.confidenceFields.push('Phone');
          }

          const linkMatch = desc.match(/https?:\/\/[^\s,]+/i);
          if (linkMatch && linkMatch[0] && !linkMatch[0].includes('instagram.com')) {
            data.websiteUrl = linkMatch[0];
            data.confidenceFields.push('Website URL');
          }
        }
      }

      // Merge web search enrichment if missing fields
      if (!data.companyName && webEnrich.companyName) {
        data.companyName = webEnrich.companyName;
        data.confidenceFields.push('Company Name');
      }
      if (!data.phone && webEnrich.phone) {
        data.phone = webEnrich.phone;
        data.confidenceFields.push('Phone');
      }
      if (!data.location && webEnrich.location) {
        data.location = webEnrich.location;
        data.confidenceFields.push('Location');
      }
      if (!data.websiteUrl && webEnrich.websiteUrl) {
        data.websiteUrl = webEnrich.websiteUrl;
        data.confidenceFields.push('Website');
      }

      if (!data.companyName) {
        data.companyName = username;
        data.confidenceFields.push('Username');
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

      const fetched = await safeFetchHtml(targetUrl, 6000);
      let resolvedUrl = targetUrl;

      if (fetched) {
        resolvedUrl = fetched.finalUrl || targetUrl;
      }

      // Extract Company Name from query params (q=Name or query=Name)
      try {
        const parsed = new URL(resolvedUrl);
        const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('query');
        if (qParam && !qParam.toLowerCase().includes('google search')) {
          data.companyName = qParam.replace(/\+/g, ' ').trim();
          data.confidenceFields.push('Business Name');
        }
      } catch {}

      // Extract Company Name from /maps/place/<Name>/
      if (!data.companyName) {
        const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@?]+)/i);
        if (placeMatch && placeMatch[1]) {
          data.companyName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
          data.confidenceFields.push('Business Name');
        }
      }

      // If we have the company name, enrich with fast search
      if (data.companyName) {
        data.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.companyName)}`;

        const webEnrich = await searchWebForBusiness(data.companyName);

        if (webEnrich.instagram) {
          data.instagram = webEnrich.instagram;
          data.confidenceFields.push('Instagram');
        }
        if (webEnrich.linkedin) {
          data.linkedin = webEnrich.linkedin;
          data.confidenceFields.push('LinkedIn');
        }
        if (webEnrich.phone) {
          data.phone = webEnrich.phone;
          data.confidenceFields.push('Phone');
        }
        if (webEnrich.location) {
          data.location = webEnrich.location;
          data.confidenceFields.push('Location');
        }
        if (webEnrich.websiteUrl) {
          data.websiteUrl = webEnrich.websiteUrl;
          data.confidenceFields.push('Website');

          // Crawl website for email
          const siteData = await scrapeCompanyWebsite(webEnrich.websiteUrl);
          if (siteData.email) {
            data.email = siteData.email;
            data.confidenceFields.push('Email');
          }
          if (siteData.phone && !data.phone) {
            data.phone = siteData.phone;
            data.confidenceFields.push('Phone');
          }
        }

        if (webEnrich.rating) {
          data.rating = webEnrich.rating;
          data.reviewCount = webEnrich.reviewCount;
          data.confidenceFields.push(`★ ${data.rating} (${data.reviewCount} Reviews)`);
        }
        if (webEnrich.facebook) {
          data.facebook = webEnrich.facebook;
          data.confidenceFields.push('Facebook');
        }
        if (webEnrich.alternatePhone) {
          data.alternatePhone = webEnrich.alternatePhone;
          data.confidenceFields.push('Alt Phone');
        }
        if (webEnrich.contactName && !data.contactName) {
          data.contactName = webEnrich.contactName;
          data.confidenceFields.push(`Owner: ${data.contactName}`);
        }

        if (data.rating) {
          data.notes = `Rated ${data.rating}/5.0 (${data.reviewCount || 0}+ Reviews)`;
        }
      }

      // Smart Service Recommendation (ONLY Web Development when no website, NO random extras)
      if (!data.websiteUrl || data.websiteUrl.trim() === '') {
        data.hasNoWebsite = true;
        data.suggestedService = 'Web Development';
        data.suggestedServices = ['Web Development'];
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
      data.confidenceFields.push('Phone');
    }
    if (siteData.instagram) {
      data.instagram = siteData.instagram;
      data.confidenceFields.push('Instagram');
    }
    if (siteData.linkedin) {
      data.linkedin = siteData.linkedin;
      data.confidenceFields.push('LinkedIn');
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

    // Smart Service Recommendation (Strict single default)
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
