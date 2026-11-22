import { describe, expect, it } from 'vitest';
import { parseMultipart } from './multipart.ts';

describe('parseMultipart', () => {
  it('metin alanı ve dosyayı ayırır', () => {
    const body = Buffer.from(
      '--sinir\r\nContent-Disposition: form-data; name="konu"\r\n\r\nSu döngüsü\r\n' +
        '--sinir\r\nContent-Disposition: form-data; name="resim"; filename="sayfa.jpg"\r\nContent-Type: image/jpeg\r\n\r\n' +
        'FOTO\r\n--sinir--\r\n',
    );
    const result = parseMultipart(body, 'multipart/form-data; boundary=sinir');
    expect(result.fields.konu).toBe('Su döngüsü');
    expect(result.files).toEqual([
      { name: 'resim', filename: 'sayfa.jpg', mimeType: 'image/jpeg', data: Buffer.from('FOTO') },
    ]);
  });
});
