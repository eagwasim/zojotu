import sharp from "sharp";

/** Every stored upload is at most this size. */
export const MAX_STORED_IMAGE_BYTES = 1024 * 1024;

/** Longest edge to start from. Plenty for listings and the detail view. */
const START_EDGE = 2560;
/** Never shrink below this; quality drops further instead. */
const MIN_EDGE = 800;
const QUALITIES = [82, 72, 62];
const MIN_QUALITY = 50;

export interface FittedImage {
  buffer: Buffer;
  /** Extension and MIME type of `buffer`, which may differ from the upload's. */
  ext: ".jpg" | ".png" | ".webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Shrinks an uploaded photo to `maxBytes` or less.
 *
 * Small uploads are stored as they are. Larger ones are turned upright from their EXIF
 * orientation, have their metadata (including GPS) dropped, and are re-encoded as JPEG,
 * lowering quality and then dimensions until they fit. Transparency is flattened onto
 * white, which is fine for watch photos.
 */
export async function fitImageToSize(
  input: Buffer,
  mimeType: string,
  maxBytes = MAX_STORED_IMAGE_BYTES
): Promise<FittedImage> {
  if (input.length <= maxBytes) {
    if (mimeType === "image/png") return { buffer: input, ext: ".png", mimeType };
    if (mimeType === "image/webp") return { buffer: input, ext: ".webp", mimeType };
    return { buffer: input, ext: ".jpg", mimeType: "image/jpeg" };
  }

  const encode = (edge: number, quality: number) =>
    sharp(input, { failOn: "error" })
      .rotate()
      .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

  let edge = START_EDGE;
  let out = Buffer.alloc(0);
  for (;;) {
    for (const q of QUALITIES) {
      out = await encode(edge, q);
      if (out.length <= maxBytes) return { buffer: out, ext: ".jpg", mimeType: "image/jpeg" };
    }
    if (edge <= MIN_EDGE) break;
    edge = Math.max(MIN_EDGE, Math.round(edge * 0.75));
  }
  // Last resort for pathological images (huge noise): smallest size, lowest quality.
  out = await encode(MIN_EDGE, MIN_QUALITY);
  if (out.length <= maxBytes) return { buffer: out, ext: ".jpg", mimeType: "image/jpeg" };
  throw new Error("Image couldn't be reduced to 1 MB");
}
