<script>
  import { ui } from '../lib/stores.svelte.js'
  import { setOverride } from '../lib/midi.js'
  import { buildE2PatFile } from '../lib/electribe.js'
  import PatternHeader from './PatternHeader.svelte'
  import TempoDisplay from './TempoDisplay.svelte'
  import PartsGrid from './PartsGrid.svelte'
  import KnobGauges from './KnobGauges.svelte'
  import StepGrid from './StepGrid.svelte'
  import RawLog from './RawLog.svelte'

  let { device } = $props()

  function downloadPattern() {
    if (!device.rawDump) return
    const ext = device.key === 'sampler' ? 'e2spat' : 'e2pat'
    const file = buildE2PatFile(device.model, device.rawDump)
    const name = (device.pattern.sysexName || 'pattern').replace(/[^\w\- ]/g, '').trim() || 'pattern'
    const no = device.pattern.number != null ? String(device.pattern.number).padStart(3, '0') : 'xxx'
    const blob = new Blob([file], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${no}-${name}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<section class="panel" style="--accent: {device.model.accent}; --accent-soft: {device.model.accentSoft}">
  <div class="head">
    <div class="title">
      <span class="dot" class:on={device.connected}></span>
      <strong>{device.model.label}</strong>
      <em>{device.model.subtitle}</em>
      {#if device.version}<span class="ver">v{device.version}</span>{/if}
    </div>
    <div class="port">
      {#if device.rawDump}
        <button
          class="dl"
          onclick={downloadPattern}
          title="Télécharger le pattern courant ({device.key === 'sampler' ? '.e2spat' : '.e2pat'})"
        >
          ⭳ pattern
        </button>
      {/if}
      {#if device.connected}
        <span class="portname" title={device.portName}>{device.portName}</span>
      {:else}
        <span class="off">non connectée</span>
      {/if}
      {#if !device.demo}
        <select
          value={ui.overrides[device.key]}
          onchange={(e) => setOverride(device.key, e.target.value)}
          title="Port MIDI d'entrée (auto par défaut)"
        >
          <option value="">Port : auto</option>
          {#each ui.inputs as p}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      {/if}
    </div>
  </div>

  {#if device.connected}
    {#if ui.view !== 'log'}
      <div class="top">
        <PatternHeader {device} />
        <TempoDisplay {device} />
      </div>
    {/if}
    {#if ui.view === 'seq'}
      <StepGrid {device} />
    {:else if ui.view !== 'log'}
      <div class="visual" class:grow={ui.view === 'visuel'}>
        <PartsGrid {device} />
        <KnobGauges {device} />
      </div>
    {/if}
    {#if ui.view !== 'visuel' && ui.view !== 'seq'}
      <RawLog {device} />
    {/if}
  {:else}
    <div class="empty">
      <p>En attente de l'electribe {device.model.subtitle}…</p>
      <p class="hint">Brancher la machine en USB, ou choisir un port ci-dessus.</p>
    </div>
  {/if}
</section>

<style>
  .panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    background: var(--panel);
    border: 1px solid var(--line);
    border-top: 3px solid var(--accent);
    border-radius: 0.9rem;
    padding: 0.8rem 1rem;
    box-shadow: 0 0 4rem var(--accent-soft) inset;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .title {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 1.2rem;
  }

  .title strong {
    letter-spacing: 0.08em;
  }

  .title em {
    color: var(--accent);
    font-style: normal;
    font-weight: 600;
  }

  .ver {
    color: var(--dim);
    font-size: 0.75rem;
  }

  .dot {
    width: 0.65em;
    height: 0.65em;
    border-radius: 50%;
    background: #39424f;
    align-self: center;
  }

  .dot.on {
    background: var(--good);
    box-shadow: 0 0 0.6rem var(--good);
  }

  .port {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .dl {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    white-space: nowrap;
  }

  .portname {
    color: var(--dim);
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 14rem;
  }

  .off {
    color: var(--warn);
    font-size: 0.85rem;
  }

  .top {
    display: flex;
    gap: 1rem;
    align-items: stretch;
  }

  .visual {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    min-height: 0;
  }

  /* en vue "Visuel" seule, les pads s'étirent pour remplir l'écran (TV) */
  .visual.grow {
    flex: 1;
  }

  .visual.grow :global(.grid) {
    flex: 1;
    grid-auto-rows: 1fr;
  }

  .visual.grow :global(.pad) {
    aspect-ratio: auto;
    height: 100%;
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--dim);
  }

  .empty p {
    margin: 0.2rem;
    font-size: 1.2rem;
  }

  .empty .hint {
    font-size: 0.9rem;
  }
</style>
