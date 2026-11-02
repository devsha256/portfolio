import { useState } from 'react';
import type { SiteProfile } from '../domain/contracts';
import { summaryParagraphs } from '../lib/summary';

export function Summary({ profile, className = '' }: { profile: SiteProfile; className?: string }) {
  const [now] = useState(() => new Date());
  return (
    <div className={`max-w-prose space-y-4 text-lg leading-relaxed ${className}`}>
      {summaryParagraphs(profile, now).map((text) => (
        <p key={text}>{text}</p>
      ))}
    </div>
  );
}
