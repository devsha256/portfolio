import { collectSkills, filterBySkill, formatPeriod } from './project.js';

const projects = [
  { startMonth: '2025-07-01', endMonth: null, skills: ['DataWeave', 'Boomi'] },
  { startMonth: '2024-01-01', endMonth: '2024-06-01', skills: ['DataWeave', 'Maven'] },
];

describe('formatPeriod', () => {
  it('shows Present for an open project', () => {
    expect(formatPeriod('2025-07-01', null)).toBe('Jul 2025 – Present');
  });

  it('shows both months for a closed project', () => {
    expect(formatPeriod('2024-01-01', '2024-06-01')).toBe('Jan 2024 – Jun 2024');
  });

  it('collapses a single-month project', () => {
    expect(formatPeriod('2023-12-01', '2023-12-01')).toBe('Dec 2023');
  });
});

describe('collectSkills', () => {
  it('counts each skill once per project, most used first then by name', () => {
    expect(collectSkills(projects)).toEqual([
      { name: 'DataWeave', slug: 'dataweave', count: 2 },
      { name: 'Boomi', slug: 'boomi', count: 1 },
      { name: 'Maven', slug: 'maven', count: 1 },
    ]);
  });
});

describe('filterBySkill', () => {
  it('keeps projects whose skills match the slug', () => {
    expect(filterBySkill(projects, 'maven')).toEqual([projects[1]]);
  });

  it('returns everything when no slug is given', () => {
    expect(filterBySkill(projects, null)).toBe(projects);
  });
});
