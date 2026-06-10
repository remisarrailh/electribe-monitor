// Constantes et protocole Korg electribe / electribe sampler.
// Source : docs/electribe_MIDIimp.txt et docs/electribe_sampler_MIDIimp.txt
// (KORG electribe MIDI Implementation Rev 1.00)

export const MODELS = {
  synth: {
    key: 'synth',
    label: 'electribe2',
    subtitle: 'synth',
    familyId: 0x23,
    productId: [0x00, 0x01, 0x23],
    accent: '#4da3ff',
    accentSoft: 'rgba(77, 163, 255, 0.16)',
  },
  sampler: {
    key: 'sampler',
    label: 'electribe2',
    subtitle: 'sampler',
    familyId: 0x24,
    productId: [0x00, 0x01, 0x24],
    accent: '#c2cddd',
    accentSoft: 'rgba(194, 205, 221, 0.14)',
  },
}

export function modelByFamilyId(id) {
  return Object.values(MODELS).find((m) => m.familyId === id) ?? null
}

// Table 1-1 / 2-1 des MIDI Implementation (identique synth et sampler)
export const CC_NAMES = {
  0: 'Bank Select (MSB)',
  7: 'Amp Level',
  10: 'Amp Pan',
  32: 'Bank Select (LSB)',
  71: 'Filter Resonance',
  72: 'EG Decay/Release',
  73: 'EG Attack',
  74: 'Filter Cutoff',
  80: 'Osc Pitch',
  81: 'Osc Glide',
  82: 'Osc Edit',
  83: 'Filter EG Int.',
  85: 'Modulation Depth',
  86: 'Modulation Speed',
  87: 'Insert FX Edit',
  102: 'Master FX X',
  103: 'Master FX Y',
  104: 'Insert FX On/Off',
  105: 'MFX Send On/Off',
  106: 'Master FX On/Off',
  120: 'All Sound Off',
  121: 'Reset All Controllers',
  123: 'All Notes Off',
}

// Jauges affichées dans le panneau visuel (ordre du panneau de la machine)
export const KNOBS = [
  { cc: 80, short: 'Pitch' },
  { cc: 81, short: 'Glide' },
  { cc: 82, short: 'Osc Edit' },
  { cc: 74, short: 'Cutoff' },
  { cc: 71, short: 'Reso' },
  { cc: 83, short: 'EG Int' },
  { cc: 85, short: 'Mod Depth' },
  { cc: 86, short: 'Mod Speed' },
  { cc: 73, short: 'Attack' },
  { cc: 72, short: 'Decay' },
  { cc: 7, short: 'Level' },
  { cc: 10, short: 'Pan' },
  { cc: 87, short: 'IFX Edit' },
  { cc: 102, short: 'MFX X' },
  { cc: 103, short: 'MFX Y' },
]

// Jauges bipolaires (centre = 0x40), cf. notes *3-2 / *3-3 de la doc
export const BIPOLAR_CCS = new Set([10, 80, 83])

export function formatCcValue(cc, v) {
  switch (cc) {
    case 10: {
      const p = Math.max(-63, v - 64)
      return p === 0 ? 'C' : p < 0 ? `L${-p}` : `R${p}`
    }
    case 80:
    case 83: {
      const p = Math.max(-63, v - 64)
      return p > 0 ? `+${p}` : String(p)
    }
    case 104:
    case 105:
    case 106:
      return v >= 1 ? 'On' : 'Off'
    default:
      return String(v)
  }
}

// ---------------------------------------------------------------------------
// SysEx

export const FUNC = {
  CURRENT_PATTERN_DUMP_REQ: 0x10,
  PATTERN_WRITE_REQ: 0x11,
  PATTERN_DUMP_REQ: 0x1c,
  GLOBAL_DUMP_REQ: 0x0e,
  CURRENT_PATTERN_DUMP: 0x40,
  PATTERN_DUMP: 0x4c,
  GLOBAL_DUMP: 0x51,
  WRITE_OK: 0x21,
  WRITE_ERR: 0x22,
  LOAD_OK: 0x23,
  LOAD_ERR: 0x24,
  FORMAT_ERR: 0x26,
}

export const FUNC_NAMES = {
  0x10: 'Current Pattern Dump Request',
  0x11: 'Pattern Write Request',
  0x1c: 'Pattern Dump Request',
  0x0e: 'Global Dump Request',
  0x40: 'Current Pattern Data Dump',
  0x4c: 'Pattern Data Dump',
  0x51: 'Global Data Dump',
  0x21: 'Write Completed',
  0x22: 'Write Error',
  0x23: 'Data Load Completed',
  0x24: 'Data Load Error',
  0x26: 'Data Format Error',
}

export function buildIdentityRequest() {
  // Universal Device Inquiry, canal 7F = n'importe quel canal global
  return [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]
}

export function buildCurrentPatternRequest(model, globalCh = 0) {
  return [0xf0, 0x42, 0x30 | (globalCh & 0x0f), ...model.productId, FUNC.CURRENT_PATTERN_DUMP_REQ, 0xf7]
}

// F0 7E 0g 06 02 42 <famLSB> <famMSB> <memLSB> <memMSB> <maj> <min> <rel> <res> F7
export function parseIdentityReply(d) {
  if (d.length >= 15 && d[0] === 0xf0 && d[1] === 0x7e && d[3] === 0x06 && d[4] === 0x02 && d[5] === 0x42) {
    return {
      globalCh: d[2] & 0x0f,
      familyId: d[6],
      version: `${d[10]}.${d[11]}.${d[12]}`,
    }
  }
  return null
}

// F0 42 3g 00 01 23|24 <func> <payload...> F7
export function parseElectribeSysex(d) {
  if (
    d.length >= 8 &&
    d[0] === 0xf0 &&
    d[1] === 0x42 &&
    (d[2] & 0xf0) === 0x30 &&
    d[3] === 0x00 &&
    d[4] === 0x01 &&
    (d[5] === 0x23 || d[5] === 0x24)
  ) {
    return {
      familyId: d[5],
      globalCh: d[2] & 0x0f,
      func: d[6],
      payload: d.subarray(7, d.length - 1),
    }
  }
  return null
}

// Conversion 7 bits -> 8 bits (NOTE 3 de la doc) :
// chaque groupe de 8 octets MIDI = 1 octet de MSB (bit j = b7 de l'octet 7n+j) + 7 octets de données
export function korgDecode(data) {
  const out = new Uint8Array(Math.floor((data.length / 8) * 7) + 7)
  let len = 0
  for (let i = 0; i < data.length; i += 8) {
    const msb = data[i]
    const n = Math.min(7, data.length - 1 - i)
    for (let j = 0; j < n; j++) out[len++] = data[i + 1 + j] | (((msb >> j) & 1) << 7)
  }
  return out.subarray(0, len)
}

// TABLE 1 : header 'PTST', nom octets 16~33 (null terminated), tempo 34~35 (x10), etc.
export function parsePatternDump(payload7bit) {
  const data = korgDecode(payload7bit)
  if (data.length < 48) return null
  if (String.fromCharCode(data[0], data[1], data[2], data[3]) !== 'PTST') return null
  let name = ''
  for (let i = 16; i <= 33; i++) {
    if (!data[i]) break
    name += String.fromCharCode(data[i])
  }
  const tempo = (data[34] | (data[35] << 8)) / 10
  return {
    name: name.trim(),
    tempo,
    length: (data[37] & 3) + 1,
    beat: ['16', '32', '8 Tri', '16 Tri'][data[38] & 3] ?? '',
  }
}
