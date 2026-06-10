// Moteur WebMIDI : accès, assignation des ports aux deux machines, traitement des messages.
import { devices, ui, resetDeviceRuntime } from './stores.svelte.js'
import { parseMessage, toHex } from './parser.js'
import * as e2 from './electribe.js'
import { TempoTracker } from './tempo.js'

let access = null
let logId = 0
const trackers = { synth: new TempoTracker(), sampler: new TempoTracker() }
const bound = {
  synth: { input: null, output: null },
  sampler: { input: null, output: null },
}
const bankState = { synth: { msb: 0, lsb: 0 }, sampler: { msb: 0, lsb: 0 } }
const patternReqTimer = { synth: null, sampler: null }

export async function initMidi() {
  if (ui.midiState === 'ready' || ui.midiState === 'requesting') return
  if (!navigator.requestMIDIAccess) {
    ui.midiState = 'unsupported'
    return
  }
  ui.midiState = 'requesting'
  try {
    access = await navigator.requestMIDIAccess({ sysex: true })
  } catch (err) {
    ui.midiState = 'denied'
    ui.error = String(err?.message ?? err)
    return
  }
  ui.midiState = 'ready'
  access.onstatechange = () => scanPorts()
  scanPorts()
}

export function scanPorts() {
  if (!access) return
  ui.inputs = [...access.inputs.values()].map((p) => ({ id: p.id, name: p.name }))
  ui.outputs = [...access.outputs.values()].map((p) => ({ id: p.id, name: p.name }))
  for (const role of ['synth', 'sampler']) assignPorts(role)
}

function isElectribeName(name) {
  return /electribe|e2s?\b/i.test(name)
}

function matchInput(role) {
  const inputs = [...access.inputs.values()]
  const override = ui.overrides[role]
  if (override) return inputs.find((p) => p.id === override) ?? null
  // pas de doublon avec un port déjà forcé sur l'autre machine
  const otherRole = role === 'synth' ? 'sampler' : 'synth'
  const taken = ui.overrides[otherRole]
  return (
    inputs.find((p) => {
      if (p.id === taken) return false
      const n = p.name.toLowerCase()
      if (!isElectribeName(n)) return false
      const isSampler = n.includes('sampler')
      return role === 'sampler' ? isSampler : !isSampler
    }) ?? null
  )
}

function matchOutput(role, inputName) {
  const outputs = [...access.outputs.values()]
  // de préférence le port de sortie portant le même nom que l'entrée
  return (
    outputs.find((p) => p.name === inputName) ??
    outputs.find((p) => {
      const n = p.name.toLowerCase()
      if (!isElectribeName(n)) return false
      const isSampler = n.includes('sampler')
      return role === 'sampler' ? isSampler : !isSampler
    }) ??
    null
  )
}

function assignPorts(role) {
  const d = devices[role]
  if (d.demo) return
  const input = matchInput(role)
  const current = bound[role].input
  if (input?.id === current?.id) {
    // entrée inchangée ; la sortie a pu apparaître entre-temps
    if (input && !bound[role].output) {
      const out = matchOutput(role, input.name)
      if (out) {
        bound[role].output = out
        d.outPortName = out.name
        hello(role)
      }
    }
    return
  }
  if (current) current.onmidimessage = null
  bound[role].input = input
  bound[role].output = null
  if (!input) {
    d.connected = false
    d.portName = ''
    d.outPortName = ''
    resetDeviceRuntime(d)
    return
  }
  input.onmidimessage = (ev) => handleMessage(role, ev.data, ev.timeStamp)
  d.connected = true
  d.portName = input.name
  const out = matchOutput(role, input.name)
  bound[role].output = out
  d.outPortName = out?.name ?? ''
  pushSystemLog(role, `Connecté : ${input.name}${out ? ` (sortie : ${out.name})` : ' (pas de sortie trouvée)'}`)
  hello(role)
}

// À la connexion : qui es-tu ? (identity request) puis demande du pattern courant.
function hello(role) {
  const out = bound[role].output
  if (!out) return
  try {
    out.send(e2.buildIdentityRequest())
  } catch (err) {
    pushSystemLog(role, `Envoi SysEx impossible : ${err.message}`)
  }
  schedulePatternRequest(role, 400)
}

export function requestCurrentPattern(role) {
  const d = devices[role]
  const out = bound[role].output
  if (!out) return
  try {
    out.send(e2.buildCurrentPatternRequest(d.model, d.globalCh))
  } catch {
    /* port fermé entre-temps */
  }
}

