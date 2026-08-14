import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty string when no date is provided', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it('formats a past Date in seconds', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-05T12:00:00.000Z').getTime());

    const tenSecondsAgo = new Date('2026-01-05T11:59:50.000Z');
    const result = pipe.transform(tenSecondsAgo);

    expect(result).toBe('10 seconds ago');
  });

  it('formats a past ISO string in minutes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-05T12:00:00.000Z').getTime());

    const oneMinuteAgoIso = '2026-01-05T11:59:00.000Z';
    expect(pipe.transform(oneMinuteAgoIso)).toBe('1 minute ago');
  });

  it('formats a future Date in hours', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-05T12:00:00.000Z').getTime());

    const inTwoHours = new Date('2026-01-05T14:00:00.000Z');
    expect(pipe.transform(inTwoHours)).toBe('in 2 hours');
  });
});
