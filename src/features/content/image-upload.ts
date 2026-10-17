export const MAX_CONTENT_IMAGE_BYTES = 8 * 1024 * 1024;
export function imageMimeType(bytes: Uint8Array): string | null {
  const starts = (signature:number[]) => signature.every((value,index)=>bytes[index]===value);
  const ascii = (start:number,end:number) => String.fromCharCode(...bytes.slice(start,end));
  if (starts([0xff,0xd8,0xff])) return "image/jpeg";
  if (starts([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) return "image/png";
  if (["GIF87a","GIF89a"].includes(ascii(0,6))) return "image/gif";
  if (ascii(0,4)==="RIFF" && ascii(8,12)==="WEBP") return "image/webp";
  if (ascii(4,8)==="ftyp" && ["avif","avis"].includes(ascii(8,12))) return "image/avif";
  return null;
}
