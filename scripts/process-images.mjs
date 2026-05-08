import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REF = path.join(__dirname, '..', 'references');
const OUT = path.join(__dirname, '..', 'public', 'moods');

const TARGET_W = 500;
const TARGET_H = 500;

async function processHappy() {
  // Image 2: active/fed — starter at ~40% of jar
  // Need to make the starter level LOWER — extend jar upward
  // Strategy: crop to jar area, then extend the top (empty jar) portion

  const img = sharp(path.join(REF, '2.png'));
  const meta = await img.metadata();

  // Crop to center on the jar, removing excess whitespace on sides
  // Image is 807x450, jar is roughly centered
  const cropW = Math.round(meta.width * 0.7);
  const cropX = Math.round((meta.width - cropW) / 2);

  const cropped = await img
    .extract({ left: cropX, top: 0, width: cropW, height: meta.height })
    .toBuffer();

  const croppedMeta = await sharp(cropped).metadata();

  // Now stretch the top portion to make jar appear taller
  // Split image: top 40% (empty jar + lid) and bottom 60% (starter area)
  const splitY = Math.round(croppedMeta.height * 0.35);

  const topPart = await sharp(cropped)
    .extract({ left: 0, top: 0, width: croppedMeta.width, height: splitY })
    .resize(TARGET_W, Math.round(TARGET_H * 0.45), { fit: 'fill' })
    .toBuffer();

  const bottomPart = await sharp(cropped)
    .extract({ left: 0, top: splitY, width: croppedMeta.width, height: croppedMeta.height - splitY })
    .resize(TARGET_W, Math.round(TARGET_H * 0.55), { fit: 'fill' })
    .toBuffer();

  await sharp({
    create: { width: TARGET_W, height: TARGET_H, channels: 4, background: { r: 253, g: 248, b: 243, alpha: 1 } }
  })
    .composite([
      { input: topPart, top: 0, left: 0 },
      { input: bottomPart, top: Math.round(TARGET_H * 0.45), left: 0 },
    ])
    .png()
    .toFile(path.join(OUT, 'happy.png'));

  console.log('✓ happy.png');
}

async function processPeak() {
  // Image 5: peak — only shows overflowing top
  // Image 1 is same art style (both 1664x928) — use its jar body
  const img5 = sharp(path.join(REF, '5.png'));
  const meta5 = await img5.metadata();
  const img1 = sharp(path.join(REF, '1.png'));
  const meta1 = await img1.metadata();

  // From image 1: take the bottom half (jar body, filled with starter)
  const jar1H = Math.round(meta1.height * 0.55);
  const jar1Top = meta1.height - jar1H;
  const cropW1 = Math.round(meta1.width * 0.55);
  const cropX1 = Math.round((meta1.width - cropW1) / 2);

  const jarBody = await img1
    .extract({ left: cropX1, top: jar1Top, width: cropW1, height: jar1H })
    .resize(TARGET_W, Math.round(TARGET_H * 0.50), { fit: 'fill' })
    .toBuffer();

  // From image 5: take the overflowing top portion
  const crop5W = Math.round(meta5.width * 0.55);
  const crop5X = Math.round((meta5.width - crop5W) / 2);
  const crop5H = Math.round(meta5.height * 0.60);

  const peakTop = await img5
    .extract({ left: crop5X, top: 0, width: crop5W, height: crop5H })
    .resize(TARGET_W, Math.round(TARGET_H * 0.55), { fit: 'fill' })
    .toBuffer();

  await sharp({
    create: { width: TARGET_W, height: TARGET_H, channels: 4, background: { r: 253, g: 248, b: 243, alpha: 1 } }
  })
    .composite([
      { input: jarBody, top: Math.round(TARGET_H * 0.50), left: 0 },
      { input: peakTop, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(OUT, 'peak.png'));

  console.log('✓ peak.png');
}

async function processNew() {
  // Image 3: new — fine as is, just normalize size
  await sharp(path.join(REF, '3.webp'))
    .resize(TARGET_W, TARGET_H, { fit: 'contain', background: { r: 253, g: 248, b: 243, alpha: 1 } })
    .png()
    .toFile(path.join(OUT, 'new.png'));

  console.log('✓ new.png');
}

async function processHungry() {
  // Image 4: hungry — fine as is, normalize size
  const img = sharp(path.join(REF, '4.png'));
  const meta = await img.metadata();

  // Crop to center on jar
  const cropW = Math.round(meta.width * 0.75);
  const cropX = Math.round((meta.width - cropW) / 2);

  await img
    .extract({ left: cropX, top: 0, width: cropW, height: meta.height })
    .resize(TARGET_W, TARGET_H, { fit: 'contain', background: { r: 253, g: 248, b: 243, alpha: 1 } })
    .png()
    .toFile(path.join(OUT, 'hungry.png'));

  console.log('✓ hungry.png');
}

async function processSleepy() {
  // Create sleepy from image 2 (happy) — apply desaturation + blue/grey tint
  // The sleepy starter is dormant, cold, hasn't been fed in a long time
  const img = sharp(path.join(REF, '2.png'));
  const meta = await img.metadata();

  const cropW = Math.round(meta.width * 0.7);
  const cropX = Math.round((meta.width - cropW) / 2);

  // First crop and resize like happy
  const cropped = await img
    .extract({ left: cropX, top: 0, width: cropW, height: meta.height })
    .toBuffer();

  const croppedMeta = await sharp(cropped).metadata();
  const splitY = Math.round(croppedMeta.height * 0.35);

  const topPart = await sharp(cropped)
    .extract({ left: 0, top: 0, width: croppedMeta.width, height: splitY })
    .resize(TARGET_W, Math.round(TARGET_H * 0.45), { fit: 'fill' })
    .toBuffer();

  const bottomPart = await sharp(cropped)
    .extract({ left: 0, top: splitY, width: croppedMeta.width, height: croppedMeta.height - splitY })
    .resize(TARGET_W, Math.round(TARGET_H * 0.55), { fit: 'fill' })
    .toBuffer();

  const composedPng = await sharp({
    create: { width: TARGET_W, height: TARGET_H, channels: 4, background: { r: 253, g: 248, b: 243, alpha: 1 } }
  })
    .composite([
      { input: topPart, top: 0, left: 0 },
      { input: bottomPart, top: Math.round(TARGET_H * 0.45), left: 0 },
    ])
    .png()
    .toBuffer();

  // Apply desaturation + slight cool hue shift for "sleepy" look
  await sharp(composedPng)
    .modulate({ saturation: 0.35, brightness: 0.92, hue: 20 })
    .png()
    .toFile(path.join(OUT, 'sleepy.png'));

  console.log('✓ sleepy.png');
}

async function main() {
  console.log('Processing mood images...');
  await processHappy();
  await processPeak();
  await processNew();
  await processHungry();
  await processSleepy();
  console.log('\nAll done! Images saved to public/moods/');
}

main().catch(console.error);
