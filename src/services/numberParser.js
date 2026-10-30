/**
 * Utility functions for parsing Indian number notations, words, and currencies.
 */

const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90
};

const MAGNITUDES = {
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  lakhs: 100000,
  lac: 100000,
  lacs: 100000,
  crore: 10000000,
  crores: 10000000,
  million: 1000000
};

/**
 * Convert written English numbers (e.g. "six thousand", "twenty five thousand") to integers
 * @param {string} text
 * @returns {number|null}
 */
export function wordsToNumber(text) {
  if (!text || typeof text !== 'string') return null;

  const clean = text
    .toLowerCase()
    .replace(/[,\-/]/g, ' ')
    .trim();

  const tokens = clean.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const token of tokens) {
    if (NUMBER_WORDS[token] !== undefined) {
      current += NUMBER_WORDS[token];
      matchedAny = true;
    } else if (MAGNITUDES[token] !== undefined) {
      const mag = MAGNITUDES[token];
      if (current === 0) current = 1;
      if (mag >= 1000) {
        total += current * mag;
        current = 0;
      } else {
        current = current * mag;
      }
      matchedAny = true;
    } else if (!isNaN(Number(token))) {
      current += Number(token);
      matchedAny = true;
    }
  }

  if (!matchedAny) return null;
  return total + current;
}

/**
 * Parse Indian currency string, handling ₹, Rs., Rs, INR, commas (e.g. 2,00,000),
 * lakhs (e.g. 2.5 lakh), crores, and written words.
 * @param {string} text
 * @returns {{ amount: number|null, currency: string|null }}
 */
export function extractAmountAndCurrency(text) {
  if (!text || typeof text !== 'string') {
    return { amount: null, currency: null };
  }

  const hasCurrencySymbol = /(?:₹|rs\.?|inr|rupees)/i.test(text);
  const currency = hasCurrencySymbol ? 'INR' : null;

  // Pattern 1: Number with Lakh/Crore/Thousand (e.g. "₹2.5 lakh", "Rs. 3 lakhs", "1.8 lakh", "₹ 15,000")
  const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(lakhs?|lacs?|crores?|thousand|k)\b/i);
  if (lakhMatch) {
    const base = parseFloat(lakhMatch[1]);
    const unit = lakhMatch[2].toLowerCase();
    const multiplier = MAGNITUDES[unit] || (unit === 'k' ? 1000 : 1);
    return {
      amount: Math.round(base * multiplier),
      currency: currency || 'INR'
    };
  }

  // Pattern 2: Standard formatted or unformatted number preceded or followed by currency
  // Handles ₹6,000, Rs. 2,000/-, INR 15000, Rs 10000, ₹25,000, 2,00,000 rupees
  const numCurrencyMatch = text.match(
    /(?:₹|rs\.?|inr)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)(?:\s*\/-)?/i
  ) || text.match(
    /([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(?:\/-)?\s*(?:rupees|inr)/i
  );

  if (numCurrencyMatch) {
    const rawNum = numCurrencyMatch[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    if (!isNaN(num)) {
      return { amount: num, currency: 'INR' };
    }
  }

  // Pattern 3: Words (e.g. "Six thousand rupees", "fifteen thousand")
  const wordsMatch = text.match(
    /([a-z\s-]+)\s*(?:rupees|rs\.?|inr)/i
  );
  if (wordsMatch) {
    const num = wordsToNumber(wordsMatch[1]);
    if (num !== null && num > 0) {
      return { amount: num, currency: 'INR' };
    }
  }

  // Pattern 4: Standalone number with commas like 2,000 or 15000 if text describes monetary benefit
  const standaloneMatch = text.match(/(?:grant|subsidy|assistance|benefit|transfer|of)\s*(?:of\s*)?([0-9]+(?:,[0-9]+)*)/i);
  if (standaloneMatch) {
    const num = parseFloat(standaloneMatch[1].replace(/,/g, ''));
    if (!isNaN(num)) {
      return { amount: num, currency: currency || 'INR' };
    }
  }

  return { amount: null, currency };
}

/**
 * Parse instalment count from text
 * Handles "in three instalments", "two equal instalments", "4 quarterly instalments", "in 3 instalments"
 * @param {string} text
 * @returns {number|null}
 */
export function extractInstalments(text) {
  if (!text || typeof text !== 'string') return null;

  // Numeric instalment
  const numericMatch = text.match(/([0-9]+)\s*(?:equal\s*)?(?:quarterly\s*|monthly\s*)?instal[l]?ments/i);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  // Word instalment
  const wordMatch = text.match(/(one|two|three|four|five|six|seven|eight|nine|ten|twelve|single)\s*(?:equal\s*)?(?:quarterly\s*|monthly\s*)?instal[l]?ments?/i);
  if (wordMatch) {
    const word = wordMatch[1].toLowerCase();
    if (word === 'single') return 1;
    return NUMBER_WORDS[word] || null;
  }

  return null;
}

/**
 * Parse payment frequency from text
 * @param {string} text
 * @returns {'monthly'|'yearly'|'quarterly'|'half_yearly'|'one-time'|null}
 */
export function extractFrequency(text) {
  if (!text || typeof text !== 'string') return null;

  const lower = text.toLowerCase();

  if (/one[- ]time|lump[- ]sum|single (?:grant|benefit|payment|instalment|transfer)/i.test(lower)) {
    return 'one-time';
  }
  if (/year(?:ly)?|annu(?:al|ally)|per annum|a year|per year/i.test(lower)) {
    return 'yearly';
  }
  if (/quarter(?:ly)?|every 3 months|every quarter/i.test(lower)) {
    return 'quarterly';
  }
  if (/half[- ]yearly|every 6 months|bi[- ]annual/i.test(lower)) {
    return 'half_yearly';
  }
  if (/(?:^|\s)month(?:ly)?|per month|\/-\s*per month|a month|every month/i.test(lower)) {
    return 'monthly';
  }

  return null;
}
