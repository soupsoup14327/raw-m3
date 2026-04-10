import { CorePalette } from '../node_modules/@material/material-color-utilities/palettes/core_palette.js';
import { TonalPalette } from '../node_modules/@material/material-color-utilities/palettes/tonal_palette.js';
import { argbFromHex, hexFromArgb } from '../node_modules/@material/material-color-utilities/utils/string_utils.js';

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;

function clampTone(n) {
  const t = Number(n);
  if (Number.isNaN(t)) return null;
  return Math.min(100, Math.max(0, Math.round(t)));
}

function rampFromPalette(palette, minTone, maxTone) {
  const out = {};
  const lo = clampTone(minTone) ?? DEFAULT_MIN;
  const hi = clampTone(maxTone) ?? DEFAULT_MAX;
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  for (let tone = a; tone <= b; tone += 1) {
    out[String(tone)] = hexFromArgb(palette.tone(tone));
  }
  return out;
}

/**
 * Одна тональная шкала из вашего HEX (hue/chroma от seed, как у M3 tonal ramp).
 */
export function tonalRampFromHex(hex, minTone = DEFAULT_MIN, maxTone = DEFAULT_MAX) {
  const argb = argbFromHex(hex);
  const palette = TonalPalette.fromInt(argb);
  return rampFromPalette(palette, minTone, maxTone);
}

const CORE_KEYS = [
  ['primary', 'a1'],
  ['neutral', 'n1'],
  ['neutralVariant', 'n2'],
];

/**
 * Все ключевые палитры M3 из одного seed (CorePalette.of — как Theme Builder).
 */
export function themeRampsFromHex(hex, minTone = DEFAULT_MIN, maxTone = DEFAULT_MAX) {
  const argb = argbFromHex(hex);
  const core = CorePalette.of(argb);
  const result = {};
  for (const [name, field] of CORE_KEYS) {
    result[name] = rampFromPalette(core[field], minTone, maxTone);
  }
  return result;
}

export function hexAtToneFromHex(hex, tone, mode = 'tonal') {
  const t = clampTone(tone);
  if (t === null) throw new Error('Invalid tone');
  const argb = argbFromHex(hex);
  if (mode === 'theme-primary') {
    const core = CorePalette.of(argb);
    return hexFromArgb(core.a1.tone(t));
  }
  const palette = TonalPalette.fromInt(argb);
  return hexFromArgb(palette.tone(t));
}

export { argbFromHex, hexFromArgb, clampTone };
