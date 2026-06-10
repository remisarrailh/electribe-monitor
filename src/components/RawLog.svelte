<script>
  let { device } = $props()

  let listEl = $state(null)

  const visible = $derived(device.log.slice(-150))

  // autoscroll en bas quand de nouvelles lignes arrivent (sauf en pause)
  $effect(() => {
    void device.log.length
    if (listEl && !device.logPaused) listEl.scrollTop = listEl.scrollHeight
  })
</script>

<div class="rawlog">
  <div class="bar">
    <span class="title">MIDI brut</span>
    <label><input type="checkbox" bind:checked={device.showClock} /> horloge <em>({device.stats.clocks})</em></label>
    <label
      ><input type="checkbox" bind:checked={device.showActiveSense} /> act. sense
      <em>({device.stats.activeSense})</em></label
    >
    <span class="count">{device.stats.messages} msg</span>
    <button class:active={device.logPaused} onclick={() => (device.logPaused = !device.logPaused)}>
      {device.logPaused ? '▶ Reprendre' : '⏸ Pause'}
    </button>
    <button onclick={() => (device.log.length = 0)}>Vider</button>
  </div>
  <div class="list" bind:this={listEl}>
    {#each visible as entry (entry.id)}
      <div class="row {entry.type}">
        <span class="time">{entry.time}</span>
        <span class="hex">{entry.hex}</span>
        <span class="text">{entry.text}</span>
      </div>
    {:else}
      <div class="placeholder">En attente de messages MIDI…</div>
    {/each}
  </div>
</div>

<style>
  .rawlog {
    flex: 1;
    min-height: 6rem;
    display: flex;
    flex-direction: column;
    background: #0a0e15;
    border: 1px solid var(--line);
    border-radius: 0.6rem;
    overflow: hidden;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.3rem 0.6rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.78rem;
    color: var(--dim);
  }

  .bar .title {
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .bar label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .bar em {
    font-style: normal;
    font-family: var(--mono);
  }

  .count {
    margin-left: auto;
    font-family: var(--mono);
  }

  .bar button {
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
  }

  .list {
    flex: 1;
    overflow-y: auto;
    font-family: var(--mono);
    font-size: 0.78rem;
    line-height: 1.5;
    padding: 0.3rem 0.6rem;
  }

  .row {
    display: flex;
    gap: 0.8rem;
    white-space: nowrap;
  }

  .time {
    color: #3d4a5e;
    flex-shrink: 0;
  }

  .hex {
    color: var(--dim);
    flex-shrink: 0;
    min-width: 9.5rem;
  }

  .text {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row.noteon .text {
    color: var(--good);
  }

  .row.noteoff .text {
    color: #2a9d63;
  }

  .row.cc .text {
    color: var(--accent);
  }

  .row.pc .text,
  .row.sysex .text {
    color: var(--warn);
    font-weight: 600;
  }

  .row.start .text,
  .row.continue .text {
    color: var(--good);
    font-weight: 700;
  }

  .row.stop .text {
    color: var(--bad);
    font-weight: 700;
  }

  .row.system .text {
    color: var(--text);
    font-style: italic;
  }

  .row.clock .text,
  .row.activesense .text {
    color: #3d4a5e;
  }

  .placeholder {
    color: var(--dim);
    padding: 1rem;
    text-align: center;
    font-family: inherit;
  }
</style>
