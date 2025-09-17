const URL_REGEX =
  /\b((https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?|((https?:\/\/)?(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly)\/[^\s]+))\b/gi;

const SUSPICIOUS_KEYWORDS = [
  'verify', 'urgent', 'account locked', 'password', 'bank',
  'click here', 'update now', 'win', 'prize', 'otp', 'reset',
];

const HIGH_RISK_DOMAINS = [
  /\.ru$/i,
  /\.cn$/i,
  /login.*\.php/i,
  /secure.*update/i,
];

function extractUrls(text) {
  const urls = [];
  let m;
  while ((m = URL_REGEX.exec(text)) !== null) urls.push(m[0]);
  return Array.from(new Set(urls));
}

export async function analyzeMessage(message) {
  const msg = message || '';
  const lower = msg.toLowerCase();
  const urls = extractUrls(msg);

  let score = 0;
  const reasons = {};

  // URL presence
  if (urls.length > 0) {
    score += 0.45;
    reasons.hasUrls = true;
  }

  // Suspicious keywords
  const hits = SUSPICIOUS_KEYWORDS.filter(k => lower.includes(k));
  if (hits.length > 0) {
    score += 0.35;
    reasons.keywordHits = hits;
  }

  // Common scammy words
  if (/(?:free|gift|limited|now)\b/.test(lower)) {
    score += 0.1;
    reasons.marketingTrigger = true;
  }

  // Regex-based domain risk
  const domainHits = urls.filter(url =>
    HIGH_RISK_DOMAINS.some(rx => rx.test(url))
  );
  if (domainHits.length > 0) {
    score += 0.2;
    reasons.highRiskDomains = domainHits;
  }

  const confidence = Math.max(0, Math.min(0.99, score));
  const prediction = confidence >= 0.6 ? 'smishing' : 'safe';

  return {
    prediction,
    confidence,
    urls,
    reasons,
  };
}
