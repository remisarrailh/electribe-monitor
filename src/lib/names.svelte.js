// Noms personnalisés des patterns, persistés en localStorage, import/export JSON.
const KEY = 'electribe-monitor-names-v1'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return {
      synth: { ...(raw.synth ?? {}) },
      sampler: { ...(raw.sampler ?? {}) },
    }
  } catch {
    return { synth: {}, sampler: {} }
  }
}

export const names = $state(load())

function persist() {
  localStorage.setItem(KEY, JSON.stringify({ synth: names.synth, sampler: names.sampler }))
}

export function getName(role, patternNo) {
  return names[role]?.[patternNo] ?? ''
}

export function setName(role, patternNo, name) {
  const clean = (name ?? '').trim()
  if (clean) names[role][patternNo] = clean
  else delete names[role][patternNo]
  persist()
}

export function exportNames() {
  const payload = {
    app: 'electribe-monitor',
    version: 1,
    exportedAt: new Date().toISOString(),
    synth: names.synth,
    sampler: names.sampler,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `electribe-patterns-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Fusionne le fichier importé avec les noms existants (l'import gagne).
export async function importNames(file) {
  const data = JSON.parse(await file.text())
  let count = 0
  for (const role of ['synth', 'sampler']) {
    const src = data[role]
    if (!src || typeof src !== 'object') continue
    for (const [no, name] of Object.entries(src)) {
      if (typeof name === 'string' && name.trim()) {
        names[role][no] = name.trim()
        count++
      }
    }
  }
  persist()
  return count
}
