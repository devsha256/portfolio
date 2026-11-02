/** Freezes only Date (timers keep running, so Testing Library can still wait) for every test in the file. */
export function freezeDate(iso: string) {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(iso));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}
