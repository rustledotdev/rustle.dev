import { describe, it, expect } from 'vitest';
import { format } from '../utils/placeholders';

describe('placeholders', () => {
  it('replaces positional placeholders', () => {
    const s = format('Hello, {{0}}! Today is {{1}}', { p0: 'Alice', p1: 'Friday' });
    expect(s).toBe('Hello, Alice! Today is Friday');
  });

  it('leaves missing placeholders intact', () => {
    const s = format('Hi {{0}} and {{1}}', { p0: 'Bob' });
    expect(s).toBe('Hi Bob and {{1}}');
  });
});

