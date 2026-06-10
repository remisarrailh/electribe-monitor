# Electribe Monitor

Visualiseur temps réel MIDI / SysEx pour **Korg electribe2 (synth, bleue)** et **electribe sampler (grise)**, pensé pour être affiché sur un écran de télé.

## Fonctionnalités

- **WebMIDI** : détection automatique des deux machines branchées en USB (fonctionne aussi avec une seule), reconnexion à chaud.
- **Log MIDI brut** : tous les messages en hex + décodage lisible (notes, CC nommés d'après la doc officielle Korg, transport, SysEx). Horloge et Active Sensing masqués par défaut (compteurs visibles).
- **Visualisation** par machine :
  - grille des 16 parts qui flashe sur chaque note (intensité = vélocité) ;
  - jauges des knobs (cutoff, résonance, EG, oscillateur, FX…) avec la dernière part touchée ;
  - **tempo** calculé sur l'horloge MIDI (24 ppqn) + pulsation à la noire + état ▶/■ ;
  - **pattern courant** : numéro (Program Change + Bank Select) et nom lu dans la machine via SysEx (Current Pattern Data Dump).
- **Renommage des patterns** : cliquer sur le nom pour le renommer. Stocké en `localStorage`, export / import JSON.
- **Mode démo** pour tester l'affichage sans machines.
- Vues **Mixte / Visuel / Log**, bouton plein écran.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173 (Chrome ou Edge — WebMIDI requis)
```

Build statique (déployable sur n'importe quel hébergement statique, GitHub Pages, etc.) :

```bash
npm run build      # -> dist/
npm run preview
```

> WebMIDI exige `localhost` ou HTTPS, et un navigateur Chromium (Chrome, Edge, Opera…).

## Réglages côté electribe

Dans **GLOBAL PARAMETERS** de chaque machine :

- `MIDI > Clock` : **Internal** (pour que la machine envoie son horloge → affichage du tempo) ;
- `MIDI > Receive/Send Filter` : **Off** (ou **Short** au minimum pour les Program Change) ;
- brancher en USB. Sous Windows, le [driver Korg USB-MIDI](https://www.korg.com/us/support/download/driver/0/367/3541/) est recommandé, surtout avec les deux machines en même temps.

L'app identifie chaque machine par le nom du port USB (« sampler » dans le nom → grise) et vérifie via *Device Inquiry* SysEx (famille `0x23` = synth, `0x24` = sampler). Si les noms de ports ne matchent pas, un sélecteur manuel est disponible dans l'en-tête de chaque panneau.

## Protocole

Tout le décodage est basé sur la documentation officielle Korg (`docs/electribe_MIDIimp.txt` et `docs/electribe_sampler_MIDIimp.txt`, © KORG Inc., usage personnel non commercial) :

- notes : une part = un canal MIDI (1–16) ;
- CC nommés (7 Amp Level, 71 Resonance, 74 Cutoff, 80 Osc Pitch, 102/103 Master FX X/Y…) ;
- pattern : `Bank Select LSB × 127 + Program Change` (patterns 1–250) ;
- SysEx `F0 42 3g 00 01 23|24 <func> … F7` — l'app envoie `10` (Current Pattern Data Dump Request) à chaque changement de pattern et décode la réponse `40` (encodage Korg 7→8 bits) pour lire le **nom du pattern** (octets 16–33), son tempo, sa longueur et son beat.

## Stack

Vite + Svelte 5 (runes), zéro dépendance d'exécution. Tout le MIDI est du WebMIDI natif.
