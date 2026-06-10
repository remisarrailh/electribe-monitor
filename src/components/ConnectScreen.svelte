<script>
  import { ui } from '../lib/stores.svelte.js'
  import { initMidi } from '../lib/midi.js'

  let { ondemo } = $props()
</script>

<div class="screen">
  <div class="logo">
    <span class="blue">●</span><span class="gray">●</span>
  </div>
  <h1>ELECTRIBE MONITOR</h1>
  <p class="sub">Visualiseur MIDI / SysEx pour electribe2 &amp; electribe sampler</p>

  {#if ui.midiState === 'unsupported'}
    <p class="error">Ce navigateur ne supporte pas le WebMIDI. Utiliser Chrome ou Edge.</p>
  {:else if ui.midiState === 'denied'}
    <p class="error">Accès MIDI refusé : {ui.error}</p>
    <p class="hint">Autoriser le MIDI (avec SysEx) dans les paramètres du site, puis réessayer.</p>
    <button class="cta" onclick={initMidi}>Réessayer</button>
  {:else}
    <button class="cta" onclick={initMidi} disabled={ui.midiState === 'requesting'}>
      {ui.midiState === 'requesting' ? 'Demande en cours…' : 'Activer le MIDI'}
    </button>
    <p class="hint">Le navigateur va demander l'autorisation d'accès MIDI + SysEx.</p>
  {/if}

  <button
    class="demo"
    onclick={() => {
      ui.midiState = 'ready'
      ondemo?.()
    }}>Mode démo (sans machines)</button
  >
</div>

<style>
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
  }

  .logo {
    font-size: 4rem;
    letter-spacing: 0.3em;
  }

  .blue {
    color: #4da3ff;
    text-shadow: 0 0 2rem #4da3ff88;
  }

  .gray {
    color: #c2cddd;
    text-shadow: 0 0 2rem #c2cddd66;
  }

  h1 {
    margin: 0;
    font-size: 2.2rem;
    letter-spacing: 0.35em;
    font-weight: 800;
  }

  .sub {
    color: var(--dim);
    margin: 0;
  }

  .cta {
    font-size: 1.3rem;
    padding: 0.8rem 2.5rem;
    border-radius: 1rem;
    border-color: #2c3a50;
    background: linear-gradient(180deg, #1d2a3e, #131a25);
  }

  .error {
    color: var(--bad);
    margin: 0;
  }

  .hint {
    color: var(--dim);
    font-size: 0.9rem;
    margin: 0;
  }

  .demo {
    margin-top: 2rem;
    color: var(--dim);
    font-size: 0.9rem;
  }
</style>
