// État réactif global de l'application (runes Svelte 5).
import { MODELS } from './electribe.js'

function makeParts() {
  return Array.from({ length: 16 }, () => ({ active: false, vel: 0, note: null, hits: 0 }))
}

function makeDevice(key) {
  return {
    key,
    model: MODELS[key],
    connected: false,
    demo: false,
    portName: '',
    outPortName: '',
    globalCh: 0,
    version: '',
    identified: false,
    parts: makeParts(),
    knobs: {}, // cc -> { value, ch, ts }
    lastCc: null, // { cc, ch, value, ts }
    bpm: null,
    playing: false,
    beat: 0,
    clockCount: 0,
    pattern: { number: null, sysexName: '', tempo: null, length: null, beat: '' },
    log: [],
    logPaused: false,
    showClock: false,
    showActiveSense: false,
    stats: { messages: 0, clocks: 0, activeSense: 0 },
  }
}

export const devices = $state({
  synth: makeDevice('synth'),
  sampler: makeDevice('sampler'),
})

export const ui = $state({
  midiState: 'idle', // idle | requesting | ready | denied | unsupported
  error: '',
  view: 'mixte', // visuel | log | mixte
  inputs: [], // { id, name }
  outputs: [],
  overrides: { synth: '', sampler: '' }, // id d'input forcé manuellement ('' = auto)
})

export function resetDeviceRuntime(d) {
  d.parts = makeParts()
  d.knobs = {}
  d.lastCc = null
  d.bpm = null
  d.playing = false
  d.beat = 0
  d.clockCount = 0
  d.identified = false
  d.version = ''
}
