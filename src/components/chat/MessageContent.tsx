import React from 'react';

interface MessageContentProps {
  text: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

/**
 * Removes dangling, unclosed double-asterisks during word-by-word streaming
 * so partial text never displays broken markdown syntax.
 */
export function cleanPartialMarkdown(text: string): string {
  const boldMatches = text.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    const lastBoldIdx = text.lastIndexOf('**');
    if (lastBoldIdx !== -1) {
      return text.slice(0, lastBoldIdx) + text.slice(lastBoldIdx + 2);
    }
  }
  return text;
}

/**
 * Safely parses inline markdown (bold, urls, emails) into React nodes.
 * Strictly avoids dangerouslySetInnerHTML.
 */
function parseInline(text: string): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*)|(https:\/\/[^\s<>)"]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold text
      const boldText = match[1].slice(2, -2);
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-[#F4F4F0]">
          {boldText}
        </strong>
      );
    } else if (match[2]) {
      // HTTPS URL: overflow-wrap: anywhere ONLY on the link, never on normal words
      let url = match[2];
      let trailingPunct = '';
      if (/[.,;:)\]]$/.test(url)) {
        trailingPunct = url.slice(-1);
        url = url.slice(0, -1);
      }
      nodes.push(
        <a
          key={`url-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ overflowWrap: 'anywhere' }}
          className="text-[#C6FF3D] underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {url}
        </a>
      );
      if (trailingPunct) {
        nodes.push(trailingPunct);
      }
    } else if (match[3]) {
      // Email address: white-space: nowrap so it never breaks mid-address
      const email = match[3];
      nodes.push(
        <a
          key={`email-${match.index}`}
          href={`mailto:${email}`}
          style={{ whiteSpace: 'nowrap' }}
          className="text-[#C6FF3D] underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {email}
        </a>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function MessageContent({
  text,
  isUser = false,
  isStreaming = false,
}: MessageContentProps) {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const rawText = isStreaming ? cleanPartialMarkdown(text) : text;
  // Split text by blank lines (double newlines) into paragraph blocks
  const blocks = rawText.split(/\n\s*\n/);

  const caretNode = isStreaming ? (
    <span
      aria-hidden="true"
      className="inline-block w-[2px] h-[1.1em] bg-[#C6FF3D] ml-0.5 align-middle animate-pulse"
    />
  ) : null;

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[#D4D4D8]">
      {blocks.map((block, bIdx) => {
        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length === 0) return null;
        const isLastBlock = bIdx === blocks.length - 1;

        // Check if all lines in this block are bullet items
        const isAllBullets = lines.every((l) => l.startsWith('- '));
        if (isAllBullets) {
          return (
            <ul
              key={bIdx}
              className="space-y-1.5 my-1 pl-4 list-disc list-outside marker:text-[#C6FF3D]"
            >
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^- \s*/, '');
                if (!itemText.trim()) return null;
                const isLastLine = isLastBlock && lIdx === lines.length - 1;
                return (
                  <li key={lIdx}>
                    {parseInline(itemText)}
                    {isLastLine && caretNode}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Mixed block containing some bullet lines
        const hasBullets = lines.some((l) => l.startsWith('- '));
        if (hasBullets) {
          return (
            <div key={bIdx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const isLastLine = isLastBlock && lIdx === lines.length - 1;
                if (line.startsWith('- ')) {
                  const itemText = line.replace(/^- \s*/, '');
                  if (!itemText.trim()) return null;
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1">
                      <span className="text-[#C6FF3D] shrink-0 select-none leading-tight">•</span>
                      <span>
                        {parseInline(itemText)}
                        {isLastLine && caretNode}
                      </span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInline(line)}
                    {isLastLine && caretNode}
                  </p>
                );
              })}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInline(line)}
                {isLastBlock && lIdx === lines.length - 1 && caretNode}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
