<script>
  import { KNOBS, BIPOLAR_CCS, formatCcValue } from '../lib/electribe.js'

  let { device } = $props()

  // arc de 270° (de -225° à +45°), comme un potard
  const R = 17
  const CIRC = 2 * Math.PI * R
  const ARC = CIRC * 0.75

  function dash(cc, value) {
    if (value == null) return `0 ${CIRC}`
    if (BIPOLAR_CCS.has(cc)) {
      // demi-arc depuis le centre
      const amount = Math.abs(value - 64) / 64
      return `${(amount * ARC) / 2} ${CIRC}`
    }
    return `${(value / 127) * ARC} ${CIRC}`
  }

  function rotation(cc, value) {
    // point de départ de l'arc : bas-gauche (135°), ou haut (270°+gap) pour les bipolaires négatifs
    if (BIPOLAR_CCS.has(cc) && value != null) {
      if (value < 64) {
        const amount = Math.abs(value - 64) / 64
        return 270 - amount * 135
      }
      return 270
    }
    return 135
  }
</script>

<div class="knobs">
  {#each KNOBS as k}
    {@const state = device.knobs[k.cc]}
    {@const isLast = device.lastCc?.cc === k.cc}
    <div class="knob" class:touched={state} class:last={isLast}>
      <svg viewBox="0 0 44 44">
        <circle class="track" cx="22" cy="22" r={R} stroke-dasharray="{ARC} {CIRC}" transform="rotate(135 22 22)" />
        <circle
          class="fill"
          cx="22"
          cy="22"
          r={R}
          stroke-dasharray={dash(k.cc, state?.value)}
          transform="rotate({rotation(k.cc, state?.value)} 22 22)"
        />
        <text x="22" y="25" text-anchor="middle">{state ? formatCcValue(k.cc, state.value) : '·'}</text>
      </svg>
      <span class="label">{k.short}</span>
      <span class="part">{state ? `P${state.ch + 1}` : ''}</span>
    </div>
  {/each}
</div>

<style>
  .knobs {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.3rem 0.45rem;
  }

  .knob {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.05rem;
    opacity: 0.45;
    transition: opacity 0.3s;
    position: relative;
  }

  .knob.touched {
    opacity: 1;
  }

  .knob.last .label {
    color: var(--accent);
  }

  .knob.last svg {
    filter: drop-shadow(0 0 0.4rem var(--accent-soft));
  }

  svg {
    width: 3.4rem;
    height: 3.4rem;
  }

  circle {
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
  }

  .track {
    stroke: var(--line);
  }

  .fill {
    stroke: var(--accent);
    transition: stroke-dasharray 0.08s linear;
  }

  text {
    fill: var(--text);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
  }

  .label {
    font-size: 0.62rem;
    color: var(--dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .part {
    position: absolute;
    top: 0;
    right: 0.1rem;
    font-size: 0.6rem;
    color: var(--dim);
    font-family: var(--mono);
  }
</style>
