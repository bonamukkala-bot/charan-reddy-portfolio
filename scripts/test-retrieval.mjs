import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setCachedIndex, normalizeQuery } from '../src/lib/rag/retriever.ts';
import { respond } from '../src/lib/rag/respond.ts';
import { embedQuery } from '../src/lib/rag/embedder.ts';
import { INTENT_REPLIES } from '../src/lib/rag/intents.ts';

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

    const answer = await respond(tc.query, {
      chunks: index.chunks,
      queryEmbedding,
      topK: 3,
    });

    const topResult = answer.results && answer.results.length > 0 ? answer.results[0] : null;

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
      if (answer.results && answer.results.length > 0) {
        answer.results.forEach((r, idx) => {
          console.log(`    ${idx + 1}. "${r.chunk.title}" | Score: ${r.score} | BM25: ${r.bm25} | TitleMatch: ${r.titleMatch ?? 0}`);
        });
      } else {
        console.log('    (No retrieval results - intent response)');
      }
      failures.push({
        query: tc.query,
        reason: failReason,
        results: answer.results ? answer.results.slice(0, 3) : [],
      });
    }
  }

  console.log(`\nMode ${modeName} Summary: ${passCount}/${TEST_CASES.length} PASSED (${failCount} FAILED)`);
  return { passCount, failCount, failures };
}

async function run() {
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
    console.log(`  - Pass rate: ${r.passCount}/${TEST_CASES.length} (${((r.passCount / TEST_CASES.length) * 100).toFixed(1)}%)`);
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
