import { Canvas } from '@react-three/fiber'
import { RibbonScene } from './RibbonScene'

interface RibbonCanvasProps {
  texts: { main: string; stack: string }
  posterChapter?: number | null
  onReady: () => void
}

/** Холст сцены. Рисует кадр только по запросу: когда меняется скролл, курсор или по сцене кликнули. */
export default function RibbonCanvas({ texts, posterChapter = null, onReady }: RibbonCanvasProps) {
  const phone = window.innerWidth < 960
  return (
    <Canvas
      className="stage__canvas"
      frameloop="demand"
      flat
      dpr={[1, phone ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <RibbonScene texts={texts} posterChapter={posterChapter} onReady={onReady} />
    </Canvas>
  )
}
