import { GLYPH_VIEWBOX, STATUS_GLYPH, type Status } from '@/lib/status'

/**
 * The second channel that carries status when hue fails — greyscale, colour
 * blindness, a bad monitor. Never render a status as colour alone.
 *
 * Decorative here: the status is always named in adjacent text, so announcing
 * the shape too would just be noise.
 */
export function StatusGlyph({ status, size = 14 }: { status: Status; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={GLYPH_VIEWBOX} aria-hidden focusable="false">
      {STATUS_GLYPH[status].map((shape, index) =>
        shape.kind === 'circle' ? (
          <circle
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.filled ? 'currentColor' : 'none'}
            stroke={shape.filled ? undefined : 'currentColor'}
            strokeWidth={shape.strokeWidth}
          />
        ) : (
          <path
            key={index}
            d={shape.d}
            fill={shape.filled ? 'currentColor' : 'none'}
            stroke={shape.filled ? undefined : 'currentColor'}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
          />
        ),
      )}
    </svg>
  )
}
