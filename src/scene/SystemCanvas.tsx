import { Canvas } from '@react-three/fiber'
import { SystemScene } from './SystemScene'

interface SystemCanvasProps {
  posterChapter?: number | null
  onReady: () => void
}

/** Холст карты. Лежит под текстом и не перехватывает указатель. */
export default function SystemCanvas({ posterChapter = null, onReady }: SystemCanvasProps) {
  const narrow = window.innerWidth < 1100
  return (
    <Canvas
      className="stage__canvas"
      flat
      dpr={[1, narrow ? 1.5 : 2]}
      camera={{ fov: 30, near: 0.5, far: 300 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <SystemScene posterChapter={posterChapter} onReady={onReady} />
    </Canvas>
  )
}
