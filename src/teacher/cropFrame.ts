import type { Box } from '../../ogretmen/src/types';

export interface CropFrame {
  /** Kırpılan bölgenin gerçek en/boy oranı. */
  aspectRatio: number;
  /** Bölgeyi en fazla iki kat büyüt; tahtada 640 pikselden geniş gösterme. */
  maxWidthPx: number;
  image: {
    widthPercent: number;
    heightPercent: number;
    leftPercent: number;
    topPercent: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Sayfa parçasını, fotoğrafın kendi oranını bozmadan çerçeveye yerleştirir. */
export function cropFrame(box: Box, naturalWidth: number, naturalHeight: number): CropFrame {
  const width = Math.max(1, naturalWidth);
  const height = Math.max(1, naturalHeight);
  const w = clamp(box.w, 0.02, 1);
  const h = clamp(box.h, 0.02, 1);
  const x = clamp(box.x, 0, 1 - w);
  const y = clamp(box.y, 0, 1 - h);
  const pixelW = w * width;
  const pixelH = h * height;
  return {
    aspectRatio: pixelW / pixelH,
    maxWidthPx: Math.round(Math.min(640, pixelW * 2)),
    image: {
      widthPercent: 100 / w,
      heightPercent: 100 / h,
      leftPercent: (-x / w) * 100,
      topPercent: (-y / h) * 100,
    },
  };
}
