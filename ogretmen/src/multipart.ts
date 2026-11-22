export interface MultipartFile {
  name: string;
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface MultipartResult {
  fields: Record<string, string>;
  files: MultipartFile[];
}

/** Küçük, bağımlılıksız multipart/form-data ayrıştırıcı. Yalnızca bu sunucunun formları için. */
export function parseMultipart(body: Buffer, contentType: string): MultipartResult {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.[1] ?? /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.[2];
  if (!boundary) throw new Error('Form sınırı bulunamadı.');
  const sep = Buffer.from(`--${boundary}`);
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];
  let cursor = body.indexOf(sep);
  while (cursor !== -1) {
    const next = body.indexOf(sep, cursor + sep.length);
    if (next === -1) break;
    let chunk = body.subarray(cursor + sep.length, next);
    if (chunk.subarray(0, 2).equals(Buffer.from('\r\n'))) chunk = chunk.subarray(2);
    if (chunk.subarray(-2).equals(Buffer.from('\r\n'))) chunk = chunk.subarray(0, -2);
    const headerEnd = chunk.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headers = chunk.subarray(0, headerEnd).toString('utf8');
      const data = chunk.subarray(headerEnd + 4);
      const name = /name="([^"]+)"/.exec(headers)?.[1];
      const filename = /filename="([^"]*)"/.exec(headers)?.[1];
      if (name && filename) {
        const mimeType = /content-type:\s*(\S+)/i.exec(headers)?.[1] ?? 'application/octet-stream';
        if (filename && data.length) files.push({ name, filename, mimeType, data });
      } else if (name) {
        fields[name] = data.toString('utf8').trim();
      }
    }
    cursor = next;
  }
  return { fields, files };
}
