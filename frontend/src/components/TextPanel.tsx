import { useState } from 'react'
import { Copy, Check, Volume2, VolumeX, Trash2, Download } from 'lucide-react'
export default function TextPanel({ words, onClear, download }: { words: string[]; onClear?: () => void; download?: boolean }) {
  const text = words.join(' ')
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { alert('Copy was blocked by the browser.') } }
  const speak = () => { if (!('speechSynthesis' in window)) return alert('Speech is not supported in this browser.'); speechSynthesis.cancel(); if (text) speechSynthesis.speak(new SpeechSynthesisUtterance(text)) }
  const stop = () => { if ('speechSynthesis' in window) speechSynthesis.cancel() }
  const dl = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = 'signbridge-transcript.txt'; a.click() }
  return (
    <div>
      <div aria-live="polite" className="min-h-32 rounded-xl bg-mist p-4 font-display text-2xl leading-snug">
        {text || <span className="font-sans text-base text-ink/50">Recognized text will appear here.</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={copy} disabled={!text}>{copied ? <Check size={16}/> : <Copy size={16}/>}{copied ? 'Copied' : 'Copy text'}</button>
        <button className="btn-ghost" onClick={speak} disabled={!text} aria-label="Read text aloud"><Volume2 size={16}/>Speak</button>
        <button className="btn-ghost" onClick={stop} aria-label="Stop speech"><VolumeX size={16}/>Stop</button>
        {download && <button className="btn-ghost" onClick={dl} disabled={!text}><Download size={16}/>Download TXT</button>}
        {onClear && <button className="btn-ghost" onClick={onClear} disabled={!text}><Trash2 size={16}/>Clear text</button>}
      </div>
    </div>
  )
}
