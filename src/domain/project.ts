import { slugify } from './slug';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Period = { startMonth: string; endMonth: string | null };
type Skilled = { skills: readonly string[] };
export type SkillCount = { name: string; slug: string; count: number };

function monthLabel(isoDate: string): string {
  const [year, month] = isoDate.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatPeriod(startMonth: Period['startMonth'], endMonth: Period['endMonth']): string {
  const start = monthLabel(startMonth);
  if (endMonth === null) return `${start} – Present`;
  const end = monthLabel(endMonth);
  return start === end ? start : `${start} – ${end}`;
}

export function collectSkills(projects: readonly Skilled[]): SkillCount[] {
  const counts = new Map<string, SkillCount>();
  for (const project of projects) {
    for (const name of new Set(project.skills)) {
      const slug = slugify(name);
      const entry = counts.get(slug) ?? { name, slug, count: 0 };
      counts.set(slug, { ...entry, count: entry.count + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function filterBySkill<T extends Skilled>(projects: readonly T[], skillSlug: string | null): readonly T[] {
  if (!skillSlug) return projects;
  return projects.filter((project) => project.skills.some((name) => slugify(name) === skillSlug));
}
