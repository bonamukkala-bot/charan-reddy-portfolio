import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setCachedIndex, normalizeQuery } from '../src/lib/rag/retriever.ts';
import { respond } from '../src/lib/rag/respond.ts';
import { embedQuery } from '../src/lib/rag/embedder.ts';
import { INTENT_REPLIES } from '../src/lib/rag/intents.ts';
import { runSentenceTests } from './test-sentences.mjs';
import { buildProjectSuggestions, STACK_LEXICON } from '../src/lib/rag/followup.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Test suite containing:
// 1) The original 28 questions
// 2) The new "you"-phrased questions
// 3) Intent cases
// 4) Non-hijacked intent safety cases
// 5) Fallback cases
// 6) New contact additions & contraction test cases
const TEST_CASES = [
  // --- Original 28 Questions ---
  { query: 'Who is Charan?', expectedTitle: 'Who is Charan?' },
  { query: 'What is his strongest project?', expectedTitle: "What is Charan's strongest project?" },
  { query: 'Is he available for freelance?', expectedTitle: 'Is Charan available for freelance work?' },
  { query: 'How can I contact him?', expectedTitle: 'How can I contact Charan?' },
  { query: 'How much does he charge?', expectedTitle: 'How much does Charan charge?' },
  { query: 'What tech stack does he use for AI?', expectedTitle: 'What tech stack does Charan use for AI projects?' },
  { query: 'Tell me about RecruitMate', expectedTitle: 'Project: RecruitMate AI' },
  { query: 'What is the Sri Vishnu Grand PG project?', expectedTitle: 'Project: Sri Vishnu Grand PG' },
  { query: 'Which client work has he done?', expectedTitle: 'Which client work has Charan done?' },
  { query: 'Does he speak Telugu?', expectedTitle: 'Does Charan speak Telugu?' },
  { query: 'What hackathons has he joined?', expectedTitle: 'What hackathons has Charan joined?' },
  { query: 'What is he studying?', expectedTitle: 'What is Charan studying?' },
  { query: 'Where is he based?', expectedTitle: 'Where is Charan based?' },
  { query: 'Does he make content?', expectedTitle: 'Content and Instagram' },
  { query: 'What is his Instagram?', expectedTitle: "What is Charan's Instagram?" },
  { query: 'Can he build a chatbot for my business?', expectedTitle: 'Can Charan build a chatbot for my business?' },
  { query: 'What is AI Business Doctor?', expectedTitle: 'Project: AI Business Doctor' },
  { query: 'Does he do WhatsApp bots?', expectedTitle: 'Does Charan build WhatsApp bots?' },
  { query: 'What is the weather today?', expectedKind: 'fallback' },
  { query: 'What is the capital of France?', expectedKind: 'fallback' },
  { query: 'who is charan', expectedTitle: 'Who is Charan?' },
  { query: 'tell me about him', expectedTitle: 'Who is Charan?' },
  { query: 'What does he do?', expectedTitle: 'What does Charan do?' },
  { query: 'where does he live', expectedTitle: 'Where is Charan based?' },
  { query: 'How do I hire him?', expectedTitle: 'How can I hire Charan?' },
  { query: 'What is RecruitMate AI?', expectedTitle: 'Project: RecruitMate AI' },
  { query: 'Which projects has he built?', expectedTitle: 'What projects has Charan built?' },
  { query: 'What are his skills?', expectedTitle: "What are Charan's skills?" },

  // --- "You"-phrased Questions ---
  { query: 'Who are you?', expectedTitle: 'Who is Charan?' },
  { query: 'who are you', expectedTitle: 'Who is Charan?' },
  { query: 'Tell me about yourself', expectedTitle: 'Who is Charan?' },
  { query: 'introduce yourself', expectedTitle: 'Who is Charan?' },
  { query: 'hi, who are you', expectedTitle: 'Who is Charan?' },
  { query: 'What do you do?', expectedTitle: 'What does Charan do?' },
  { query: 'Where are you from?', expectedTitle: 'Where is Charan based?' },
  { query: 'Where do you live?', expectedTitle: 'Where is Charan based?' },
  { query: 'What are you studying?', expectedTitle: 'What is Charan studying?' },
  { query: 'Which college do you go to?', expectedTitle: 'What is Charan studying?' },
  { query: 'What are your skills?', expectedTitle: "What are Charan's skills?" },
  { query: 'ur skills', expectedTitle: "What are Charan's skills?" },
  { query: 'What services do you offer?', expectedTitle: 'What services does Charan offer?' },
  { query: 'Can you make a website for my shop?', expectedTitle: 'What services does Charan offer?' },
  { query: 'Can you build a chatbot for my business?', expectedTitle: 'Can Charan build a chatbot for my business?' },
  { query: 'Do you build WhatsApp bots?', expectedTitle: 'Does Charan build WhatsApp bots?' },
  { query: 'Are you available for freelance?', expectedTitle: 'Is Charan available for freelance work?' },
  { query: 'freelence availble?', expectedTitle: 'Is Charan available for freelance work?' },
  { query: 'Can I hire you?', expectedTitle: 'How can I hire Charan?' },
  { query: 'I want to hire you', expectedTitle: 'How can I hire Charan?' },
  { query: 'How much do you charge?', expectedTitle: 'How much does Charan charge?' },
  { query: 'how much do you charge', expectedTitle: 'How much does Charan charge?' },
  { query: 'How can I contact you?', expectedTitle: 'How can I contact Charan?' },
  { query: 'What is your Instagram?', expectedTitle: "What is Charan's Instagram?" },
  { query: 'Do you speak Telugu?', expectedTitle: 'Does Charan speak Telugu?' },
  { query: 'What is your best project?', expectedTitle: "What is Charan's strongest project?" },
  { query: 'wat is ur strongest projct', expectedTitle: "What is Charan's strongest project?" },
  { query: 'What have you built?', expectedTitle: 'What projects has Charan built?' },
  { query: 'Tell me about your RecruitMate project', expectedTitle: 'Project: RecruitMate AI' },
  { query: 'recrutmate', expectedTitle: 'Project: RecruitMate AI' },
  { query: 'Which hackathons have you joined?', expectedTitle: 'What hackathons has Charan joined?' },
  { query: 'Do you have any client projects?', expectedTitle: 'Which client work has Charan done?' },
  { query: 'Where can I see your code?', expectedTitle: "Where can I see Charan's code?" },
  { query: 'Are you open to full-time jobs?', expectedTitle: 'Is Charan open to full-time jobs or internships?' },
  { query: 'What are you working on now?', expectedTitle: 'What is Charan working on now?' },
  { query: 'Why should I hire you?', expectedTitle: 'Why should I hire Charan?' },

  // --- Contact Questions & Contraction Tests ---
  { query: "what's ur email", expectedTitle: "What is Charan's email?" },
  { query: 'What is your email?', expectedTitle: "What is Charan's email?" },
  { query: 'email id', expectedTitle: "What is Charan's email?" },
  { query: 'How do I email you?', expectedTitle: "What is Charan's email?" },
  { query: 'What is your LinkedIn?', expectedTitle: "What is Charan's LinkedIn?" },
  { query: 'linkedin', expectedTitle: "What is Charan's LinkedIn?" },
  { query: 'What is your GitHub?', expectedTitle: "What is Charan's GitHub?" },
  { query: 'github link', expectedTitle: "What is Charan's GitHub?" },
  { query: "what's your strongest project", expectedTitle: "What is Charan's strongest project?" },
  { query: "who's charan", expectedTitle: 'Who is Charan?' },

  // --- Intents ---
  { query: 'hi', expectedKind: 'intent', expectedText: INTENT_REPLIES.greeting },
  { query: 'hello there', expectedKind: 'intent', expectedText: INTENT_REPLIES.greeting },
  { query: 'good morning', expectedKind: 'intent', expectedText: INTENT_REPLIES.greeting },
  { query: 'thanks', expectedKind: 'intent', expectedText: INTENT_REPLIES.thanks },
  { query: 'thank you so much', expectedKind: 'intent', expectedText: INTENT_REPLIES.thanks },
  { query: 'bye', expectedKind: 'intent', expectedText: INTENT_REPLIES.goodbye },
  { query: 'how are you', expectedKind: 'intent', expectedText: INTENT_REPLIES.how_are_you },
  { query: 'are you a bot?', expectedKind: 'intent', expectedText: INTENT_REPLIES.bot_nature },
  { query: 'are you real?', expectedKind: 'intent', expectedText: INTENT_REPLIES.bot_nature },
  { query: 'are you ChatGPT?', expectedKind: 'intent', expectedText: INTENT_REPLIES.bot_nature },
  { query: 'is this AI', expectedKind: 'intent', expectedText: INTENT_REPLIES.bot_nature },
  { query: 'what can you do?', expectedKind: 'intent', expectedText: INTENT_REPLIES.capabilities },
  { query: 'tell me a joke', expectedKind: 'intent', expectedText: INTENT_REPLIES.chitchat },
  { query: 'you are useless', expectedKind: 'intent', expectedText: INTENT_REPLIES.frustrated },

  // --- Non-hijacked checks ---
  { query: 'Are you available for freelance?', expectedKind: 'knowledge', expectedTitle: 'Is Charan available for freelance work?' },
  { query: 'Can you build a chatbot for my business?', expectedKind: 'knowledge', expectedTitle: 'Can Charan build a chatbot for my business?' },
  { query: 'Do you speak Telugu?', expectedKind: 'knowledge', expectedTitle: 'Does Charan speak Telugu?' },

  // --- Fallbacks ---
  { query: 'Do you like pizza?', expectedKind: 'fallback' },
  { query: 'How old are you?', expectedKind: 'fallback' },
];

