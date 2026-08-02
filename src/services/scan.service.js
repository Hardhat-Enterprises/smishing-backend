// src/services/scan.service.js
const URL_REGEX =
  /\b((https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?|((https?:\/\/)?(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly)\/[^\s]+))\b/gi;

const SUSPICIOUS_KEYWORDS = [
  'verify', 'urgent', 'account locked', 'password', 'bank',
  'click here', 'update now', 'win', 'prize', 'otp', 'reset',
];

function extractUrls(text) {
  const urls = [];
  let m;
  while ((m = URL_REGEX.exec(text)) !== null) {
    urls.push(m[0]);
  }
  return Array.from(new Set(urls));
}

export async function analyzeMessage(message) {
  const urls = extractUrls(message || '');
  const lower = (message || '').toLowerCase();

  // simple signals you can weight later
  let score = 0;
  if (urls.length > 0) score += 0.45;
  if (SUSPICIOUS_KEYWORDS.some(k => lower.includes(k))) score += 0.35;
  if (/[^\x00-\x7F]/.test(message)) score += 0.1; // unicode/homograph hint
  if (/(?:free|gift|limited|now)\b/.test(lower)) score += 0.1;

  // clamp
  const confidence = Math.max(0, Math.min(0.99, score));
  const prediction = confidence >= 0.6 ? 'smishing' : 'safe';

  return {
    prediction,
    confidence,
    urls,
    reasons: {
      hasUrls: urls.length > 0,
      keywordHits: SUSPICIOUS_KEYWORDS.filter(k => lower.includes(k)),
    },
  };
}
