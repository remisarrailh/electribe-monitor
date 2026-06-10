<script>
  import { names, setName } from '../lib/names.svelte.js'

  let { device } = $props()

  let editing = $state(false)
  let draft = $state('')
  let inputEl = $state(null)

  const number = $derived(device.pattern.number)
  const customName = $derived(number != null ? (names[device.key][number] ?? '') : '')
  const displayName = $derived(
    customName || device.pattern.sysexName || (number != null ? `Pattern ${number}` : '—'),
  )

  function startEdit() {
    if (number == null) return
    draft = customName || device.pattern.sysexName || ''
    editing = true
    queueMicrotask(() => inputEl?.focus())
  }

  function commit() {
    if (!editing) return
    editing = false
    setName(device.key, number, draft)
  }

  function onKey(e) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') editing = false
  }
</script>

<div class="pattern">
  <div class="num">{number != null ? String(number).padStart(3, '0') : '···'}</div>
  <div class="nameblock">
    {#if editing}
      <input
        type="text"
        maxlength="24"
        bind:this={inputEl}
        bind:value={draft}
        onblur={commit}
        onkeydown={onKey}
      />
    {:else}
      <button class="name" onclick={startEdit} title="Cliquer pour renommer (sauvé en local)">
        {displayName}
        {#if customName}<span class="pen">✎</span>{/if}
      </button>
    {/if}
    {#if customName && device.pattern.sysexName && customName !== device.pattern.sysexName}
      <div class="machine-name" title="Nom stocké dans la machine">{device.pattern.sysexName}</div>
    {:else if device.pattern.length}
      <div class="machine-name">{device.pattern.length} bar · {device.pattern.beat}</div>
    {/if}
  </div>
</div>

<style>
  .pattern {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 0.7rem;
    padding: 0.5rem 0.9rem;
  }

  .num {
    font-family: var(--mono);
    font-size: 2.6rem;
    font-weight: 700;
    color: var(--accent);
    text-shadow: 0 0 1.5rem var(--accent-soft);
    line-height: 1;
  }

  .nameblock {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .name {
    background: none;
    border: none;
    padding: 0;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .name:hover {
    color: var(--accent);
    background: none;
  }

  .pen {
    font-size: 0.8em;
    color: var(--dim);
    margin-left: 0.3em;
  }

  .machine-name {
    color: var(--dim);
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  input {
    font-size: 1.3rem;
    width: 100%;
  }
</style>
