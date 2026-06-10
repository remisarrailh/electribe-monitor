<script>
  import { onMount } from 'svelte'
  import { ui, devices } from './lib/stores.svelte.js'
  import { initMidi } from './lib/midi.js'
  import { exportNames, importNames } from './lib/names.svelte.js'
  import { isDemoRunning, startDemo, stopDemo } from './lib/demo.js'
  import ConnectScreen from './components/ConnectScreen.svelte'
  import DevicePanel from './components/DevicePanel.svelte'

  let fileInput = $state(null)
  let demo = $state(false)
  let importMessage = $state('')

  onMount(() => {
    // si la permission MIDI est déjà accordée, pas de prompt : on tente direct
    initMidi()
  })

  const views = [
    { id: 'mixte', label: 'Mixte' },
    { id: 'visuel', label: 'Visuel' },
    { id: 'seq', label: 'Séquenceur' },
    { id: 'log', label: 'Log' },
  ]

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }

  function toggleDemo() {
    if (isDemoRunning()) stopDemo()
    else startDemo()
    demo = isDemoRunning()
  }

  async function onImportFile(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    try {
      const count = await importNames(file)
      importMessage = `${count} nom(s) importé(s)`
    } catch (err) {
      importMessage = `Import impossible : ${err.message}`
    }
    ev.target.value = ''
    setTimeout(() => (importMessage = ''), 4000)
  }
</script>

{#if ui.midiState !== 'ready'}
  <ConnectScreen ondemo={toggleDemo} />
{:else}
  <header>
    <h1>ELECTRIBE<span>MONITOR</span></h1>
    <nav>
      {#each views as v}
        <button class:active={ui.view === v.id} onclick={() => (ui.view = v.id)}>{v.label}</button>
      {/each}
    </nav>
    <div class="actions">
      {#if importMessage}<span class="import-msg">{importMessage}</span>{/if}
      <button onclick={exportNames} title="Exporter les noms de patterns en JSON">⭳ Export</button>
      <button onclick={() => fileInput.click()} title="Importer des noms de patterns depuis un JSON">⭱ Import</button>
      <input type="file" accept=".json,application/json" bind:this={fileInput} onchange={onImportFile} hidden />
      <button onclick={toggleDemo} class:active={demo} title="Simuler des machines pour tester l'affichage">Démo</button>
      <button onclick={toggleFullscreen} title="Plein écran">⛶</button>
    </div>
  </header>
  <main>
    <DevicePanel device={devices.synth} />
    <DevicePanel device={devices.sampler} />
  </main>
{/if}

<style>
  header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--line);
    background: rgba(10, 14, 20, 0.7);
  }

  h1 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.35em;
    color: var(--text);
  }

  h1 span {
    color: var(--dim);
    font-weight: 300;
    margin-left: 0.4em;
  }

  nav {
    display: flex;
    gap: 0.4rem;
  }

  .actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .import-msg {
    color: var(--good);
    font-size: 0.85rem;
  }

  main {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    padding: 0.8rem;
  }
</style>
