// Mode démo : simule deux electribe sans matériel (utile pour tester l'affichage).
import { devices } from './stores.svelte.js'
import { handleMessage, pushSystemLog } from './midi.js'

const timers = []
let running = false

function send(role, bytes) {
  handleMessage(role, Uint8Array.from(bytes), performance.now())
}

// Parts factices : numéros d'osc plausibles + séquence 4 bars, pour la vue séquenceur et les pads
function makeDemoParts(role) {
  // [n° osc affiché (synth : cf. osc-names), pattern de steps sur 16 (1 = on)]
  const layout =
    role === 'synth'
      ? [
          [2, '1000100010001000'], // Lazy (Kick)
          [64, '0000100000001000'], // Beach (Snare)
          [131, '1010101010101010'], // hat
          [173, '0000000000000010'], // cymbale
          [203, '0100010001000100'], // perc
          [326, '1001001010010010'], // SAW
          [340, '0000100100001000'],
          [381, '0010000000100000'],
        ]
      : [
          [12, '1000100010001000'],
          [38, '0000100000001000'],
          [55, '1110111011101110'],
          [102, '0001000000010000'],
          [201, '0100100001001000'],
          [310, '1000000110000001'],
        ]
  const parts = []
  for (let i = 0; i < 16; i++) {
    const def = layout[i]
    const steps = []
    let stepCount = 0
    for (let s = 0; s < 64; s++) {
      const on = def ? def[1][s % 16] === '1' : false
      if (on) stepCount++
      steps.push({ on, gate: 24, vel: on ? 80 + ((s * 13) % 47) : 0, notes: on ? [48] : [] })
    }
    parts.push({
      lastStep: 16,
      osc: def ? def[0] : 1,
      oscEdit: 0,
      filterType: 0,
      cutoff: 100,
      level: def ? 100 : 0,
      pan: 64,
      steps,
      stepCount,
    })
  }
  return parts
}

export function isDemoRunning() {
  return running
}

export function startDemo() {
  if (running) return
  running = true
  const setups = [
    { role: 'synth', bpm: 124, name: 'ACID NIGHT', pattern: 12 },
    { role: 'sampler', bpm: 124, name: 'BREAK 04', pattern: 137 },
  ]
  for (const { role, bpm, name, pattern } of setups) {
    const d = devices[role]
    d.connected = true
    d.demo = true
    d.portName = 'DÉMO (simulation)'
    pushSystemLog(role, 'Mode démo activé — données simulées')
    d.pattern.number = pattern
    d.pattern.sysexName = name
    d.pattern.tempo = bpm
    d.pattern.length = 4
    d.pattern.beat = '16'
    d.pattern.parts = makeDemoParts(role)

    send(role, [0xfa]) // start
    const clockMs = 60000 / bpm / 24
    timers.push(setInterval(() => send(role, [0xf8]), clockMs))

    // notes pseudo-aléatoires sur quelques parts (kick régulier part 1)
    let step = 0
    timers.push(
      setInterval(() => {
        step = (step + 1) % 16
        if (step % 4 === 0) hit(role, 0, 48, 127)
        if (step % 8 === 4) hit(role, 1, 50, 110)
        if (step % 2 === 1 && Math.random() < 0.8) hit(role, 2, 60, 60 + ((Math.random() * 60) | 0))
        if (Math.random() < 0.25) hit(role, 3 + ((Math.random() * 5) | 0), 52 + ((Math.random() * 24) | 0), 40 + ((Math.random() * 80) | 0))
      }, 60000 / bpm / 4),
    )

    // tripotage de knobs
    timers.push(
      setInterval(() => {
        const ccs = [74, 71, 72, 73, 7, 80, 85, 102, 103]
        const cc = ccs[(Math.random() * ccs.length) | 0]
        const ch = (Math.random() * 4) | 0
        send(role, [0xb0 | ch, cc, (Math.random() * 128) | 0])
      }, 900 + Math.random() * 600),
    )
  }
}

function hit(role, ch, note, vel) {
  send(role, [0x90 | ch, note, vel])
  setTimeout(() => send(role, [0x80 | ch, note, 64]), 90)
}

export function stopDemo() {
  for (const t of timers) clearInterval(t)
  timers.length = 0
  running = false
  for (const role of ['synth', 'sampler']) {
    const d = devices[role]
    if (d.demo) {
      d.demo = false
      d.connected = false
      d.portName = ''
      d.playing = false
      d.pattern.parts = []
    }
  }
}