function schedulePatternRequest(role, delay = 200) {
  clearTimeout(patternReqTimer[role])
  patternReqTimer[role] = setTimeout(() => requestCurrentPattern(role), delay)
}

// Point d'entrée unique des messages (aussi utilisé par le mode démo).
export function handleMessage(role, data, t = performance.now()) {
  const d = devices[role]
  d.stats.messages++
  const msg = parseMessage(data)

  switch (msg.type) {
    case 'clock': {
      d.stats.clocks++
      d.clockCount++
      if (d.clockCount % 24 === 0) d.beat++
      const r = trackers[role].tick(t)
      if (r) d.bpm = r.bpm
      if (!d.showClock) return
      break
    }
    case 'activesense':
      d.stats.activeSense++
      if (!d.showActiveSense) return
      break
    case 'start':
      d.playing = true
      d.beat = 0
      d.clockCount = 0
      trackers[role].reset()
      break
    case 'continue':
      d.playing = true
      break
    case 'stop':
      d.playing = false
      break
    case 'noteon': {
      const p = d.parts[msg.ch]
      p.active = true
      p.vel = msg.vel
      p.note = msg.note
      p.hits++
      break
    }
    case 'noteoff': {
      d.parts[msg.ch].active = false
      break
    }
    case 'cc': {
      if (msg.cc === 0) bankState[role].msb = msg.value
      else if (msg.cc === 32) bankState[role].lsb = msg.value
      else {
        d.knobs[msg.cc] = { value: msg.value, ch: msg.ch, ts: t }
        d.lastCc = { cc: msg.cc, ch: msg.ch, value: msg.value, ts: t }
      }
      break
    }
    case 'pc': {
      // doc *2 : patterns 1-127 -> bank 0 pp 1-127 ; patterns 128-250 -> bank 1 pp 1-123
      d.pattern.number = bankState[role].lsb * 127 + msg.program
      msg.text = `Pattern Change → n°${String(d.pattern.number).padStart(3, '0')}`
      d.pattern.sysexName = ''
      schedulePatternRequest(role)
      break
    }
    case 'sysex':
      handleSysex(role, data, msg)
      break
  }

  pushLog(role, data, msg)
}

function handleSysex(role, data, msg) {
  const d = devices[role]
  const id = e2.parseIdentityReply(data)
  if (id) {
    d.globalCh = id.globalCh
    d.version = id.version
    d.identified = true
    const model = e2.modelByFamilyId(id.familyId)
    msg.text = `Identity Reply · ${model ? `${model.label} ${model.subtitle}` : `famille 0x${id.familyId.toString(16)}`} · v${id.version} · canal global ${id.globalCh + 1}`
    if (model && model.key !== role) {
      pushSystemLog(role, `⚠ Ce port répond comme « ${model.label} ${model.subtitle} » — vérifier l'assignation des ports.`)
    }
    return
  }
  const ex = e2.parseElectribeSysex(data)
  if (!ex) return
  const fname = e2.FUNC_NAMES[ex.func] ?? `fonction 0x${ex.func.toString(16)}`
  msg.text = `SysEx · ${fname} (${data.length} o)`
  if (ex.func === e2.FUNC.CURRENT_PATTERN_DUMP) {
    const p = e2.parsePatternDump(ex.payload)
    if (p) {
      d.pattern.sysexName = p.name
      d.pattern.tempo = p.tempo
      d.pattern.length = p.length
      d.pattern.beat = p.beat
      msg.text += ` · « ${p.name} » · ${p.tempo} BPM · ${p.length} bar`
    }
  } else if (ex.func === e2.FUNC.PATTERN_DUMP) {
    const no = (ex.payload[0] | (ex.payload[1] << 7)) + 1
    const p = e2.parsePatternDump(ex.payload.subarray(2))
    if (p) msg.text += ` · pattern ${no} « ${p.name} »`
  }
}

function pushLog(role, data, msg) {
  const d = devices[role]
  if (d.logPaused) return
  d.log.push({
    id: ++logId,
    time: new Date().toLocaleTimeString('fr-FR', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
    hex: toHex(data),
    text: msg.text,
    type: msg.type,
  })
  if (d.log.length > 400) d.log.splice(0, d.log.length - 400)
}

export function pushSystemLog(role, text) {
  const d = devices[role]
  d.log.push({
    id: ++logId,
    time: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
    hex: '',
    text,
    type: 'system',
  })
  if (d.log.length > 400) d.log.splice(0, d.log.length - 400)
}

export function setOverride(role, inputId) {
  ui.overrides[role] = inputId
  scanPorts()
}
