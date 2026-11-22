import { describe, expect, it } from 'vitest';
import { cropFrame } from './cropFrame';

describe('cropFrame', () => {
  it('şeridi sayfanın kendi oranında bırakır', () => {
    const frame = cropFrame({ x: 0.34, y: 0.39, w: 0.44, h: 0.16 }, 900, 1200);
    expect(frame.aspectRatio).toBeCloseTo(396 / 192, 5);
    expect(frame.maxWidthPx).toBe(640);
    expect(frame.image.widthPercent).toBeCloseTo(100 / 0.44, 5);
    expect(frame.image.heightPercent).toBeCloseTo(100 / 0.16, 5);
    expect(frame.image.leftPercent).toBeCloseTo((-0.34 / 0.44) * 100, 5);
    expect(frame.image.topPercent).toBeCloseTo((-0.39 / 0.16) * 100, 5);
  });

  it('gösterilen fotoğrafın en/boy oranı kaynağın oranına eşittir', () => {
    const box = { x: 0.4, y: 0.48, w: 0.48, h: 0.22 };
    const frame = cropFrame(box, 900, 1200);
    const containerAspect = frame.aspectRatio;
    const imageAspect = (frame.image.widthPercent / frame.image.heightPercent) * containerAspect;
    expect(imageAspect).toBeCloseTo(900 / 1200, 5);
  });

  it('küçük bir bölgeyi iki kattan fazla büyütmez', () => {
    const frame = cropFrame({ x: 0, y: 0, w: 0.05, h: 0.05 }, 900, 1200);
    expect(frame.maxWidthPx).toBe(90);
  });
});
