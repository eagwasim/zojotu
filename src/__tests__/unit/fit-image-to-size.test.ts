// @vitest-environment node
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { fitImageToSize, MAX_STORED_IMAGE_BYTES } from "@/lib/images/fit-to-size";

/** Random noise barely compresses, so this reliably makes a large file. */
function noise(width: number, height: number, channels: 3 | 4 = 3) {
  const raw = Buffer.alloc(width * height * channels);
  for (let i = 0; i < raw.length; i++) raw[i] = (Math.random() * 256) | 0;
  return sharp(raw, { raw: { width, height, channels } });
}

// Noise is the worst case for compression, so these encode several times.
describe("fitImageToSize", { timeout: 20_000 }, () => {
  it("stores small uploads untouched", async () => {
    const small = await noise(200, 150).jpeg().toBuffer();
    const out = await fitImageToSize(small, "image/jpeg");
    expect(out.buffer).toBe(small);
    expect(out).toMatchObject({ ext: ".jpg", mimeType: "image/jpeg" });
  });

  it("keeps the format of a small PNG", async () => {
    const png = await noise(64, 64).png().toBuffer();
    expect(await fitImageToSize(png, "image/png")).toMatchObject({ ext: ".png", mimeType: "image/png" });
  });

  it("resizes a large photo to 1 MB or less as JPEG", async () => {
    const big = await noise(4000, 3000).jpeg({ quality: 100 }).toBuffer();
    expect(big.length).toBeGreaterThan(MAX_STORED_IMAGE_BYTES);
    const out = await fitImageToSize(big, "image/jpeg");
    expect(out.buffer.length).toBeLessThanOrEqual(MAX_STORED_IMAGE_BYTES);
    expect(out).toMatchObject({ ext: ".jpg", mimeType: "image/jpeg" });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe("jpeg");
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2560);
  });

  it("flattens a large transparent PNG into a JPEG", async () => {
    const big = await noise(2000, 2000, 4).png().toBuffer();
    expect(big.length).toBeGreaterThan(MAX_STORED_IMAGE_BYTES);
    const out = await fitImageToSize(big, "image/png");
    expect(out.buffer.length).toBeLessThanOrEqual(MAX_STORED_IMAGE_BYTES);
    expect((await sharp(out.buffer).metadata()).hasAlpha).toBe(false);
  });

  it("turns photos upright from EXIF orientation", async () => {
    // 3000×2000 stored sideways, with EXIF saying "rotate 90°".
    const sideways = await noise(3000, 2000).withMetadata({ orientation: 6 }).jpeg({ quality: 100 }).toBuffer();
    const out = await fitImageToSize(sideways, "image/jpeg");
    const meta = await sharp(out.buffer).metadata();
    expect(meta.height!).toBeGreaterThan(meta.width!);
    expect(meta.orientation ?? 1).toBe(1);
  });

  it("rejects files that aren't images", async () => {
    await expect(fitImageToSize(Buffer.alloc(2 * MAX_STORED_IMAGE_BYTES, 7), "image/jpeg")).rejects.toThrow();
  });
});
