// Modular sign recognition layer. Swap predict() for a TF.js / backend model later;
// the UI only depends on this module's exports.
export type Pt = { x: number; y: number; z: number }
export type Prediction = { label: string; confidence: number }
type Sample = { label: string; v: number[] }
const KEY = 'signbridge.samples'

export function featurize(l: Pt[]): number[] {
  const w = l[0]
  const p = l.map(q => ({ x: q.x - w.x, y: q.y - w.y, z: q.z - w.z }))
  const s = Math.max(...p.map(q => Math.hypot(q.x, q.y, q.z))) || 1
  return p.flatMap(q => [q.x / s, q.y / s, q.z / s])
}

class Recognizer {
  samples: Sample[] = []
  k = 5
  maxDist = 1.0 // reject poses farther than this from every known sample
  private loaded = false
  async init() {
    if (this.loaded) return
    this.loaded = true
    try { const r = await fetch('/models/signs.json'); if (r.ok) this.samples = (await r.json()).samples ?? [] } catch {}
    try { this.samples.push(...JSON.parse(localStorage.getItem(KEY) ?? '[]')) } catch {}
  }
  labels() { return [...new Set(this.samples.map(s => s.label))] }
  add(label: string, v: number[]) { this.samples.push({ label, v }) }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.samples)) } catch {} }
  clear() { this.samples = []; try { localStorage.removeItem(KEY) } catch {} }
  exportJson() { return JSON.stringify({ samples: this.samples }) }
  predict(l: Pt[]): Prediction | null {
    if (!this.samples.length) return null
    const v = featurize(l)
    const d = this.samples.map(s => ({ label: s.label, d: Math.sqrt(s.v.reduce((a, x, i) => a + (x - v[i]) ** 2, 0)) }))
      .sort((a, b) => a.d - b.d).slice(0, this.k)
    if (d[0].d > this.maxDist) return null
    const votes = new Map<string, number>()
    d.forEach(n => votes.set(n.label, (votes.get(n.label) ?? 0) + 1 / (n.d + 0.05)))
    const total = [...votes.values()].reduce((a, b) => a + b, 0)
    const [label, w] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]
    return { label, confidence: w / total }
  }
}
export const recognizer = new Recognizer()

// Appends a word only after it is stable for N frames, and not again while the same sign is held.
export class Debouncer {
  last: string | null = null; cand: string | null = null; n = 0
  constructor(private need = 6, private minConf = 0.6) {}
  push(p: Prediction | null): string | null {
    if (!p || p.confidence < this.minConf) { this.cand = null; this.n = 0; if (!p) this.last = null; return null }
    if (p.label === this.cand) this.n++; else { this.cand = p.label; this.n = 1 }
    if (this.n >= this.need && p.label !== this.last) { this.last = p.label; return p.label }
    return null
  }
}
