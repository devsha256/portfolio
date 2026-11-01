import type { PostStatus } from './contracts';

const WORDS_PER_MINUTE = 220;

type Publication = { status: PostStatus; publishedAt: Date | null };

/** Status change rule: the first publish stamps `publishedAt`; it is never moved or cleared afterwards. */
export function applyStatus(current: Publication, next: PostStatus, now: Date): Publication {
  if (next === 'draft') return { status: 'draft', publishedAt: current.publishedAt };
  return { status: 'published', publishedAt: current.publishedAt ?? now };
}

export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
