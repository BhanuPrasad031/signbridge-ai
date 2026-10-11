import { useRef, useState } from 'react'
import { Upload as UpIcon, X } from 'lucide-react'
import { createHandLandmarker } from '../services/hands'
import { recognizer, Debouncer } from '../services/recognizer'
import TextPanel from '../components/TextPanel'
const OK = ['video/mp4', 'video/webm', 'video/quicktime']
export default function Upload() {
  const vid = useRef<HTMLVideoElement>(null), cancel = useRef(false)
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState(''), [dur, setDur] = useState(0)
  const [state, setState] = useState<'idle' | 'processing' | 'done'>('idle'), [pct, setPct] = useState(0)
  const [words, setWords] = useState<string[]>([]), [error, setError] = useState('')
  const pick = (f?: File) => {
    if (!f) return; setError(''); setWords([]); setState('idle'); setPct(0)
    if (!OK.includes(f.type) && !/\.(mp4|webm|mov)$/i.test(f.name)) return setError('Unsupported file. Use MP4, WebM or MOV.')
    if (url) URL.revokeObjectURL(url); setFile(f); setUrl(URL.createObjectURL(f))
  }
  const reset = () => { cancel.current = true; setFile(null); setUrl(''); setWords([]); setState('idle'); setPct(0); setError('') }
  const seek = (v: HTMLVideoElement, t: number) => new Promise<void>(res => { v.onseeked = () => res(); v.currentTime = t })
  const process = async () => {
    const v = vid.current!; setError(''); setWords([]); cancel.current = false
    await recognizer.init()
    if (!recognizer.samples.length) return setError('No trained signs yet. Teach signs on the Live Recognition page first, or add public/models/signs.json.')
    setState('processing')
    try {
      const lm = await createHandLandmarker(), deb = new Debouncer(3, 0.6)
      v.pause(); let ts = 0
      for (let t = 0; t < v.duration; t += 0.1) {
        if (cancel.current) { lm.close(); setState('idle'); return }
        await seek(v, t)
        const l = lm.detectForVideo(v, (ts += 100)).landmarks[0]
        const w = deb.push(l ? recognizer.predict(l) : null)
        if (w) setWords(x => [...x, w])
        setPct(Math.round((t / v.duration) * 100))
      }
      lm.close(); setPct(100); setState('done')
    } catch (e: any) { setState('idle'); setError('Processing failed: ' + (e?.message ?? 'unknown error')) }
  }
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
      <section className="card">
        {!file ? (
          <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
            className="grid aspect-video cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-mist p-4 text-center focus-within:outline focus-within:outline-2 focus-within:outline-brand">
            <span><UpIcon className="mx-auto mb-2" />Drop a video here or <u>choose a file</u><br/><small className="text-ink/60">MP4, WebM, MOV. Processed in your browser, never uploaded.</small></span>
            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mov" className="sr-only" onChange={e => pick(e.target.files?.[0])} />
          </label>
        ) : (<>
          <video ref={vid} src={url} controls muted playsInline onLoadedMetadata={e => setDur(e.currentTarget.duration)} className="aspect-video w-full rounded-xl bg-ink" />
          <p className="mt-3 text-sm"><b>{file.name}</b> · {dur.toFixed(1)}s · {state === 'processing' ? 'Processing…' : state === 'done' ? 'Done' : 'Ready'}</p>
          <div className="mt-2 h-2 rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-2 rounded-full bg-brand transition-all" style={{ width: pct + '%' }} /></div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" onClick={process} disabled={state === 'processing'}>Process video</button>
            {state === 'processing' && <button className="btn-ghost" onClick={() => { cancel.current = true }}>Cancel</button>}
            <button className="btn-ghost" onClick={reset}><X size={16}/>Remove</button>
          </div>
        </>)}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>
      <section className="card">
        <h2 className="mb-3 font-display text-xl">Transcript</h2>
        <TextPanel words={words} download />
        {state === 'done' && !words.length && <p className="mt-3 text-sm text-ink/70">No trained signs were recognized in this video.</p>}
      </section>
    </div>
  )
}
