<script>
  import { noteName } from '../lib/parser.js'

  let { device } = $props()
</script>

<div class="grid">
  {#each device.parts as part, i}
    <div class="pad" class:held={part.active}>
      {#key part.hits}
        <div class="flash" class:hit={part.hits > 0} style="--vel: {part.vel / 127}"></div>
      {/key}
      <span class="no">{i + 1}</span>
      <span class="note">{part.note != null ? noteName(part.note) : ''}</span>
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.45rem;
  }

  .pad {
    position: relative;
    aspect-ratio: 1.45;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.25rem 0.4rem;
  }

  .pad.held {
    border-color: var(--accent);
  }

  .flash {
    position: absolute;
    inset: 0;
    background: var(--accent);
    opacity: 0;
    pointer-events: none;
  }

  .flash.hit {
    animation: flash 0.5s ease-out;
  }

  @keyframes flash {
    0% {
      opacity: calc(0.25 + var(--vel) * 0.75);
    }
    100% {
      opacity: 0;
    }
  }

  .no {
    font-size: 0.7rem;
    color: var(--dim);
    position: relative;
  }

  .note {
    font-family: var(--mono);
    font-size: 0.95rem;
    align-self: flex-end;
    position: relative;
  }
</style>
