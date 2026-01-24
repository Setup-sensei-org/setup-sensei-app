import { motion } from 'framer-motion';

interface CircuitPathProps {
  height: number;
  isActive?: boolean;
  direction?: 'left' | 'right' | 'straight';
}

export function CircuitPath({ height, isActive = false, direction = 'straight' }: CircuitPathProps) {
  // Generate organic S-curve Bezier path that starts at (80, 0) and ends at (80, height)
  // These coordinates match the bottom-center and top-center of hexagons
  const generatePath = () => {
    const startX = 80;
    const startY = 0;
    const endX = 80;
    const endY = height;
    const midY = height / 2;

    switch (direction) {
      case 'left':
        // Smooth S-curve to the left
        return `M ${startX} ${startY} C ${startX - 30} ${midY * 0.4}, ${startX - 30} ${midY * 1.2}, ${endX} ${midY} C ${endX + 30} ${midY + (midY * 0.3)}, ${endX + 30} ${midY + (midY * 0.7)}, ${endX} ${endY}`;
      case 'right':
        // Smooth S-curve to the right
        return `M ${startX} ${startY} C ${startX + 30} ${midY * 0.4}, ${startX + 30} ${midY * 1.2}, ${endX} ${midY} C ${endX - 30} ${midY + (midY * 0.3)}, ${endX - 30} ${midY + (midY * 0.7)}, ${endX} ${endY}`;
      default:
        // Subtle organic curve for straight
        return `M ${startX} ${startY} C ${startX + 8} ${midY * 0.5}, ${startX - 8} ${midY * 1.5}, ${endX} ${endY}`;
    }
  };

  const pathData = generatePath();
  const pathLength = height * 1.8; // Adjusted for curve length

  return (
    <div className="relative z-0" style={{ overflow: 'visible' }}>
      <svg
        width="160"
        height={height}
        viewBox={`0 0 160 ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="my-2"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Enhanced Glow Filter with Multiple Blur Layers */}
          <filter id={`pathGlow-${height}-${direction}`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense Bloom for Active Paths */}
          <filter id={`pathBloom-${height}-${direction}`} x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outermost Bloom Layer (Active only) */}
        {isActive && (
          <motion.path
            d={pathData}
            fill="none"
            stroke="#ff003c"
            strokeWidth="20"
            opacity="0.15"
            strokeLinecap="round"
            filter={`url(#pathBloom-${height}-${direction})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        )}
        
        {/* Large Glow Layer (Active only) */}
        {isActive && (
          <motion.path
            d={pathData}
            fill="none"
            stroke="#ff003c"
            strokeWidth="10"
            opacity="0.3"
            strokeLinecap="round"
            filter={`url(#pathGlow-${height}-${direction})`}
          />
        )}
        
        {/* Medium Glow Layer */}
        {isActive && (
          <motion.path
            d={pathData}
            fill="none"
            stroke="#ff003c"
            strokeWidth="5"
            opacity="0.5"
            strokeLinecap="round"
            filter={`url(#pathGlow-${height}-${direction})`}
          />
        )}
        
        {/* Main Neural Cable Path - Crisp and Clean */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={isActive ? '#ff003c' : 'rgba(255, 255, 255, 0.08)'}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ 
            pathLength: { duration: 1, ease: "easeInOut" },
            opacity: { duration: 0.3 }
          }}
          filter={isActive ? `url(#pathGlow-${height}-${direction})` : 'none'}
        />

        {/* Animated "Data Flow" Pulse - Primary (Active only) */}
        {isActive && (
          <motion.path
            d={pathData}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${pathLength * 0.12} ${pathLength}`}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -pathLength * 2 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear"
            }}
            opacity="0.9"
            filter={`url(#pathGlow-${height}-${direction})`}
          />
        )}

        {/* Secondary Pulse (Active only) */}
        {isActive && (
          <motion.path
            d={pathData}
            fill="none"
            stroke="#ff003c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${pathLength * 0.08} ${pathLength}`}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -pathLength * 2 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.8
            }}
            opacity="0.7"
          />
        )}

        {/* Animated Data Particles (Active only) */}
        {isActive && (
          <>
            {/* Particle 1 - Large Red */}
            <motion.circle
              r="4"
              fill="#ff003c"
              opacity="0.9"
              filter={`url(#pathGlow-${height}-${direction})`}
            >
              <animateMotion
                dur="3.5s"
                repeatCount="indefinite"
                path={pathData}
              />
            </motion.circle>
            
            {/* Particle 2 - Small White */}
            <motion.circle
              r="2.5"
              fill="#ffffff"
              opacity="1"
            >
              <animateMotion
                dur="3.5s"
                begin="1.2s"
                repeatCount="indefinite"
                path={pathData}
              />
            </motion.circle>

            {/* Particle 3 - Medium Red */}
            <motion.circle
              r="3"
              fill="#ff003c"
              opacity="0.8"
            >
              <animateMotion
                dur="3.5s"
                begin="2.3s"
                repeatCount="indefinite"
                path={pathData}
              />
            </motion.circle>
          </>
        )}
      </svg>
    </div>
  );
}
