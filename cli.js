#!/usr/bin/env node
import { tonalRampFromHex, themeRampsFromHex } from './src/palette.js';

const hex = process.argv[2];
const mode = process.argv[3] || 'theme';

if (!hex) {
  console.error('Usage: node cli.js <#HEX> [tonal|theme]');
  process.exit(1);
}

const min = Number(process.env.MIN ?? 0);
const max = Number(process.env.MAX ?? 100);

if (mode === 'tonal') {
  console.log(JSON.stringify({ hex, minTone: min, maxTone: max, tones: tonalRampFromHex(hex, min, max) }, null, 2));
} else {
  console.log(JSON.stringify({ hex, minTone: min, maxTone: max, palettes: themeRampsFromHex(hex, min, max) }, null, 2));
}
