import { Lock, Check } from 'lucide-react';
import { motion } from 'framer-motion';

type NodeStatus = 'completed' | 'active' | 'locked';

interface HexagonNodeProps {
  level: number;
  title: string;
  status: NodeStatus;
  description?: string;
  onClick?: () => void;
}

export function HexagonNode({ level, title, status, description, onClick }: HexagonNodeProps) {
  const isClickable = status !== 'locked';

  // Breathing animation for active node
  const breathingAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Glitch shake animation for locked node on hover
  const glitchAnimation = {
    x: [0, -2, 2, -2, 2, 0],
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center z-10 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'} group`}
      style={{ overflow: 'visible' }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Level Label - Positioned inside top of hexagon (JetBrains Mono) */}
      <motion.div 
        className="absolute left-1/2 pointer-events-none"
        style={{ 
          top: '30px',
          transform: 'translateX(-50%)',
          zIndex: 20
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span 
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: status === 'active' ? 'rgba(255, 255, 255, 0.8)' : status === 'completed' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
          }}
        >
          LVL {level}
        </span>
      </motion.div>

      {/* STATE A: ACTIVE - Radioactive Core */}
      {status === 'active' && (
        <motion.div
          className="relative"
          style={{ overflow: 'visible' }}
          animate={breathingAnimation}
        >
          {/* Massive Background Glow Layer (unconstrained) */}
          <motion.div 
            className="absolute pointer-events-none"
            style={{
              width: '250%',
              height: '250%',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255, 0, 60, 0.4) 0%, rgba(255, 0, 60, 0.2) 30%, transparent 70%)',
              zIndex: -1,
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <svg
            width="160"
            height="180"
            viewBox="0 0 160 180"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 0 30px rgba(255, 0, 60, 0.8)) drop-shadow(0 0 60px rgba(255, 0, 60, 0.4))',
            }}
          >
            {/* Radial Gradient Definition */}
            <defs>
              <radialGradient id={`activeGradient-${level}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ff003c" stopOpacity="1" />
                <stop offset="70%" stopColor="#330008" stopOpacity="1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="1" />
              </radialGradient>
              
              {/* Inner glow filter */}
              <filter id={`innerGlow-${level}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Crisp SVG Polygon Hexagon */}
            <polygon
              points="80,10 140,50 140,130 80,170 20,130 20,50"
              fill={`url(#activeGradient-${level})`}
              stroke="#ff003c"
              strokeWidth="2"
              filter={`url(#innerGlow-${level})`}
            />
            
            {/* Title with text shadow (Anton) - Centered lower */}
            <text
              x="80"
              y="105"
              textAnchor="middle"
              fontSize="22"
              fontWeight="900"
              fontFamily="Anton, Impact, sans-serif"
              fill="#ffffff"
              className="uppercase"
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))'
              }}
            >
              {title}
            </text>
          </svg>
        </motion.div>
      )}

      {/* STATE B: LOCKED - Frosted Glass */}
      {status === 'locked' && (
        <motion.div 
          className="relative"
          style={{ 
            overflow: 'visible',
            backdropFilter: 'blur(10px)',
          }}
          whileHover={glitchAnimation}
        >
          <svg
            width="160"
            height="180"
            viewBox="0 0 160 180"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id={`frostedGlass-${level}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
              </filter>
            </defs>
            
            {/* Crisp SVG Polygon Hexagon */}
            <polygon
              points="80,10 140,50 140,130 80,170 20,130 20,50"
              fill="rgba(255, 255, 255, 0.03)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
            
            {/* Lock Icon - Centered */}
            <g transform="translate(70, 75)" opacity="0.5">
              <Lock size={20} color="#666666" />
            </g>
            
            {/* Title - Faded, centered lower */}
            <text
              x="80"
              y="120"
              textAnchor="middle"
              fontSize="18"
              fontWeight="900"
              fontFamily="Anton, Impact, sans-serif"
              fill="rgba(255, 255, 255, 0.2)"
              className="uppercase"
            >
              {title}
            </text>
          </svg>
        </motion.div>
      )}

      {/* STATE C: COMPLETED - Clean Minimalist */}
      {status === 'completed' && (
        <motion.div 
          className="relative"
          style={{ overflow: 'visible' }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            width="160"
            height="180"
            viewBox="0 0 160 180"
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              overflow: 'visible',
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))'
            }}
          >
            {/* Crisp SVG Polygon Hexagon */}
            <polygon
              points="80,10 140,50 140,130 80,170 20,130 20,50"
              fill="transparent"
              stroke="#ffffff"
              strokeWidth="2"
            />
            
            {/* Checkmark - Centered */}
            <g transform="translate(70, 70)">
              <Check size={22} color="#ffffff" strokeWidth={3} />
            </g>
            
            {/* Title - Bright White, centered lower */}
            <text
              x="80"
              y="110"
              textAnchor="middle"
              fontSize="20"
              fontWeight="900"
              fontFamily="Anton, Impact, sans-serif"
              fill="#ffffff"
              className="uppercase"
            >
              {title}
            </text>
          </svg>
        </motion.div>
      )}

      {/* Description label */}
      {description && status !== 'locked' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 font-mono text-[10px] tracking-[0.15em] text-center px-4 uppercase"
          style={{
            color: status === 'active' ? '#ff003c' : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          {description}
        </motion.div>
      )}
    </div>
  );
}
