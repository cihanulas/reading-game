import { describe, expect, it } from 'vitest';
import { edgeRate } from './tts.ts';

describe('edgeRate', () => {
  it('kaydırıcının ortasını doğal hızda bırakır', () => {
    expect(edgeRate(1)).toBe('default');
    expect(edgeRate(0.8)).toBe('-20%');
    expect(edgeRate(1.2)).toBe('+20%');
  });
});
