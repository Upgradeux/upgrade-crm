export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency?: string): string {
  let curr = currency;
  if (!curr && typeof window !== 'undefined') {
    try {
      curr = localStorage.getItem('upgradeux_crm_currency_v3') || 'INR (₹)';
    } catch {}
  }
  if (!curr) curr = 'INR (₹)';

  const currCode =
    curr.includes('INR') || curr.includes('₹')
      ? 'INR'
      : curr.includes('EUR') || curr.includes('€')
      ? 'EUR'
      : curr.includes('GBP') || curr.includes('£')
      ? 'GBP'
      : curr.includes('AED')
      ? 'AED'
      : 'USD';

  const locale = currCode === 'INR' ? 'en-IN' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currCode,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    const symbol = currCode === 'INR' ? '₹' : currCode === 'EUR' ? '€' : currCode === 'GBP' ? '£' : '$';
    return `${symbol}${amount?.toLocaleString() || 0}`;
  }
}

export function formatDate(isoString: string, timezone?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  let tz = timezone;
  if (!tz && typeof window !== 'undefined') {
    try {
      tz = localStorage.getItem('upgradeux_crm_timezone_v3') || 'Asia/Kolkata (IST)';
    } catch {}
  }
  if (!tz) tz = 'Asia/Kolkata (IST)';

  const timeZoneName = tz.includes('Kolkata')
    ? 'Asia/Kolkata'
    : tz.includes('New_York')
    ? 'America/New_York'
    : tz.includes('Los_Angeles')
    ? 'America/Los_Angeles'
    : tz.includes('London')
    ? 'Europe/London'
    : tz.includes('Dubai')
    ? 'Asia/Dubai'
    : undefined;

  const locale = tz.includes('Kolkata') ? 'en-IN' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      timeZone: timeZoneName,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Never contacted';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Never contacted';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 3) return `${diffDays}d ago`;
  if (diffDays <= 7) return `${diffDays}d ago (Follow-up due)`;
  return `${diffDays}d ago (Overdue)`;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getInitials(name: string): string {
  if (!name) return 'UX';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getDomainFromUrl(url: string): string {
  if (!url) return '';
  try {
    const formatted = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(formatted).hostname.replace(/^www\./, '');
    return domain;
  } catch {
    return url;
  }
}

export function getGoogleMapsUrl(lead: { mapsUrl?: string; socials?: { maps?: string }; companyName: string; location?: string }): string {
  if (lead.mapsUrl) return lead.mapsUrl;
  if (lead.socials?.maps) return lead.socials.maps;
  const query = `${lead.companyName} ${lead.location || ''}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getTwitterUrl(urlOrHandle: string): string {
  if (!urlOrHandle) return '';
  if (urlOrHandle.startsWith('http')) return urlOrHandle;
  const clean = urlOrHandle.replace(/^@/, '');
  return `https://x.com/${clean}`;
}

export function formatTwitterHandle(urlOrHandle: string): string {
  if (!urlOrHandle) return '';
  if (urlOrHandle.startsWith('http')) {
    const parts = urlOrHandle.split('/').filter(Boolean);
    const handle = parts[parts.length - 1];
    return handle.startsWith('@') ? handle : `@${handle}`;
  }
  return urlOrHandle.startsWith('@') ? urlOrHandle : `@${urlOrHandle}`;
}
