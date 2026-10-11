import { useEffect, useState } from 'react'
import { Hand } from 'lucide-react'
import Live from './pages/Live'
import Upload from './pages/Upload'
const nav = [['home', 'Home'], ['live', 'Live Recognition'], ['upload', 'Upload Video'], ['how', 'How It Works'], ['about', 'About']] as const
const Limits = () => <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Limitations: hand tracking is not sign-language translation. This prototype recognizes only static hand shapes you have trained (or that are in the configured model file). Words that need movement, two hands, or facial grammar are not supported yet.</p>
function Hero({ go }: { go: (p: string) => void }) {
  const pts = [[60,150],[75,125],[95,105],[112,88],[125,70],[88,92],[92,62],[94,42],[95,24],[68,88],[68,56],[68,34],[68,16],[48,92],[44,64],[42,44],[40,28],[30,102],[20,82],[14,66],[8,52]]
  return (<div className="mx-auto max-w-6xl px-4 py-14">
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div><h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Every Gesture Has a Voice.</h1>
        <p className="mt-5 max-w-md text-lg text-ink/75">Turn sign language into text with AI-powered hand tracking and real-time recognition.</p>
        <div className="mt-7 flex flex-wrap gap-3"><button className="btn-primary" onClick={() => go('live')}>Try Live Recognition</button><button className="btn-ghost" onClick={() => go('upload')}>Upload a Video</button></div></div>
      <div className="card" aria-label="Illustration of the recognition interface">
        <svg viewBox="0 0 140 170" className="mx-auto h-56">{pts.map(([x, y], i) => <circle key={i} cx={x + 20} cy={y} r="3.5" fill="#2f5bff" />)}
          {[[0,1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]].map((f, i) => <polyline key={i} fill="none" stroke="#6d4bdb" strokeWidth="2" points={[0,...f.slice(0)].filter((v,j)=>i===0||j>0||true).map(k => `${pts[k][0]+20},${pts[k][1]}`).join(' ')} />)}</svg>
        <p className="text-center text-xs text-ink/60">Illustration only. Real landmarks appear on the Live page.</p></div>
    </div>
    <div className="mt-14 grid gap-4 sm:grid-cols-3">{[['Live recognition', 'Track your hand through the webcam and see text appear as you sign.'], ['Video transcription', 'Upload a clip and get a transcript you can copy or download.'], ['Private by default', 'Hand tracking and recognition run in your browser. Video is not uploaded.']].map(([t, d]) => <div key={t} className="card"><h3 className="font-display text-lg">{t}</h3><p className="mt-2 text-sm text-ink/70">{d}</p></div>)}</div>
    <div className="mt-10"><Limits /></div></div>)
}
function Info({ how }: { how: boolean }) {
  return (<div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
    <h1 className="font-display text-4xl">{how ? 'How it works' : 'About SignBridge AI'}</h1>
    {how ? (<ol className="list-decimal space-y-2 pl-5"><li>Video input: webcam stream or an uploaded file.</li><li>Frame processing: frames are read in the browser (video files are sampled about 10 times per second).</li><li>Landmark extraction: MediaPipe Hand Landmarker finds 21 points on the hand.</li><li>Sign classification: landmarks are normalized and matched to trained examples (k-nearest neighbours). Replace <code>src/services/recognizer.ts</code> to plug in a TensorFlow model.</li><li>Text output: stable predictions are added once, then can be copied, downloaded or spoken.</li></ol>)
      : <p>SignBridge AI is a student prototype exploring accessible communication with open tools: React, MediaPipe Tasks Vision, and the browser Web Speech API. The vocabulary is whatever signs are trained in the model file; none are built in.</p>}
    <Limits /></div>)
}
export default function App() {
  const read = () => (location.hash.slice(1) || 'home'); const [page, setPage] = useState(read())
  useEffect(() => { const f = () => setPage(read()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const go = (p: string) => { location.hash = p; window.scrollTo(0, 0) }
  return (<>
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
      <button onClick={() => go('home')} className="flex items-center gap-2 font-display text-lg font-bold"><Hand className="text-violet" size={20}/>SignBridge AI</button>
      <nav aria-label="Main" className="flex flex-wrap gap-1 text-sm">{nav.map(([k, n]) => <button key={k} onClick={() => go(k)} aria-current={page === k ? 'page' : undefined} className={'rounded-lg px-3 py-1.5 ' + (page === k ? 'bg-violet/10 font-semibold text-violet' : 'hover:bg-mist')}>{n}</button>)}</nav>
      <button className="btn-primary ml-auto" onClick={() => go('live')}>Start Translating</button></div></header>
    <main>{page === 'live' ? <Live /> : page === 'upload' ? <Upload /> : page === 'how' ? <Info how /> : page === 'about' ? <Info how={false} /> : <Hero go={go} />}</main></>)
}
