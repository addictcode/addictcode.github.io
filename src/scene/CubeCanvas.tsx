import { Canvas } from '@react-three/fiber'
import { DESKTOP_MIN_WIDTH } from '../stage/framing'
import { CubeScene } from './CubeScene'

interface CubeCanvasProps {
  posterChapter?: number | null
  onReady: () => void
}

/** Холст сцены. Рисует кадр только по запросу: когда меняется скролл, курсор или по фигуре кликнули. */
export default function CubeCanvas({ posterChapter = null, onReady }: CubeCanvasProps) {
  const desktop = window.innerWidth >= DESKTOP_MIN_WIDTH
  // на телефоне плотность пикселей ограничена и тени выключены
  const shadows = desktop || posterChapter !== null
  return (
    <Canvas
      className="stage__canvas"
      frameloop="demand"
      flat
      shadows={shadows ? 'soft' : false}
      dpr={[1, desktop ? 2 : 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
      aria-hidden="true"
    >
      <CubeScene posterChapter={posterChapter} shadows={shadows} onReady={onReady} />
    </Canvas>
  )
}
