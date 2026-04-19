"use client"

/**
 * Full-bleed animated radar. Pure decoration — no input/score logic.
 * Sits as the backdrop of the hero; very low opacity so H1 reads clean.
 */

export function RadarBackground({ opacity = 0.55 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      aria-hidden
      style={{ opacity }}
    >
      <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="rbBg" cx="50%" cy="100%" r="75%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.10)" />
            <stop offset="55%" stopColor="rgba(6,182,212,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="rbNeedle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="rbGlow">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="1600" height="800" fill="url(#rbBg)" />

        {/* Ring arcs anchored to a focal point at bottom-center */}
        {[180, 300, 420, 540, 660, 780].map((r, i) => (
          <path
            key={r}
            d={`M ${800 - r} 780 A ${r} ${r} 0 0 1 ${800 + r} 780`}
            fill="none"
            stroke="url(#rbNeedle)"
            strokeOpacity={0.18 - i * 0.015}
            strokeWidth={1}
          />
        ))}

        {/* Ambient sonar pulses */}
        {[0, 2.2, 4.4].map((delay, i) => (
          <circle
            key={i}
            cx="800" cy="780" r="40"
            fill="none" stroke="url(#rbNeedle)" strokeOpacity="0.5" strokeWidth="1.2"
          >
            <animate attributeName="r" from="40" to="680" dur="6.5s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.55" to="0" dur="6.5s" begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Rotating scan beam */}
        <g style={{ transformOrigin: "800px 780px" }}>
          <path
            d="M 800 780 L 800 60 A 720 720 0 0 1 1520 780 Z"
            fill="url(#rbNeedle)"
            fillOpacity="0.04"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-180 800 780"
              to="0 800 780"
              dur="18s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Center orb */}
        <circle cx="800" cy="780" r="14" fill="url(#rbNeedle)" filter="url(#rbGlow)" />
        <circle cx="800" cy="780" r="7" fill="#fff" fillOpacity="0.9" />

        {/* Tick marks */}
        {Array.from({ length: 21 }).map((_, i) => {
          const a = (-90 + i * 9) * (Math.PI / 180)
          const r1 = 620, r2 = 640
          const x1 = 800 + Math.cos(a) * r1
          const y1 = 780 + Math.sin(a) * r1
          const x2 = 800 + Math.cos(a) * r2
          const y2 = 780 + Math.sin(a) * r2
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="currentColor" strokeOpacity={i % 5 === 0 ? 0.25 : 0.10} strokeWidth={i % 5 === 0 ? 1.5 : 0.8} />
          )
        })}
      </svg>
    </div>
  )
}