function checkDuplicateSentences(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().toLowerCase().replace(/[^\w\s]/g, ''))
    .filter((s) => s.length > 20);

  const seen = new Set();
  for (const s of sentences) {
    if (seen.has(s)) {
      return s;
    }
    seen.add(s);
  }
  return null;
}

async function runTestSuite(modeName, useEmbedder, index) {
  console.log(`\n================================================================`);
  console.log(`RUNNING MODE: ${modeName} (${TEST_CASES.length} queries)`);
  console.log(`================================================================\n`);

  let passCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    let queryEmbedding = null;

    if (useEmbedder) {
      const normalized = normalizeQuery(tc.query);
      queryEmbedding = await embedQuery(normalized);
    }

    const resp = await respond(
      tc.query,
      { lastChunkId: null, detailShown: {} },
      {
        chunks: index.chunks,
        queryEmbedding,
        topK: 3,
      }
    );

    const answer = resp.answer;
    const topResult = resp.results && resp.results.length > 0 ? resp.results[0] : null;

    let isPass = true;
    let failReason = '';

    // Check sentence deduplication
    const dupSentence = checkDuplicateSentences(answer.text);
    if (dupSentence) {
      isPass = false;
      failReason = `Duplicate sentence found in answer: "${dupSentence}"`;
    }

    if (isPass && tc.expectedKind) {
      if (answer.kind !== tc.expectedKind) {
        isPass = false;
        failReason = `Expected kind "${tc.expectedKind}", got "${answer.kind}"`;
      }
    }

    if (isPass && tc.expectedText) {
      if (answer.text !== tc.expectedText) {
        isPass = false;
        failReason = `Expected text "${tc.expectedText.slice(0, 40)}...", got "${answer.text.slice(0, 40)}..."`;
      }
    }

    if (isPass && tc.expectedKind === 'fallback') {
      if (!Array.isArray(answer.suggestions) || answer.suggestions.length === 0) {
        isPass = false;
        failReason = 'Expected fallback suggestions to be present, but none found';
      }
    }

    if (isPass && tc.expectedTitle) {
      if (!topResult || topResult.chunk.title !== tc.expectedTitle) {
        isPass = false;
        failReason = `Expected top title "${tc.expectedTitle}", got "${topResult ? topResult.chunk.title : 'NONE'}"`;
      }
    }

    if (isPass) {
      passCount++;
      console.log(`PASS [Q${i + 1}]: "${tc.query}" -> ${answer.kind.toUpperCase()}${topResult ? ` (${topResult.chunk.title})` : ''}`);
    } else {
      failCount++;
      console.log(`FAIL [Q${i + 1}]: "${tc.query}" - ${failReason}`);
      console.log('  Top 3 results:');
      if (resp.results && resp.results.length > 0) {
        resp.results.forEach((r, idx) => {
          console.log(`    ${idx + 1}. "${r.chunk.title}" | Score: ${r.score} | BM25: ${r.bm25} | TitleMatch: ${r.titleMatch ?? 0}`);
        });
      } else {
        console.log('    (No retrieval results - intent response)');
      }
      failures.push({
        query: tc.query,
        reason: failReason,
        results: resp.results ? resp.results.slice(0, 3) : [],
      });
    }
  }

  // Multi-turn test suite
  console.log(`\n--- Running Multi-Turn Tests in ${modeName} ---`);

  async function askTurn(query, state) {
    let queryEmbedding = null;
    if (useEmbedder) {
      const normalized = normalizeQuery(query);
      queryEmbedding = await embedQuery(normalized);
    }
    return respond(query, state, {
      chunks: index.chunks,
      queryEmbedding,
      topK: 3,
    });
  }

  const multiTurnTests = [
    {
      name: '["recruitmate", "tell me more"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('recruitmate', state);
        state = t1.state;
        if (t1.answer.text.length > 450) {
          throw new Error(`Turn 1 text too long: ${t1.answer.text.length} > 450 chars`);
        }
        if (!t1.answer.text.includes('recruit-mate-chi.vercel.app')) {
          throw new Error('Turn 1 does not contain live link recruit-mate-chi.vercel.app');
        }
        if (t1.answer.suggestions?.[0] !== 'Tell me more') {
          throw new Error(`Turn 1 first chip is "${t1.answer.suggestions?.[0]}", expected "Tell me more"`);
        }

        const t2 = await askTurn('tell me more', state);
        if (!t2.answer.sources?.[0]?.title.includes('RecruitMate')) {
          throw new Error(`Turn 2 source is not RecruitMate: ${t2.answer.sources?.[0]?.title}`);
        }
        if (!t2.answer.text.trim()) {
          throw new Error('Turn 2 text is empty');
        }
        const s1 = t1.answer.text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 20);
        const s2 = t2.answer.text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 20);
        for (const sent of s1) {
          if (s2.includes(sent)) {
            throw new Error(`Turn 2 shares sentence with Turn 1: "${sent}"`);
          }
        }
      },
    },
    {
      name: '["recruitmate", "tell me more", "tell me more"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('recruitmate', state);
        state = t1.state;
        const t2 = await askTurn('tell me more', state);
        state = t2.state;
        const t3 = await askTurn('tell me more', state);
        const expected = "That's everything I have on this. Is there anything else you'd like to know?";
        if (t3.answer.text !== expected) {
          throw new Error(`Turn 3 text "${t3.answer.text}" != "${expected}"`);
        }
      },
    },
    {
      name: '["recruitmate", "what stack does it use?"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('recruitmate', state);
        state = t1.state;
        const t2 = await askTurn('what stack does it use?', state);
        if (!t2.answer.text.includes('Flask') || !t2.answer.text.includes('MongoDB')) {
          throw new Error(`Turn 2 does not contain Flask and MongoDB: "${t2.answer.text}"`);
        }
        if (t2.answer.text.length > 400) {
          throw new Error(`Turn 2 length ${t2.answer.text.length} > 400 chars`);
        }
      },
    },
    {
      name: '["recruitmate", "is it live?"] and ["recruitmate", "link"]',
      fn: async () => {
        let state1 = { lastChunkId: null, detailShown: {} };
        const r1 = await askTurn('recruitmate', state1);
        const r2 = await askTurn('is it live?', r1.state);
        if (!r2.answer.text.includes('https://recruit-mate-chi.vercel.app')) {
          throw new Error(`"is it live?" did not contain live URL: "${r2.answer.text}"`);
        }

        let state2 = { lastChunkId: null, detailShown: {} };
        const l1 = await askTurn('recruitmate', state2);
        const l2 = await askTurn('link', l1.state);
        if (!l2.answer.text.includes('https://recruit-mate-chi.vercel.app')) {
          throw new Error(`"link" did not contain live URL: "${l2.answer.text}"`);
        }
      },
    },
    {
      name: '["recruitmate", "github"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('recruitmate', state);
        const t2 = await askTurn('github', t1.state);
        if (!t2.answer.text.includes('github.com/bonamukkala-bot/RecruitMate')) {
          throw new Error(`Did not contain RecruitMate github link: "${t2.answer.text}"`);
        }
      },
    },
    {
      name: '["recruitmate", "did you build it alone?"] and ["recruitmate", "what was your role?"]',
      fn: async () => {
        let state1 = { lastChunkId: null, detailShown: {} };
        const a1 = await askTurn('recruitmate', state1);
        const a2 = await askTurn('did you build it alone?', a1.state);
        if (!a2.answer.text.toLowerCase().includes('alone')) {
          throw new Error(`"did you build it alone?" did not contain "alone": "${a2.answer.text}"`);
        }

        let state2 = { lastChunkId: null, detailShown: {} };
        const b1 = await askTurn('recruitmate', state2);
        const b2 = await askTurn('what was your role?', b1.state);
        if (!b2.answer.text.toLowerCase().includes('alone')) {
          throw new Error(`"what was your role?" did not contain "alone": "${b2.answer.text}"`);
        }
      },
    },
    {
      name: '["ipl predictor", "is it live?"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('ipl predictor', state);
        const t2 = await askTurn('is it live?', t1.state);
        if (!t2.answer.text.toLowerCase().includes('live demo')) {
          throw new Error(`Did not contain "live demo": "${t2.answer.text}"`);
        }
      },
    },
    {
      name: '["sri vishnu grand pg", "what stack does it use?"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('sri vishnu grand pg', state);
        const t2 = await askTurn('what stack does it use?', t1.state);
        if (!t2.answer.text.includes('TanStack') && !t2.answer.text.includes('Vercel')) {
          throw new Error(`Did not contain TanStack or Vercel: "${t2.answer.text}"`);
        }
      },
    },
    {
      name: 'Explicit topics win over follow-up: instagram, who are you, charge, other projects',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const base = await askTurn('recruitmate', state);

        const qInsta = await askTurn('what is your instagram?', base.state);
        if (qInsta.answer.sources?.[0]?.title !== "What is Charan's Instagram?") {
          throw new Error(`Instagram did not resolve: ${qInsta.answer.sources?.[0]?.title}`);
        }

        const qWho = await askTurn('who are you', base.state);
        if (qWho.answer.sources?.[0]?.title !== 'Who is Charan?') {
          throw new Error(`Who are you did not resolve: ${qWho.answer.sources?.[0]?.title}`);
        }

        const qCharge = await askTurn('how much do you charge', base.state);
        if (qCharge.answer.sources?.[0]?.title !== 'How much does Charan charge?') {
          throw new Error(`Charge did not resolve: ${qCharge.answer.sources?.[0]?.title}`);
        }

        const qOther = await askTurn('do you have other projects like this', base.state);
        if (qOther.answer.sources?.[0]?.title !== 'What projects has Charan built?') {
          throw new Error(`Other projects did not resolve: ${qOther.answer.sources?.[0]?.title}`);
        }
      },
    },
    {
      name: '["what is your strongest project?", "tell me more"]',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('what is your strongest project?', state);
        const t2 = await askTurn('tell me more', t1.state);
        if (!t2.answer.sources?.[0]?.title.includes('RecruitMate')) {
          throw new Error(`Turn 2 did not resolve to RecruitMate: ${t2.answer.sources?.[0]?.title}`);
        }
      },
    },
    {
      name: '["tell me more"] with empty state',
      fn: async () => {
        const state = { lastChunkId: null, detailShown: {} };
        const t = await askTurn('tell me more', state);
        const expected = 'What would you like to know more about? Here are a few things you can ask.';
        if (t.answer.text !== expected) {
          throw new Error(`Empty state "tell me more" returned "${t.answer.text}", expected "${expected}"`);
        }
      },
    },
    {
      name: '["recruitmate", "ok"] -> ack intent + preserved state',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('recruitmate', state);
        const t2 = await askTurn('ok', t1.state);
        if (t2.answer.kind !== 'intent' || !t2.answer.text.startsWith('Sure.')) {
          throw new Error(`Turn 2 is not ack intent: ${t2.answer.text}`);
        }
        const t3 = await askTurn('what stack does it use?', t2.state);
        if (!t3.answer.text.includes('Flask') || !t3.answer.text.includes('MongoDB')) {
          throw new Error(`Turn 3 did not resolve to RecruitMate stack: ${t3.answer.text}`);
        }
      },
    },
    {
      name: '["what are your skills?", "what stack does it use?"] non-project state safety',
      fn: async () => {
        let state = { lastChunkId: null, detailShown: {} };
        const t1 = await askTurn('what are your skills?', state);
        const t2 = await askTurn('what stack does it use?', t1.state);
        // Must not crash and must not answer from project follow-up
        if (t2.answer.sources?.[0]?.id.startsWith('project-')) {
          throw new Error(`Answered from project follow-up when previous topic was skills: ${t2.answer.sources?.[0]?.id}`);
        }
      },
    },
    {
      name: 'Detail cues: "recruitmate" short vs full text length (> 700 chars)',
      fn: async () => {
        const state = { lastChunkId: null, detailShown: {} };
        const short1 = await askTurn('recruitmate', state);
        const short2 = await askTurn('tell me about recruitmate', state);
        const full1 = await askTurn('recruitmate in detail', state);
        const full2 = await askTurn('explain recruitmate', state);

        if (short1.answer.text.length > 450) {
          throw new Error(`"recruitmate" short text too long: ${short1.answer.text.length}`);
        }
        if (short2.answer.text.length > 450) {
          throw new Error(`"tell me about recruitmate" short text too long: ${short2.answer.text.length}`);
        }
        if (full1.answer.text.length <= 700) {
          throw new Error(`"recruitmate in detail" should be > 700 chars, got ${full1.answer.text.length}`);
        }
        if (full2.answer.text.length <= 700) {
          throw new Error(`"explain recruitmate" should be > 700 chars, got ${full2.answer.text.length}`);
        }
      },
    },
    {
      name: 'Project short-answer length for all 12 project chunks (<= 450 chars excl. link)',
      fn: async () => {
        const projectChunks = index.chunks.filter((c) => c.kind === 'project' || c.id.startsWith('project-'));
        for (const proj of projectChunks) {
          const query = proj.title.replace(/^Project:\s*/i, '');
          const res = await askTurn(query, { lastChunkId: null, detailShown: {} });
          // Exclude link line
          const lines = res.answer.text.split('\n');
          const nonLinkText = lines.filter((l) => !l.startsWith('Live:') && !l.startsWith('Code:')).join(' ');
          if (nonLinkText.length > 450) {
            throw new Error(`Project "${proj.title}" short answer exceeds 450 chars: ${nonLinkText.length} chars`);
          }
        }
      },
    },
    {
      name: 'SELF-CHECK: every project chunk chips never fallback, and stack chip returns stack word',
      fn: async () => {
        const projectChunks = index.chunks.filter((c) => c.kind === 'project' || c.id.startsWith('project-'));
        for (const proj of projectChunks) {
          const state = { lastChunkId: proj.id, detailShown: { [proj.id]: false } };
          const chips = buildProjectSuggestions(proj, state);

          for (const chip of chips) {
            const res = await askTurn(chip, state);
            if (res.answer.kind === 'fallback') {
              throw new Error(`Project "${proj.title}" chip "${chip}" returned fallback!`);
            }
            if (chip === 'What stack does it use?') {
              const textLower = res.answer.text.toLowerCase();
              const hasStackWord = STACK_LEXICON.some((w) => textLower.includes(w.toLowerCase()));
              if (!hasStackWord) {
                throw new Error(`Project "${proj.title}" stack chip did not return stack word: "${res.answer.text}"`);
              }
            }
          }
        }
      },
    },
  ];

  for (let mIdx = 0; mIdx < multiTurnTests.length; mIdx++) {
    const mt = multiTurnTests[mIdx];
    try {
      await mt.fn();
      passCount++;
      console.log(`PASS [MultiTurn ${mIdx + 1}]: ${mt.name}`);
    } catch (err) {
      failCount++;
      console.log(`FAIL [MultiTurn ${mIdx + 1}]: ${mt.name} - ${err.message}`);
      failures.push({ query: mt.name, reason: err.message, results: [] });
    }
  }

  const totalQueries = TEST_CASES.length + multiTurnTests.length;
  console.log(`\nMode ${modeName} Summary: ${passCount}/${totalQueries} PASSED (${failCount} FAILED)`);
  return { passCount, failCount, totalQueries, failures };
}

