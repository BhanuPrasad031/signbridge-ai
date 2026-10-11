import { useEffect, useRef, useState } from 'react'
import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import { Camera, CameraOff, Circle } from 'lucide-react'
import { createHandLandmarker } from '../services/hands'
import { recognizer, featurize, Debouncer, Prediction } from '../services/recognizer'
import TextPanel from '../components/TextPanel'

export default function Live() {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const lm = useRef<HandLandmarker | null>(null), raf = useRef(0), stream = useRef<MediaStream | null>(null)
  const deb = useRef(new Debouncer()), rec = useRef({ label: '', left: 0 })
  const [status, setStatus] = useState<'idle' | 'loading' | 'on'>('idle')
  const [error, setError] = useState(''), [hand, setHand] = useState(false)
  const [pred, setPred] = useState<Prediction | null>(null), [words, setWords] = useState<string[]>([])
  const [label, setLabel] = useState(''), [left, setLeft] = useState(0), [, setTick] = useState(0)
  useEffect(() => { recognizer.init().then(() => setTick(t => t + 1)) }, [])
  const trained = recognizer.labels()

  const loop = () => {
    const v = video.current, c = canvas.current
    if (v && c && lm.current && v.readyState >= 2) {
      c.width = v.videoWidth; c.height = v.videoHeight
      const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, c.width, c.height)
      const r = lm.current.detectForVideo(v, performance.now())
      const l = r.landmarks[0]; setHand(!!l)
      if (l) {
        const du = new DrawingUtils(ctx)
        du.drawConnectors(l, HandLandmarker.HAND_CONNECTIONS, { color: '#6d4bdb', lineWidth: 3 })
        du.drawLandmarks(l, { color: '#2f5bff', radius: 3 })
        let p: Prediction | null = null
        if (rec.current.left > 0) {
          recognizer.add(rec.current.label, featurize(l)); rec.current.left--; setLeft(rec.current.left)
          if (!rec.current.left) { recognizer.save(); setTick(t => t + 1) }
        } else p = recognizer.predict(l)
        setPred(p)
        const w = deb.current.push(p); if (w) setWords(x => [...x, w])
      } else { setPred(null); deb.current.push(null) }
    }
    raf.current = requestAnimationFrame(loop)
  }
  const stop = () => {
    cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null
    setStatus('idle'); setHand(false); setPred(null)
  }
  const start = async () => {
    setError(''); setStatus('loading')
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      video.current!.srcObject = stream.current; await video.current!.play()
      lm.current ??= await createHandLandmarker()
      setStatus('on'); loop()
    } catch (e: any) {
      stop()
      setError(e?.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : e?.name === 'NotFoundError' ? 'No camera was found on this device.'
        : 'Could not start: ' + (e?.message ?? 'unknown error') + ' (the hand model needs internet on first load).')
    }
  }
  useEffect(() => () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach(t => t.stop()) }, [])
  const record = () => { if (!label.trim()) return; rec.current = { label: label.trim(), left: 40 }; setLeft(40) }
  const exportModel = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([recognizer.exportJson()], { type: 'application/json' })); a.download = 'signs.json'; a.click() }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
      <section className="card">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
          <video ref={video} muted playsInline className="h-full w-full -scale-x-100 object-cover" aria-label="Webcam feed" />
          <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
          {status !== 'on' && <p className="absolute inset-0 grid place-items-center text-white/70">{status === 'loading' ? 'Loading hand tracker…' : 'Camera is off'}</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={start} disabled={status !== 'idle'}><Camera size={16}/>Start camera</button>
          <button className="btn-ghost" onClick={stop} disabled={status === 'idle'}><CameraOff size={16}/>Stop camera</button>
          <span className="ml-auto flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Circle size={10} className={status === 'on' ? 'fill-green-500 text-green-500' : 'text-ink/30'}/>Camera {status === 'on' ? 'on' : 'off'}</span>
            <span className="flex items-center gap-1"><Circle size={10} className={hand ? 'fill-green-500 text-green-500' : 'text-ink/30'}/>{hand ? 'Hand detected' : 'No hand detected'}</span>
          </span>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-xl">Recognized text</h2>
          <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (trained.length ? 'bg-violet/10 text-violet' : 'bg-amber-100 text-amber-800')}>
            {trained.length ? `Real AI mode · ${trained.length} trained signs` : 'Tracking only · no signs trained'}
          </span>
        </div>
        <TextPanel words={words} onClear={() => setWords([])} />
        <div className="mt-4 text-sm">
          <div className="flex justify-between"><span>{pred ? pred.label : status === 'on' ? (hand ? 'Unknown sign' : 'Show your hand to the camera') : 'Waiting'}</span><span>{pred ? Math.round(pred.confidence * 100) + '%' : '–'}</span></div>
          <div className="mt-1 h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${(pred?.confidence ?? 0) * 100}%` }} /></div>
        </div>
        <details className="mt-6 rounded-xl border border-line p-4" open={!trained.length}>
          <summary className="cursor-pointer font-semibold">Teach a sign (train your own vocabulary)</summary>
          <p className="mt-2 text-sm text-ink/70">Start the camera, hold a static hand shape, name it, and record 40 frames. Vary the angle slightly. Trained signs: {trained.join(', ') || 'none yet'}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Sign name, e.g. Yes" aria-label="Sign name" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm" />
            <button className="btn-primary" onClick={record} disabled={status !== 'on' || !label.trim() || left > 0}>{left > 0 ? `Recording ${left}` : 'Record'}</button>
            <button className="btn-ghost" onClick={exportModel} disabled={!trained.length}>Export model</button>
            <button className="btn-ghost" onClick={() => { recognizer.clear(); setTick(t => t + 1) }} disabled={!trained.length}>Reset</button>
          </div>
        </details>
      </section>
    </div>
  )
}
