import { useState } from 'react';
import { summaryParagraphs } from '../lib/summary';

export function Summary({ className = '' }: { className?: string }) {
  const [paragraphs] = useState(() => summaryParagraphs(new Date()));
  return (
    <div className={`max-w-prose space-y-4 text-lg leading-relaxed ${className}`}>
      {paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </div>
  );
}
