import { Canvas } from '@react-three/fiber'
import { DESKTOP_MIN_WIDTH } from '../stage/framing'
import { ConveyorScene } from './ConveyorScene'

interface ConveyorCanvasProps {
  stamps: string[]
  posterStation?: number | null
  onReady: () => void
}

/** Холст сцены. Рисует кадр только по запросу: когда меняется скролл, курсор или посылку толкнули. */
export default function ConveyorCanvas({ stamps, posterStation = null, onReady }: ConveyorCanvasProps) {
  const maxDpr = window.innerWidth < DESKTOP_MIN_WIDTH ? 1.5 : 2
  return (
    <Canvas
      className="stage__canvas"
      frameloop="demand"
      dpr={[1, maxDpr]}
      gl={{ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' }}
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
      aria-hidden="true"
    >
      <ConveyorScene stamps={stamps} posterStation={posterStation} onReady={onReady} />
    </Canvas>
  )
}
