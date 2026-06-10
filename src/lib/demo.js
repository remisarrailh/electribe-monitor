// Mode démo : simule deux electribe sans matériel (utile pour tester l'affichage).
import { devices } from './stores.svelte.js'
import { handleMessage, pushSystemLog } from './midi.js'

const timers = []
let running = false

function send(role, bytes) {
  handleMessage(role, Uint8Array.from(bytes), performance.now())
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
    }
  }
}
