const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Tipe file harus jpg, png, atau webp.";
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return "Ukuran file maksimal 10MB.";
  }
  return null;
}

function resizeToCanvas(bitmap, maxWidth) {
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("webp_conversion_failed"))),
      "image/webp",
      quality
    );
  });
}

export async function processImageToWebp(file, options) {
  const opts = options || {};
  // Thumbs render at up to ~50vw on retina screens, so they need ~1200px to stay sharp.
  const thumbWidth = opts.thumbWidth || 1200;
  const fullWidth = opts.fullWidth || 2400;
  const quality = opts.quality || 0.92;

  const bitmap = await createImageBitmap(file);
  const thumbCanvas = resizeToCanvas(bitmap, thumbWidth);
  const fullCanvas = resizeToCanvas(bitmap, fullWidth);
  const [thumbBlob, fullBlob] = await Promise.all([
    canvasToWebpBlob(thumbCanvas, quality),
    canvasToWebpBlob(fullCanvas, quality),
  ]);
  return { thumbBlob, fullBlob };
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function publicUrlToRepoPath(url) {
  return "public" + url;
}
