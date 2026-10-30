import { splitUnits } from '../src/lib/rag/sentences.ts';

export function runSentenceTests() {
  const tests = [
    {
      name: 'RecruitMate Live/Code',
      input: 'Live: https://recruit-mate-chi.vercel.app. Code: https://github.com/bonamukkala-bot/RecruitMate',
      expected: [
        'Live: https://recruit-mate-chi.vercel.app.',
        'Code: https://github.com/bonamukkala-bot/RecruitMate'
      ]
    },
    {
      name: 'B.Sc Computer Science',
      input: 'I am a second-year B.Sc Computer Science student at NIAT Hyderabad. My specialization is Generative AI.',
      expected: [
        'I am a second-year B.Sc Computer Science student at NIAT Hyderabad.',
        'My specialization is Generative AI.'
      ]
    },
    {
      name: '0.93 decimal',
      input: 'The model reached 0.93 on accuracy. That was a high score.',
      expected: [
        'The model reached 0.93 on accuracy.',
        'That was a high score.'
      ]
    },
    {
      name: 'Email address',
      input: 'Email me at bonamukkalacharan@gmail.com for details. I reply in 24 hours.',
      expected: [
        'Email me at bonamukkalacharan@gmail.com for details.',
        'I reply in 24 hours.'
      ]
    },
    {
      name: 'Bullet list',
      input: '- Languages: Python\n- Frontend: React',
      expected: [
        '- Languages: Python',
        '- Frontend: React'
      ]
    }
  ];

  let passed = 0;
  console.log('\n--- Sentence Splitter Unit Tests ---');
  for (const t of tests) {
    const result = splitUnits(t.input);
    const match = JSON.stringify(result) === JSON.stringify(t.expected);
    if (match) {
      console.log(`PASS: ${t.name}`);
      passed++;
    } else {
      console.log(`FAIL: ${t.name}`);
      console.log('  Expected:', t.expected);
      console.log('  Actual:  ', result);
    }
  }

  console.log(`Sentence Splitter: ${passed}/${tests.length} tests passed.\n`);
  if (passed !== tests.length) {
    throw new Error('Sentence splitter tests failed!');
  }
}

// Allow direct execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.endsWith('test-sentences.mjs')) {
  runSentenceTests();
}

