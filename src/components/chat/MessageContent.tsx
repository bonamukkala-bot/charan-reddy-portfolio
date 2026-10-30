import React from 'react';

interface MessageContentProps {
  text: string;
  isUser?: boolean;
}

/**
 * Safely parses inline markdown (bold, urls, emails) into React nodes.
 * Strictly avoids dangerouslySetInnerHTML.
 */
function parseInline(text: string): React.ReactNode[] {
  // Regex to match:
  // 1. Bold: **text**
  // 2. HTTPS URLs: https://...
  // 3. Email addresses: ...@...
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
      // HTTPS URL
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
          className="text-[#C6FF3D] underline underline-offset-2 hover:opacity-80 transition-opacity break-all"
        >
          {url}
        </a>
      );
      if (trailingPunct) {
        nodes.push(trailingPunct);
      }
    } else if (match[3]) {
      // Email address
      const email = match[3];
      nodes.push(
        <a
          key={`email-${match.index}`}
          href={`mailto:${email}`}
          className="text-[#C6FF3D] underline underline-offset-2 hover:opacity-80 transition-opacity break-all"
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

export function MessageContent({ text, isUser = false }: MessageContentProps) {
  if (isUser) {
    return <p className="whitespace-pre-wrap break-words">{text}</p>;
  }

  // Split text by blank lines (double newlines) into paragraph blocks
  const blocks = text.split(/\n\s*\n/);

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[#D4D4D8] break-words">
      {blocks.map((block, bIdx) => {
        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length === 0) return null;

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
                return <li key={lIdx}>{parseInline(itemText)}</li>;
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
                if (line.startsWith('- ')) {
                  const itemText = line.replace(/^- \s*/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1">
                      <span className="text-[#C6FF3D] shrink-0 select-none leading-tight">•</span>
                      <span>{parseInline(itemText)}</span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInline(line)}
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
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
