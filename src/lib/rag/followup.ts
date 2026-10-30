import type { Answer, Chunk, ConversationState } from './types';
import { computeChunkTitleMatch } from './retriever';
import { splitUnits } from './sentences';

export const STACK_LEXICON = [
  'stack',
  'tech',
  'technologies',
  'technology',
  'framework',
  'frameworks',
  'language',
  'languages',
  'built with',
  'made with',
  'uses',
  'use',
  'using',
  'backend',
  'frontend',
  'database',
  'agent',
  'agents',
  'llm',
  'llms',
  'model',
  'models',
];

export const LIVE_LEXICON = [
  'live',
  'demo',
  'deployed',
  'hosted',
  'link',
  'url',
  'website',
  'site',
  'working',
];

export const CODE_LEXICON = [
  'github',
  'code',
  'repo',
  'repository',
  'source',
];

export const ROLE_LEXICON = [
  'role',
  'alone',
  'solo',
  'team',
  'myself',
  'by yourself',
  'on your own',
  'built',
  'build',
  'build it',
  'built it',
];

export const FEATURES_LEXICON = [
  'features',
  'feature',
  'includes',
  'include',
  'can do',
  'does',
  'what does it do',
  'functionality',
];

export const DETAILS_LEXICON = [
  'details',
  'detail',
  'explain',
  'explains',
];

export const ATTRIBUTE_LEXICONS: Record<string, string[]> = {
  stack: STACK_LEXICON,
  live: LIVE_LEXICON,
  code: CODE_LEXICON,
  role: ROLE_LEXICON,
  features: FEATURES_LEXICON,
  details: DETAILS_LEXICON,
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'about', 'of',
  'what', 'how', 'when', 'where', 'who', 'which', 'why',
  'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will',
  'and', 'or', 'not', 'no', 'so', 'if', 'then', 'your', 'my', 'his', 'her',
]);

const OTHER_PROJECT_NAMES: Record<string, string[]> = {
  'project-recruitmate-ai': ['recruitmate', 'recrutmate'],
  'project-atelier': ['atelier', 'furniture'],
  'project-ipl-win-predictor': ['ipl', 'cricket'],
  'project-charanestates': ['charanestates', 'real estate', 'real-estate'],
  'project-sri-vishnu-grand-pg': ['sri vishnu', 'vishnu grand', 'pg hostel', 'srivishnugrandpg'],
  'project-ai-business-doctor': ['business doctor', 'doctor'],
  'project-hackerrank-orchestrate': ['hackerrank', 'orchestrate'],
  'project-sentinel-agent': ['sentinel'],
  'project-nuerax-hackathon': ['neurax'],
  'project-jalflow': ['jalflow', 'waterlogging'],
  'project-codebuddy-chrome-extension': ['codebuddy', 'chrome extension'],
  'project-telugu-voice-agents': ['telugu voice', 'voice agent', 'voice agents'],
};

function joinUnits(units: string[]): string {
  let result = '';
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (i === 0) {
      result = u;
    } else {
      const prev = units[i - 1];
      if (u.startsWith('- ') || prev.startsWith('- ')) {
        result += '\n' + u;
      } else {
        result += ' ' + u;
      }
    }
  }
  return result;
}

export function buildProjectSuggestions(chunk: Chunk, state: ConversationState): string[] {
  const chips: string[] = [];

  // 1. If chunk has detail not yet shown: the FIRST chip is exactly "Tell me more"
  if (chunk.detail && !state.detailShown[chunk.id]) {
    chips.push('Tell me more');
  }

  // 2. "What stack does it use?"
  chips.push('What stack does it use?');

  // 3. Only if chunk has links containing "Live:", "Is it live?"
  if (chunk.links && chunk.links.some((l) => l.startsWith('Live:'))) {
    chips.push('Is it live?');
  }

  // 4. Then if room, "What are your other projects?"
  if (chips.length < 3) {
    chips.push('What are your other projects?');
  }

  return chips.slice(0, 3);
}

/**
 * Attempts to resolve a query as a follow-up about the last project topic.
 * Returns null if not a follow-up or if an explicit topic switch is detected.
 */
