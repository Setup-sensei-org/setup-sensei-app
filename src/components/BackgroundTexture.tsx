/**
 * BackgroundTexture Component
 * 
 * High-end texture overlay for dark slate/matte metal aesthetic.
 * Provides subtle depth without gimmicky effects.
 */

export function BackgroundTexture() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        backgroundColor: '#050505',
      }}
    >
      {/* Layer 1: Deep Vignette - Radial Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
        }}
      />

      {/* Layer 2: Analog Noise - SVG Turbulence */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: 'overlay',
          opacity: 0.03,
        }}
      >
        <defs>
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="saturate"
              values="0"
            />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#noiseFilter)"
          opacity="1"
        />
      </svg>

      {/* Layer 3: Ghost Grid - Masked Radial Fade */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
        }}
      />
    </div>
  );
}

