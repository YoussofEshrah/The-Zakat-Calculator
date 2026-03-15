// Generates a simple 256x256 icon for the Zakat Calculator
// Uses only Node built-ins (zlib + Buffer) — no extra dependencies needed

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function makePNG(size) {
  // Build RGBA raw image
  const raw = Buffer.alloc((1 + size * 4) * size);

  for (let y = 0; y < size; y++) {
    const rowBase = y * (1 + size * 4);
    raw[rowBase] = 0; // filter: None

    for (let x = 0; x < size; x++) {
      const px = rowBase + 1 + x * 4;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const r = size * 0.5;
      const inner = size * 0.35;

      // Background: transparent
      let pr = 0, pg = 0, pb = 0, pa = 0;

      if (dist <= r) {
        // Outer circle: primary green
        pr = 13; pg = 150; pb = 104; pa = 255;
      }

      if (dist <= inner) {
        // Inner circle: white
        pr = 255; pg = 255; pb = 255; pa = 255;
      }

      // Simple crescent / 'Z' shape inside white circle
      // Draw a bold 'Z' glyph via pixel ranges (handcrafted 40% inner area)
      const s = size * 0.22;
      const nx = cx / s; // normalized -1..1
      const ny = cy / s;

      if (dist <= inner) {
        // Draw Z shape: top bar, diagonal, bottom bar
        const topBar   = ny > -0.72 && ny < -0.44 && nx > -0.6 && nx < 0.65;
        const botBar   = ny >  0.44 && ny <  0.72 && nx > -0.6 && nx < 0.65;
        const diag     = (ny > -0.44 && ny < 0.44) &&
                         (nx > -0.65 + (-ny + 0.44) / (0.88) * 1.3 - 0.15) &&
                         (nx < -0.65 + (-ny + 0.44) / (0.88) * 1.3 + 0.15);

        if (topBar || botBar || diag) {
          pr = 13; pg = 135; pb = 94; pa = 255;
        }
      }

      raw[px]     = pr;
      raw[px + 1] = pg;
      raw[px + 2] = pb;
      raw[px + 3] = pa;
    }
  }

  const idat = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const png = makePNG(256);
fs.writeFileSync(path.join(outDir, 'icon.png'), png);
console.log('Generated assets/icons/icon.png (256x256)');
