import { escapeRegex } from '@/utils/search-utils';

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  if (!query || query.trim() === '') {
    return <span className={className}>{text}</span>;
  }

  try {
    const escapedQuery = escapeRegex(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          const isMatch = regex.test(part);
          regex.lastIndex = 0; // Reset regex state

          return isMatch ? (
            <mark
              key={index}
              className="bg-accent/30 text-foreground rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </span>
    );
  } catch (error) {
    // Fallback if regex fails
    console.error('HighlightedText regex error:', error);
    return <span className={className}>{text}</span>;
  }
}
