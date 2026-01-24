interface CircuitPathProps {
  height: number;
  isActive?: boolean;
  direction?: 'left' | 'right' | 'straight';
}

export function CircuitPath({ height, isActive = false, direction = 'straight' }: CircuitPathProps) {
  const generatePath = () => {
    const startY = 0;
    const endY = height;
    const midY = height / 2;

    switch (direction) {
      case 'left':
        return `M 80 ${startY} Q 40 ${midY} 80 ${endY}`;
      case 'right':
        return `M 80 ${startY} Q 120 ${midY} 80 ${endY}`;
      default:
        return `M 80 ${startY} L 80 ${endY}`;
    }
  };

  return (
    <svg
      width="160"
      height={height}
      viewBox={`0 0 160 ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className="my-2"
    >
      {/* Outer glow path */}
      {isActive && (
        <path
          d={generatePath()}
          fill="none"
          stroke="#ff003c"
          strokeWidth="6"
          opacity="0.2"
          filter="blur(4px)"
        />
      )}
      
      {/* Main path */}
      <path
        d={generatePath()}
        fill="none"
        stroke={isActive ? '#ff003c' : '#1a1a1a'}
        strokeWidth="2"
        className={isActive ? 'circuit-pulse' : ''}
        style={{
          filter: isActive ? 'drop-shadow(0 0 4px #ff003c)' : 'none',
        }}
      />

      {/* Animated data packets on active paths */}
      {isActive && (
        <>
          <circle r="3" fill="#ff003c" className="circuit-pulse">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={generatePath()}
            />
          </circle>
          <circle r="2" fill="#ffffff" opacity="0.8">
            <animateMotion
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
              path={generatePath()}
            />
          </circle>
        </>
      )}
    </svg>
  );
}
