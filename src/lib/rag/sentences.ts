const ABBREVIATIONS = new Set([
  'b.sc',
  'b.sc.',
  'e.g',
  'e.g.',
  'i.e',
  'i.e.',
  'vs',
  'vs.',
  'dr',
  'dr.',
  'approx',
  'approx.',
  'mr',
  'mr.',
  'ms',
  'ms.',
]);

/**
 * Split text into units (bullets or sentences) in original order.
 * - Lines starting with "- " are their own units.
 * - Sentences split at ". ", "! ", "? " followed by uppercase, digit, quote, or "Live:" / "Code:".
 * - Does NOT split inside URLs, emails, decimals (0.93), or after abbreviations (B.Sc, e.g., i.e., vs., Dr., approx.).
 * - Trailing period of a URL belongs to the sentence.
 * - "Live:" or "Code:" starts its own unit.
 */
export function splitUnits(text: string): string[] {
  if (!text || !text.trim()) return [];

  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const units: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('- ')) {
      units.push(trimmed);
      continue;
    }

    const sentences = splitSentences(trimmed);
    for (const s of sentences) {
      if (s) units.push(s);
    }
  }

  return units;
}

function splitSentences(text: string): string[] {
  const result: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Check if "Live:" or "Code:" starts here mid-string (after whitespace)
    if (i > start && /\s/.test(text[i - 1])) {
      const rest = text.slice(i);
      if (rest.startsWith('Live:') || rest.startsWith('Code:')) {
        const sentence = text.slice(start, i).trim();
        if (sentence) {
          result.push(sentence);
        }
        start = i;
        continue;
      }
    }

    if (char === '.' || char === '!' || char === '?') {
      // Must be followed by space or end of string
      const nextChar = text[i + 1];
      if (nextChar === undefined) {
        // End of text
        continue;
      }
      if (!/\s/.test(nextChar)) {
        // Not followed by whitespace (e.g. decimal 0.93, or inside url/email)
        continue;
      }

      // Check what follows the whitespace
      const afterWsIndex = i + 1 + (text.slice(i + 1).match(/^\s+/)?.[0].length || 0);
      const afterWsChar = text[afterWsIndex];
      const afterWsRest = text.slice(afterWsIndex);

      // Must be followed by uppercase letter, digit, quote, or "Live:" / "Code:"
      const isStartOfSentence =
        afterWsChar !== undefined &&
        (/[A-Z0-9"']/.test(afterWsChar) ||
          afterWsRest.startsWith('Live:') ||
          afterWsRest.startsWith('Code:'));

      if (!isStartOfSentence) {
        continue;
      }

      // Check if preceding token is an abbreviation or decimal or inside email
      const precedingText = text.slice(start, i + 1);
      const lastTokenMatch = precedingText.match(/(\S+)$/);
      const lastToken = lastTokenMatch ? lastTokenMatch[1].toLowerCase() : '';

      // Check abbreviation (e.g. b.sc, e.g., i.e., approx., etc.)
      // Also handle when lastToken is just 'b.sc.' or 'b.sc'
      const cleanToken = lastToken.replace(/[?!]+$/g, '');
      if (ABBREVIATIONS.has(cleanToken) || ABBREVIATIONS.has(cleanToken.replace(/\.$/, ''))) {
        continue;
      }

      // Check decimal: e.g. "0.93" - already guarded by /\s/.test(nextChar) above

      // Valid boundary found!
      const sentence = text.slice(start, i + 1).trim();
      if (sentence) {
        result.push(sentence);
      }
      // advance past whitespace
      start = afterWsIndex;
      i = afterWsIndex - 1;
    }
  }

  const remainder = text.slice(start).trim();
  if (remainder) {
    result.push(remainder);
  }

  return result;
}

