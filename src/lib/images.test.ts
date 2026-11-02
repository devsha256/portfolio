import { KNOWN_IMAGES } from './images';

/** Every file under public/img, as `/img/...` paths (Vite resolves the glob at transform time). */
const filesOnDisk = Object.keys(import.meta.glob('../../public/img/**/*.png')).map((path) => path.replace('../../public', ''));

describe('KNOWN_IMAGES', () => {
  it.each(KNOWN_IMAGES)('%s exists under public/', (path) => {
    expect(filesOnDisk).toContain(path);
  });

  it('offers every image in public/img', () => {
    expect([...KNOWN_IMAGES].sort()).toEqual([...filesOnDisk].sort());
  });
});
