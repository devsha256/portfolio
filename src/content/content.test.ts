import { certifications } from './certifications';
import { feedbacks } from './feedbacks';
import { learning } from './learning';

describe('static credentials content', () => {
  it.each([
    ['certifications', certifications, 6],
    ['feedbacks', feedbacks, 15],
    ['learning', learning, 309],
  ])('%s parses with unique ids', (_name, list, size) => {
    expect(list).toHaveLength(size);
    expect(new Set(list.map((item) => item.id)).size).toBe(size);
  });

  it('is sorted newest first', () => {
    for (const list of [certifications, feedbacks, learning]) {
      const dates = list.map((item) => item.date);
      expect(dates).toEqual([...dates].sort().reverse());
    }
  });

  it('points every image at a file under /img', () => {
    for (const item of [...certifications, ...feedbacks, ...learning]) {
      expect(item.image).toMatch(/^\/img\/(certifications|logos)\/[\w-]+\.png$/);
    }
  });
});
