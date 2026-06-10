// Estimation du BPM à partir des Timing Clock MIDI (0xF8, 24 par noire).
export class TempoTracker {
  constructor() {
    this.times = []
    this._lastEmit = 0
  }

  // t : timestamp (ms) du clock reçu. Retourne { bpm } ou null (throttlé).
  tick(t) {
    const last = this.times[this.times.length - 1]
    // trou dans l'horloge (changement de transport, déconnexion) : on repart
    if (last !== undefined && t - last > 500) this.times.length = 0
    this.times.push(t)
    if (this.times.length > 48) this.times.shift()
    if (this.times.length < 12) return null
    if (t - this._lastEmit < 250) return null
    this._lastEmit = t
    const span = this.times[this.times.length - 1] - this.times[0]
    const interval = span / (this.times.length - 1)
    const bpm = 60000 / (interval * 24)
    if (!isFinite(bpm) || bpm < 10 || bpm > 400) return null
    return { bpm: Math.round(bpm * 10) / 10 }
  }

  reset() {
    this.times.length = 0
  }
}
