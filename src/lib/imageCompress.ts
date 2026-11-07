// Submissions live in localStorage (~5 MB for the whole app), so screenshots are downscaled
// and re-encoded as JPEG before saving. shortcut: data URLs in localStorage, upgrade to
// Supabase Storage (store the URL only) when the live backend is wired up.
export const MAX_IMAGES = 5;
const MAX_DIMENSION = 1280;
const QUALITY = 0.72;

export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image.`);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Could not read "${file.name}".`));
      el.src = url;
    });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not supported in this browser.');
    ctx.fillStyle = '#fff'; // transparent PNGs would turn black as JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}
