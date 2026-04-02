export interface MessageSafetyAnalysis {
  riskScore: number;
  flags: string[];
}

/**
 * Lightweight, deterministic message risk analysis.
 * Keeps logic simple and synchronous for low-latency client usage.
 */
export function analyzeMessage(content: string): MessageSafetyAnalysis {
  const text = content.trim().toLowerCase();
  const flags: string[] = [];
  let score = 0;

  if (!text) return { riskScore: 0, flags };

  const suspiciousKeywords = ['urgent', 'click', 'verify', 'password', 'otp', 'bank'];
  const matchedKeywords = suspiciousKeywords.filter((keyword) => text.includes(keyword));
  if (matchedKeywords.length > 0) {
    flags.push(`suspicious_keywords:${matchedKeywords.join(',')}`);
    score += Math.min(0.5, matchedKeywords.length * 0.15);
  }

  // Repeated message pattern inside one payload, e.g. "send now send now send now"
  const repeatedPhrasePattern = /\b(.{3,40})\b(?:\s+\1\b){1,}/i;
  if (repeatedPhrasePattern.test(text)) {
    flags.push('repeated_phrase');
    score += 0.3;
  }

  // Repeated punctuation or URL-heavy messages are common spam indicators.
  if (/(!|\?){3,}/.test(text)) {
    flags.push('excessive_punctuation');
    score += 0.1;
  }
  if ((text.match(/https?:\/\//g) || []).length > 0) {
    flags.push('contains_link');
    score += 0.15;
  }

  return {
    riskScore: Math.max(0, Math.min(1, score)),
    flags,
  };
}
