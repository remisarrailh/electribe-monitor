<script>
  import { noteName } from '../lib/parser.js'
  import { oscName } from '../lib/osc-names.js'
  import { names, setSampleName } from '../lib/names.svelte.js'
  import { sendNoteOn, sendNoteOff, canSend } from '../lib/midi.js'

  let { device } = $props()

  let renaming = $state(-1) // index de la part en cours de renommage (sampler)
  let draft = $state('')
  let inputEl = $state(null)

  const isSampler = $derived(device.key === 'sampler')

  function partLabel(i) {
    const p = device.pattern.parts[i]
    if (!p) return ''
    if (isSampler) {
      return names.samples[p.osc] || `S.${String(p.osc).padStart(3, '0')}`
    }
    return oscName(p.osc) ?? `Osc ${p.osc}`
  }

  function press(i, ev) {
    if (device.demo || !canSend(device.key)) return
    ev.currentTarget.setPointerCapture?.(ev.pointerId)
    sendNoteOn(device.key, i)
  }

  function release(i) {
    if (device.demo || !canSend(device.key)) return
    sendNoteOff(device.key, i)
  }

  function startRename(i, ev) {
    ev.stopPropagation()
    const p = device.pattern.parts[i]
    if (!isSampler || !p) return
    renaming = i
    draft = names.samples[p.osc] ?? ''
    queueMicrotask(() => inputEl?.focus())
  }

  function commitRename() {
    if (renaming < 0) return
    const p = device.pattern.parts[renaming]
    if (p) setSampleName(p.osc, draft)
    renaming = -1
  }
</script>

<div class="grid">
  {#each device.parts as part, i}
    <div
      class="pad"
      class:held={part.active}
      class:playable={!device.demo && canSend(device.key)}
      onpointerdown={(ev) => press(i, ev)}
      onpointerup={() => release(i)}
      onpointercancel={() => release(i)}
      role="button"
      tabindex="-1"
      title={!device.demo && canSend(device.key) ? 'Cliquer pour jouer la part' : undefined}
    >
      {#key part.hits}
        <div class="flash" class:hit={part.hits > 0} style="--vel: {part.vel / 127}"></div>
      {/key}
      <div class="row">
        <span class="no">{i + 1}</span>
        <span class="note">{part.note != null ? noteName(part.note) : ''}</span>
      </div>
      {#if renaming === i}
        <input
          type="text"
          maxlength="16"
          bind:this={inputEl}
          bind:value={draft}
          onblur={commitRename}
          onkeydown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') renaming = -1
          }}
          onpointerdown={(e) => e.stopPropagation()}
        />
      {:else if partLabel(i)}
        <button
          class="label"
          class:renamable={isSampler}
          onpointerdown={(e) => isSampler && e.stopPropagation()}
          onclick={(ev) => startRename(i, ev)}
          title={isSampler ? 'Cliquer pour nommer ce sample (sauvé en local)' : undefined}
        >
          {partLabel(i)}
        </button>
      {/if}
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
    user-select: none;
  }

  .pad.playable {
    cursor: pointer;
  }

  .pad.playable:active {
    border-color: var(--accent);
    background: var(--accent-soft);
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

  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    position: relative;
  }

  .no {
    font-size: 0.7rem;
    color: var(--dim);
  }

  .note {
    font-family: var(--mono);
    font-size: 0.95rem;
  }

  .label {
    position: relative;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    font-size: 0.72rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    opacity: 0.85;
  }

  .label.renamable:hover {
    color: var(--accent);
  }

  input {
    position: relative;
    font-size: 0.72rem;
    width: 100%;
    padding: 0.05rem 0.2rem;
  }
</style>
