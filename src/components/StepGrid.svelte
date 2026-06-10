<script>
  // Grille séquenceur : 16 parts × 16 steps par bar, extraite du dump du pattern courant.
  // La tête de lecture suit l'horloge MIDI (device.step, calé sur Start).
  import { oscName } from '../lib/osc-names.js'
  import { names } from '../lib/names.svelte.js'

  let { device } = $props()

  const parts = $derived(device.pattern.parts ?? [])
  const bars = $derived(device.pattern.length || 1)
  const totalSteps = $derived(bars * 16)

  // step global → position dans le pattern (le pattern boucle)
  const playPos = $derived(device.playing ? device.step % totalSteps : -1)
  const playBar = $derived(playPos >= 0 ? Math.floor(playPos / 16) : 0)

  // bar affichée : suit la lecture, sinon la première
  const shownBar = $derived(device.playing ? playBar : 0)

  function partLabel(i) {
    const p = parts[i]
    if (!p) return `P${i + 1}`
    if (device.key === 'sampler') return names.samples[p.osc] || `S.${String(p.osc).padStart(3, '0')}`
    return oscName(p.osc) ?? `Osc ${p.osc}`
  }

  function stepAt(partIdx, col) {
    return parts[partIdx]?.steps?.[shownBar * 16 + col] ?? null
  }
</script>

<div class="seq">
  {#if parts.length === 0}
    <div class="placeholder">
      <p>Pas de données de séquence.</p>
      <p class="hint">La séquence est lue dans le dump SysEx du pattern courant (envoyé au changement de pattern).</p>
    </div>
  {:else}
    <div class="barinfo">
      <span>bar {shownBar + 1}/{bars}</span>
      {#if device.playing && playPos >= 0}
        <span class="pos">step {(playPos % 16) + 1}</span>
      {/if}
    </div>
    <div class="rows">
      {#each parts as part, pi}
        <div class="row" class:muted={part.stepCount === 0}>
          <span class="plabel" title={partLabel(pi)}>{pi + 1} · {partLabel(pi)}</span>
          <div class="steps">
            {#each Array(16) as _, col}
              {@const st = stepAt(pi, col)}
              {@const isPlay = device.playing && playPos === shownBar * 16 + col}
              <div
                class="cell"
                class:on={st?.on}
                class:play={isPlay}
                class:beat4={col % 4 === 0}
                style={st?.on ? `--svel: ${(st.vel || 96) / 127}` : ''}
              ></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .seq {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .barinfo {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--dim);
    font-family: var(--mono);
  }

  .pos {
    color: var(--accent);
  }

  .rows {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .row {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
  }

  .row.muted {
    opacity: 0.35;
  }

  .plabel {
    width: 8.5rem;
    flex-shrink: 0;
    font-size: 0.7rem;
    color: var(--dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    align-self: center;
  }

  .steps {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    gap: 0.18rem;
  }

  .cell {
    border-radius: 0.2rem;
    background: var(--panel-2);
    border: 1px solid var(--line);
    min-height: 0.7rem;
  }

  .cell.beat4 {
    border-color: #2c3848;
  }

  .cell.on {
    background: var(--accent);
    border-color: var(--accent);
    opacity: calc(0.35 + var(--svel) * 0.65);
  }

  .cell.play {
    box-shadow:
      0 0 0 2px var(--text),
      0 0 0.6rem var(--accent);
    opacity: 1;
  }

  .placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--dim);
  }

  .placeholder p {
    margin: 0.2rem;
  }

  .placeholder .hint {
    font-size: 0.8rem;
  }
</style>
