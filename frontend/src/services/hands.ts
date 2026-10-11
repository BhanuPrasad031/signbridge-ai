import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
export async function createHandLandmarker() {
  const fs = await FilesetResolver.forVisionTasks(WASM)
  return HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'VIDEO', numHands: 1 })
}