export function resolveFollowUp(
  rawQuery: string,
  normalizedQuery: string,
  state: ConversationState,
  chunks: Chunk[],
  vocab?: Set<string>
): { answer: Answer; state: ConversationState } | null {
  if (!state.lastChunkId) return null;

  const lastChunk = chunks.find((c) => c.id === state.lastChunkId);
  if (!lastChunk) return null;

  // Only attempted when lastChunkId points to a chunk whose id starts with "project-"
  // or whose heading starts with "Project:" or kind is "project"
  const isProject =
    lastChunk.id.startsWith('project-') ||
    lastChunk.kind === 'project' ||
    lastChunk.title.startsWith('Project:');

  if (!isProject) return null;

  const normLower = normalizedQuery.toLowerCase();
  const rawLower = rawQuery.toLowerCase();

  // 1. Reference cue & role checks
  const hasRefCue = /\b(it|its|this|that|this\s+project|the\s+project|there)\b/i.test(normalizedQuery);
  const isRole = /\b(role|alone|solo|team|myself|by\s+yourself|on\s+your\s+own|build\s+it|built\s+it|built|build)\b/i.test(
    normalizedQuery
  );

  const allWords = normLower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const contentTokens = allWords.filter((w) => !STOPWORDS.has(w));
  const hasCharan = allWords.some((w) => w === 'charan' || w.startsWith('charan'));

  // Check which attributes match the query
  const matchedAttributes: string[] = [];
  for (const [attr, lexicon] of Object.entries(ATTRIBUTE_LEXICONS)) {
    const hasWord = lexicon.some((w) => {
      const pattern = new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`, 'i');
      return pattern.test(normalizedQuery) || pattern.test(rawQuery);
    });
    if (hasWord) {
      matchedAttributes.push(attr);
    }
  }

  const isShortAttr =
    contentTokens.length <= 4 && !hasCharan && matchedAttributes.length > 0;

  // Qualifies if hasRefCue, isRole, or isShortAttr
  if (!hasRefCue && !isRole && !isShortAttr) {
    return null;
  }

  // 2. Check for explicit project names belonging to OTHER projects
  for (const [projId, names] of Object.entries(OTHER_PROJECT_NAMES)) {
    if (projId !== lastChunk.id) {
      for (const name of names) {
        if (normLower.includes(name) || rawLower.includes(name)) {
          return null; // explicit project topic wins
        }
      }
    }
  }

  // 3. Check titleMatch >= 0.6 against ANY other chunk
  for (const other of chunks) {
    if (other.id !== lastChunk.id) {
      // If query has a project reference cue ("it", "its", "this project"),
      // general personal tech stack / skill FAQs do not override project-specific attributes
      if (
        hasRefCue &&
        (other.id.includes('tech-stack') || other.id.includes('skills'))
      ) {
        continue;
      }

      const matchScore = computeChunkTitleMatch(normalizedQuery, other, vocab);
      if (matchScore >= 0.6) {
        return null; // explicit chunk match wins
      }
    }
  }

  // Ensure units array exists
  const units = lastChunk.units || splitUnits(lastChunk.text);

  // Determine primary matched attribute
  // Priority: live, code, role, stack, features, details
  const priorityOrder = ['live', 'code', 'role', 'stack', 'features', 'details'];
  let primaryAttr = priorityOrder.find((attr) => matchedAttributes.includes(attr));
  if (!primaryAttr && isRole) {
    primaryAttr = 'role';
  }

  if (!primaryAttr) {
    // If no attribute matched but hasRefCue or role, try general overlap
    primaryAttr = 'details';
  }

  // A) Live attribute: return unit(s) in links starting with "Live:" first
  if (primaryAttr === 'live') {
    const liveLinks = (lastChunk.links || []).filter((u) => u.startsWith('Live:'));
    if (liveLinks.length > 0) {
      return {
        answer: {
          text: liveLinks.join('\n'),
          sources: [{ id: lastChunk.id, title: lastChunk.title }],
          confidence: 'high',
          kind: 'knowledge',
          suggestions: buildProjectSuggestions(lastChunk, state),
        },
        state, // keeps lastChunkId unchanged
      };
    }
  }

  // B) Code attribute: return unit(s) in links starting with "Code:" first
  if (primaryAttr === 'code') {
    const codeLinks = (lastChunk.links || []).filter((u) => u.startsWith('Code:'));
    if (codeLinks.length > 0) {
      return {
        answer: {
          text: codeLinks.join('\n'),
          sources: [{ id: lastChunk.id, title: lastChunk.title }],
          confidence: 'high',
          kind: 'knowledge',
          suggestions: buildProjectSuggestions(lastChunk, state),
        },
        state, // keeps lastChunkId unchanged
      };
    }
  }

  // C) Details attribute: return detail text if available
  if (primaryAttr === 'details' && lastChunk.detail) {
    return {
      answer: {
        text: lastChunk.detail,
        sources: [{ id: lastChunk.id, title: lastChunk.title }],
        confidence: 'high',
        kind: 'knowledge',
        suggestions: buildProjectSuggestions(lastChunk, {
          ...state,
          detailShown: { ...state.detailShown, [lastChunk.id]: true },
        }),
      },
      state: {
        ...state,
        detailShown: { ...state.detailShown, [lastChunk.id]: true },
      },
    };
  }

  // D) Score each unit by overlap with lexicon words of matched attribute + query content words
  const lexiconWords = ATTRIBUTE_LEXICONS[primaryAttr] || [];
  const scoredUnits: { unit: string; index: number; score: number }[] = [];

  for (let idx = 0; idx < units.length; idx++) {
    const u = units[idx];
    const uLower = u.toLowerCase();
    let score = 0;

    for (const lex of lexiconWords) {
      const p = new RegExp(`\\b${lex.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (p.test(uLower)) {
        score++;
      }
    }

    for (const token of contentTokens) {
      if (token.length > 2) {
        const p = new RegExp(`\\b${token}\\b`, 'i');
        if (p.test(uLower)) {
          score++;
        }
      }
    }

    if (score >= 1) {
      scoredUnits.push({ unit: u, index: idx, score });
    }
  }

  if (scoredUnits.length === 0) {
    // If nothing scores, do NOT guess: answer exactly fallback
    return {
      answer: {
        text: "I don't have more on that for this project. You can email me at bonamukkalacharan@gmail.com.",
        sources: [],
        confidence: 'low',
        kind: 'fallback',
        suggestions: buildProjectSuggestions(lastChunk, state),
      },
      state, // keeps lastChunkId unchanged
    };
  }

  // Sort best score first, take at most 2, returned in original order
  scoredUnits.sort((a, b) => b.score - a.score);
  const topCandidates = scoredUnits.slice(0, 2);
  topCandidates.sort((a, b) => a.index - b.index);

  const selectedUnits = topCandidates.map((c) => c.unit);
  const answerText = joinUnits(selectedUnits);

  return {
    answer: {
      text: answerText,
      sources: [{ id: lastChunk.id, title: lastChunk.title }],
      confidence: 'high',
      kind: 'knowledge',
      suggestions: buildProjectSuggestions(lastChunk, state),
    },
    state, // keeps lastChunkId unchanged
  };
}
