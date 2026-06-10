<script>
  let { device } = $props()

  const bpm = $derived(device.bpm ?? device.pattern.tempo)
  const live = $derived(device.bpm != null)
</script>

<div class="tempo" class:playing={device.playing}>
  <div class="state">{device.playing ? '▶' : '■'}</div>
  <div class="value">
    {#if bpm != null}
      <span class="bpm">{bpm.toFixed(1)}</span>
      <span class="unit">BPM{live ? '' : ' (pattern)'}</span>
    {:else}
      <span class="bpm idle">—</span>
      <span class="unit">BPM</span>
    {/if}
  </div>
  {#key device.beat}
    <div class="pulse" class:on={device.playing}></div>
  {/key}
</div>

<style>
  .tempo {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 0.7rem;
    padding: 0.5rem 1rem;
  }

  .state {
    font-size: 1.6rem;
    color: var(--dim);
  }

  .playing .state {
    color: var(--good);
  }

  .value {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  .bpm {
    font-family: var(--mono);
    font-size: 2.6rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .bpm.idle {
    color: var(--dim);
  }

  .unit {
    color: var(--dim);
    font-size: 0.85rem;
  }

  .pulse {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--line);
  }

  .pulse.on {
    background: var(--accent);
    animation: beat 0.45s ease-out;
  }

  @keyframes beat {
    0% {
      box-shadow: 0 0 0 0 var(--accent);
      transform: scale(1.35);
    }
    100% {
      box-shadow: 0 0 0 0.8rem transparent;
      transform: scale(1);
    }
  }
</style>
