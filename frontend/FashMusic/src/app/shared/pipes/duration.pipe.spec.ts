import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('formats seconds into mm:ss', () => {
    expect(pipe.transform(0)).toBe('0:00');
    expect(pipe.transform(65)).toBe('1:05');
    expect(pipe.transform(467)).toBe('7:47');
  });

  it('handles negative and NaN values safely', () => {
    expect(pipe.transform(-5)).toBe('0:00');
    expect(pipe.transform(Number.NaN)).toBe('0:00');
  });
});
