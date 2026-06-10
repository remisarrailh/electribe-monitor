// Décodage générique des messages MIDI en évènements structurés + texte lisible.
import { CC_NAMES, formatCcValue } from './electribe.js'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function noteName(n) {
  return NOTE_NAMES[n % 12] + (Math.floor(n / 12) - 1)
}

export function toHex(data, max = 16) {
  const arr = Array.from(data.subarray ? data.subarray(0, max) : data.slice(0, max))
  const hex = arr.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
  return data.length > max ? `${hex} … (${data.length} o)` : hex
}

export function parseMessage(data) {
  const st = data[0]
  if (st >= 0xf8) {
    switch (st) {
      case 0xf8: return { type: 'clock', text: 'Timing Clock' }
      case 0xfa: return { type: 'start', text: '▶ Start' }
      case 0xfb: return { type: 'continue', text: '▶ Continue' }
      case 0xfc: return { type: 'stop', text: '■ Stop' }
      case 0xfe: return { type: 'activesense', text: 'Active Sensing' }
      default: return { type: 'other', text: `Realtime ${st.toString(16)}` }
    }
  }
  if (st === 0xf0) return { type: 'sysex', text: `SysEx (${data.length} octets)` }

  const type = st & 0xf0
  const ch = st & 0x0f
  switch (type) {
    case 0x80:
      return { type: 'noteoff', ch, note: data[1], vel: data[2], text: `Note Off · part ${ch + 1} · ${noteName(data[1])}` }
    case 0x90:
      if (data[2] === 0)
        return { type: 'noteoff', ch, note: data[1], vel: 0, text: `Note Off · part ${ch + 1} · ${noteName(data[1])}` }
      return { type: 'noteon', ch, note: data[1], vel: data[2], text: `Note On · part ${ch + 1} · ${noteName(data[1])} · vél ${data[2]}` }
    case 0xb0: {
      const name = CC_NAMES[data[1]] ?? `CC ${data[1]}`
      return { type: 'cc', ch, cc: data[1], value: data[2], text: `${name} · part ${ch + 1} = ${formatCcValue(data[1], data[2])}` }
    }
    case 0xc0:
      return { type: 'pc', ch, program: data[1], text: `Program Change · ch ${ch + 1} · n°${data[1]}` }
    case 0xa0:
      return { type: 'other', ch, text: `Poly Aftertouch · ch ${ch + 1}` }
    case 0xd0:
      return { type: 'other', ch, text: `Channel Pressure · ch ${ch + 1}` }
    case 0xe0:
      return { type: 'other', ch, text: `Pitch Bend · ch ${ch + 1}` }
    default:
      return { type: 'other', text: `Statut ${st.toString(16)}` }
  }
}
