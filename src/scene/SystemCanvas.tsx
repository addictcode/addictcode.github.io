import { Canvas } from '@react-three/fiber'
import type { ShapeId } from '../system/graph'
import { VoxelScene } from './VoxelScene'

interface SystemCanvasProps {
  posterShape?: ShapeId | null
  onReady: () => void
}

/** Холст скульптуры. Лежит под текстом и не перехватывает указатель. */
export default function SystemCanvas({ posterShape = null, onReady }: SystemCanvasProps) {
  const narrow = window.innerWidth < 900
  return (
    <Canvas
      className="stage__canvas"
      dpr={[1, narrow ? 1.5 : 2]}
      camera={{ fov: 32, near: 0.5, far: 200 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <VoxelScene posterShape={posterShape} onReady={onReady} />
    </Canvas>
  )
}
