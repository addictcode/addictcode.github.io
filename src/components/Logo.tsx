import { profile } from '../content/profile'
import { Ticks } from './Icons'

/** Знак студии: две галочки, «заявка доставлена и прочитана». */
export function Logo() {
  return (
    <span className="logo">
      <span className="logo__mark">
        <Ticks />
      </span>
      {profile.studio}
    </span>
  )
}
