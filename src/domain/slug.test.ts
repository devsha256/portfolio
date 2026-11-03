import { slugify } from './slug.js';

describe('slugify', () => {
  it.each([
    ['MuleSoft Anypoint Platform', 'mulesoft-anypoint-platform'],
    ['XML Schema Definition (XSD)', 'xml-schema-definition-xsd'],
    ['  DataWeave Deep Dive: JSON!  ', 'dataweave-deep-dive-json'],
    ['Café & Crème', 'cafe-creme'],
    ['Munit', 'munit'],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('caps length at 80 without a trailing dash', () => {
    const slug = slugify(`${'a'.repeat(79)} b`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });
});
