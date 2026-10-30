import type { Answer } from './types';

export const DEFAULT_SUGGESTION_CHIPS = [
  'Who are you?',
  "What's your strongest project?",
  'Are you available for freelance?',
  'What services do you offer?',
  'How can I contact you?',
] as const;

export const INTENT_REPLIES = {
  greeting:
    "Hi, I'm Charan's AI assistant. Ask me about my projects, skills, services or how to work with me.",
  thanks: "You're welcome. Is there anything else you'd like to know about my work?",
  goodbye:
    "Thanks for stopping by. If you'd like to work together, email me at bonamukkalacharan@gmail.com.",
  how_are_you: "Thanks for asking. What would you like to know about my work?",
  bot_nature:
    "I'm an automated assistant on Charan's portfolio. I answer in his voice using only the information in his portfolio data, so this is not Charan typing live. For a personal reply, email bonamukkalacharan@gmail.com.",
  capabilities:
    'I can answer questions about my background, projects, tech stack, services, availability and how to contact me.',
  chitchat:
    'I can only help with questions about my work and background. Try asking about my projects, skills or services.',
  frustrated:
    "Sorry I couldn't help with that. You can ask about my projects, skills and services, or email me at bonamukkalacharan@gmail.com.",
  ack: "Sure. Is there anything else you'd like to know about my work?",
};

function cleanForIntent(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:]+$/g, '')
    .trim();
}

/**
 * Deterministic intent detector.
 * Only triggers when the ENTIRE message matches the intent pattern.
 * This ensures questions like "Are you available for freelance?" are never hijacked.
 */
export function detectIntent(
  normalizedQuery: string,
  rawQuery?: string
): Answer | null {
  const normClean = cleanForIntent(normalizedQuery);
  const rawClean = rawQuery ? cleanForIntent(rawQuery) : normClean;

  const candidates = [normClean, rawClean];

  for (const text of candidates) {
    // 1. greeting
    if (/^(hi+|hello|hey|yo|good\s+(morning|afternoon|evening))(\s+there)?$/i.test(text)) {
      return {
        text: INTENT_REPLIES.greeting,
        confidence: 'high',
        kind: 'intent',
        sources: [],
      };
    }

    // 2. thanks
    if (/^(thanks|thank\s+you(\s+so\s+much|\s+a\s+lot)?|thx|ty|great|awesome|nice)$/i.test(text)) {
      return {
        text: INTENT_REPLIES.thanks,
        confidence: 'high',
        kind: 'intent',
        sources: [],
      };
    }

    // 3. goodbye
    if (/^(bye(\s*bye)?|goodbye|see\s+(you|ya)|cya|that'?s\s+all)$/i.test(text)) {
      return {
        text: INTENT_REPLIES.goodbye,
        confidence: 'high',
        kind: 'intent',
        sources: [],
      };
    }

    // 4. how_are_you
    if (/^(how\s+are\s+you|how\s+r\s+u|how\s+is\s+charan|what'?s\s+up|whats\s+up|how\s+are\s+you\s+doing)$/i.test(text)) {
      return {
        text: INTENT_REPLIES.how_are_you,
        confidence: 'high',
        kind: 'intent',
        sources: [],
      };
    }

    // 5. bot_nature
    // Must match the whole message: "are you a bot", "are you real", "are you chatgpt", "is this ai", "am i talking to charan"
    if (
      /^(are\s+you|are\s+u|is\s+charan|is\s+this)\s+(a\s+|an\s+)?(bot|ai|robot|real|human|chatgpt|really\s+charan)(\s+person)?$/i.test(text) ||
      /^am\s+i\s+talking\s+to\s+charan$/i.test(text) ||
      /^is\s+this\s+ai$/i.test(text) ||
      /^(are\s+you|are\s+u|is\s+charan)\s+really\s+charan$/i.test(text)
    ) {
      return {
        text: INTENT_REPLIES.bot_nature,
        confidence: 'high',
        kind: 'intent',
        sources: [],
      };
    }

    // 6. capabilities
    if (/^(what\s+can\s+(you|u|charan)\s+do|how\s+can\s+(you|u|charan)\s+help|help|what\s+can\s+i\s+ask)$/i.test(text)) {
      return {
        text: INTENT_REPLIES.capabilities,
        confidence: 'high',
        kind: 'intent',
        sources: [],
        suggestions: [...DEFAULT_SUGGESTION_CHIPS],
      };
    }

    // 7. chitchat
    if (
      /^(tell\s+me\s+a\s+joke|sing(\s+me)?\s+a\s+song|tell\s+me\s+a\s+riddle|do\s+(you|charan)\s+love\s+me|are\s+(you|charan)\s+single|who\s+is\s+(your|charan'?s)\s+favorite.*|write\s+code(\s+for\s+me)?|solve\s+this)$/i.test(text)
    ) {
      return {
        text: INTENT_REPLIES.chitchat,
        confidence: 'high',
        kind: 'intent',
        sources: [],
        suggestions: [...DEFAULT_SUGGESTION_CHIPS],
      };
    }

    // 8. frustrated
    if (
      /^(you\s+are|charan\s+is|you're|u\s+r|this\s+is)\s+(stupid|useless|bad|dumb|idiot|trash|terrible|awful)$/i.test(text) ||
      /^(useless|stupid|dumb)$/i.test(text)
    ) {
      return {
        text: INTENT_REPLIES.frustrated,
        confidence: 'high',
        kind: 'intent',
        sources: [],
      };
    }

    // 9. ack
    if (/^(ok|okay|cool|got\s+it|alright|fine|nice\s+one|makes\s+sense)$/i.test(text)) {
      return {
        text: INTENT_REPLIES.ack,
        confidence: 'high',
        kind: 'intent',
        sources: [],
        suggestions: [...DEFAULT_SUGGESTION_CHIPS],
      };
    }
  }

  return null;
}

