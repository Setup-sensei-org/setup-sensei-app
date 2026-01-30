/**
 * DojoMatBackground Component
 * 
 * Simulates the look of high-density rubber gym mat (Dojo flooring).
 * Features a coarser texture and slight color lift to reveal depth.
 */

export function DojoMatBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -50,
        backgroundColor: '#121212', // Dark Charcoal - allows texture visibility
      }}
    >
      {/* Rubber Texture - Coarse Grain Noise */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: 'overlay',
          opacity: 0.08,
        }}
      >
        <defs>
          <filter id="rubberNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#rubberNoise)"
          opacity="1"
        />
      </svg>

      {/* Overhead Light - Simulates gym lighting hitting the mat */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.04) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}