async function run() {
  // First run sentence splitter unit tests
  runSentenceTests();

  const isNoEmbedOnly = process.argv.includes('--no-embed');
  const indexPath = path.join(rootDir, 'public', 'knowledge-index.json');
  console.log('Loading knowledge index from:', indexPath);

  const raw = await fs.readFile(indexPath, 'utf8');
  const index = JSON.parse(raw);
  setCachedIndex(index);
  console.log(`Loaded ${index.chunks.length} chunks. Model: ${index.model}\n`);

  if (!isNoEmbedOnly) {
    console.log('Preloading embedding model for hybrid mode...');
    await embedQuery('warmup');
    console.log('Model ready.\n');
  }

  const results = [];

  if (isNoEmbedOnly) {
    // Run only keyword-only mode
    const res = await runTestSuite('KEYWORD-ONLY (BM25 + Title)', false, index);
    results.push(res);
  } else {
    // Run BOTH modes
    const hybridRes = await runTestSuite('HYBRID (Embeddings + BM25 + Title)', true, index);
    results.push(hybridRes);

    const bm25Res = await runTestSuite('KEYWORD-ONLY (BM25 + Title)', false, index);
    results.push(bm25Res);
  }

  console.log(`\n================================================================`);
  console.log('OVERALL TEST RUN SUMMARY:');
  for (const r of results) {
    console.log(`  - Pass rate: ${r.passCount}/${r.totalQueries} (${((r.passCount / r.totalQueries) * 100).toFixed(1)}%)`);
  }
  console.log(`================================================================\n`);

  const hasAnyFailures = results.some((r) => r.failCount > 0);
  if (hasAnyFailures) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
