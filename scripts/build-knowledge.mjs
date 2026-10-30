import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline, env } from '@xenova/transformers';
import { splitUnits } from '../src/lib/rag/sentences.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configure transformers env
env.allowLocalModels = false;

function joinUnits(units) {
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

async function buildKnowledge() {
  const mdPath = path.join(rootDir, 'src', 'data', 'knowledge.md');
  const outPath = path.join(rootDir, 'public', 'knowledge-index.json');

  console.log('Reading knowledge file from:', mdPath);
  const rawContent = await fs.readFile(mdPath, 'utf8');

  // Split by headings starting with "## "
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const sections = normalized.split(/\n(?=## )/g);

  const rawChunks = [];
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed.startsWith('## ')) continue;

    const firstLineEnd = trimmed.indexOf('\n');
    const headingLine = firstLineEnd === -1 ? trimmed : trimmed.slice(0, firstLineEnd);
    const body = firstLineEnd === -1 ? '' : trimmed.slice(firstLineEnd + 1).trim();

    const rawHeading = headingLine.replace(/^##\s+/, '').trim();
    if (!rawHeading) continue;

    let kind = 'info';
    let title = rawHeading;

    if (rawHeading.startsWith('Q:')) {
      kind = 'faq';
      title = rawHeading.replace(/^Q:\s*/i, '').trim();
    } else if (rawHeading.startsWith('Project:')) {
      kind = 'project';
    }

    const id = rawHeading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Parse and remove "Also asked as:", "Short:", and "Topic:" lines from body
    let variants = [];
    let suggestion = undefined;
    let shortRaw = undefined;
    let topicRaw = undefined;
    const lines = body.split('\n');
    const cleanedLines = [];

    for (const line of lines) {
      const matchVariants = line.match(/^Also asked as:\s*(.+)$/i);
      const matchShort = line.match(/^Short:\s*(.+)$/i);
      const matchTopic = line.match(/^Topic:\s*(.+)$/i);

      if (matchVariants) {
        const rawVariants = matchVariants[1]
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);
        variants = rawVariants.slice(0, 12);
        if (variants.length > 0) {
          suggestion = variants[0];
        }
      } else if (matchShort) {
        shortRaw = matchShort[1].trim();
      } else if (matchTopic) {
        topicRaw = matchTopic[1].trim();
      } else {
        cleanedLines.push(line);
      }
    }

    const cleanedText = cleanedLines.join('\n').trim();

    rawChunks.push({
      id,
      rawHeading,
      title,
      text: cleanedText,
      kind,
      variants,
      suggestion,
      shortRaw,
      topicRaw,
    });
  }

  // Create heading-to-id map to validate Topic: references
  const headingToId = new Map();
  for (const rc of rawChunks) {
    headingToId.set(rc.rawHeading, rc.id);
  }

  // Process units, short, detail, links, relatedId for each chunk
  for (const rc of rawChunks) {
    const units = splitUnits(rc.text);
    rc.units = units;

    // links: array of unit strings starting with "Live:" or "Code:"
    const links = units.filter((u) => u.startsWith('Live:') || u.startsWith('Code:'));
    rc.links = links;

    // short: the Short sentences, plus (if chunk text has a "Live:" unit not already in Short) a newline and that Live unit
    if (rc.shortRaw) {
      const liveUnit = units.find((u) => u.startsWith('Live:'));
      if (liveUnit && !rc.shortRaw.includes(liveUnit)) {
        rc.short = `${rc.shortRaw}\n${liveUnit}`;
      } else {
        rc.short = rc.shortRaw;
      }

      // detail: all units of full text NOT in short, joined with spaces (bullets with newlines)
      const shortUnits = splitUnits(rc.short);
      const shortUnitSet = new Set(shortUnits);
      const detailUnits = units.filter((u) => !shortUnitSet.has(u));
      if (detailUnits.length > 0) {
        rc.detail = joinUnits(detailUnits).trim();
      }
    }

    // relatedId: the id of the section named in Topic line
    if (rc.topicRaw) {
      const targetId = headingToId.get(rc.topicRaw);
      if (!targetId) {
        throw new Error(
          `Build failed: Topic "${rc.topicRaw}" in section "${rc.rawHeading}" references a heading that does not exist!`
        );
      }
      rc.relatedId = targetId;
    }
  }

  console.log(`Parsed ${rawChunks.length} chunks from knowledge.md.`);
  console.log('Loading embedding model Xenova/all-MiniLM-L6-v2 (quantized)...');

  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  console.log('Generating embeddings...');
  const chunks = [];
  const kindCounts = { faq: 0, project: 0, info: 0 };

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    const textToEmbed = `${chunk.title}. ${chunk.text}`;

    const output = await extractor(textToEmbed, {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = Array.from(output.data).map((v) => Number(v.toFixed(4)));

    // Embed each variant separately
    const variantEmbeddings = [];
    if (chunk.variants && chunk.variants.length > 0) {
      for (const variant of chunk.variants) {
        const vOutput = await extractor(variant, {
          pooling: 'mean',
          normalize: true,
        });
        variantEmbeddings.push(Array.from(vOutput.data).map((v) => Number(v.toFixed(4))));
      }
    }

    chunks.push({
      id: chunk.id,
      title: chunk.title,
      text: chunk.text,
      kind: chunk.kind,
      embedding,
      ...(chunk.variants && chunk.variants.length > 0 ? { variants: chunk.variants } : {}),
      ...(chunk.suggestion ? { suggestion: chunk.suggestion } : {}),
      ...(variantEmbeddings.length > 0 ? { variantEmbeddings } : {}),
      ...(chunk.short ? { short: chunk.short } : {}),
      ...(chunk.detail ? { detail: chunk.detail } : {}),
      ...(chunk.links && chunk.links.length > 0 ? { links: chunk.links } : {}),
      ...(chunk.relatedId ? { relatedId: chunk.relatedId } : {}),
      units: chunk.units,
    });

    kindCounts[chunk.kind] = (kindCounts[chunk.kind] || 0) + 1;
    if ((i + 1) % 5 === 0 || i === rawChunks.length - 1) {
      console.log(`Embedded ${i + 1}/${rawChunks.length} chunks...`);
    }
  }

  const indexData = {
    model: 'Xenova/all-MiniLM-L6-v2',
    createdAt: new Date().toISOString(),
    chunks,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  // Format JSON with 2 spaces, keeping flat number arrays on a single line
  const jsonContent = JSON.stringify(indexData, null, 2).replace(
    /\[\s*([\s\S]*?)\s*\]/g,
    (match, inner) => {
      if (!inner.includes('{') && !inner.includes('[')) {
        return '[' + inner.trim().split(/\s*,\s*/).join(', ') + ']';
      }
      return match;
    }
  );
  await fs.writeFile(outPath, jsonContent, 'utf8');

  const stats = await fs.stat(outPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n--- Knowledge Base Build Summary ---');
  console.log(`Total Chunks: ${chunks.length}`);
  console.log(`Kind breakdown: FAQ: ${kindCounts.faq}, Project: ${kindCounts.project}, Info: ${kindCounts.info}`);
  console.log(`Output File: ${outPath}`);
  console.log(`File Size: ${sizeKB} KB (${sizeMB} MB)`);

  if (stats.size > 1.6 * 1024 * 1024) {
    console.warn('WARNING: File size exceeds 1.6 MB! Consider dropping units.');
  }
}

buildKnowledge().catch((err) => {
  console.error('Error building knowledge index:', err);
  process.exit(1);
});
