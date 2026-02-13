/**
 * MatteTexture Component
 * 
 * Adds a static matte grain texture to the background, making it feel like
 * heavy cardstock or dark slate material rather than flat digital color.
 */

export function MatteTexture() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
      }}
    >
      {/* Noise Layer - The "Matte" Effect */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: 'overlay',
          opacity: 0.05,
        }}
      >
        <defs>
          <filter id="matteNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#matteNoise)"
          opacity="1"
        />
      </svg>

      {/* Vignette Overlay - Deepening edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />
    </div>
  );
}

