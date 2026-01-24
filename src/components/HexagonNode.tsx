import { Lock, ArrowDown } from 'lucide-react';

type NodeStatus = 'completed' | 'active' | 'locked';

interface HexagonNodeProps {
  level: number;
  title: string;
  status: NodeStatus;
  description?: string;
  onClick?: () => void;
}

export function HexagonNode({ level, title, status, description, onClick }: HexagonNodeProps) {
  const getNodeStyle = () => {
    switch (status) {
      case 'completed':
        return {
          fill: '#ffffff',
          stroke: '#ffffff',
          textColor: '#050505',
          glowColor: 'none',
        };
      case 'active':
        return {
          fill: '#ff003c',
          stroke: '#ff003c',
          textColor: '#ffffff',
          glowColor: '0 0 16px #ff003c, 0 0 32px #ff003c',
        };
      case 'locked':
        return {
          fill: 'transparent',
          stroke: '#1a1a1a',
          textColor: '#333333',
          glowColor: 'none',
        };
    }
  };

  const style = getNodeStyle();
  const isClickable = status !== 'locked';

  return (
    <div
      className={`relative flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Hexagon SVG */}
      <div
        className={`relative ${status === 'active' ? 'hexagon-pulse' : ''} transition-all duration-300 hover:scale-105`}
        style={{
          filter: `drop-shadow(${style.glowColor})`,
        }}
      >
        <svg
          width="160"
          height="180"
          viewBox="0 0 160 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagon path */}
          <path
            d="M80 10 L140 50 L140 130 L80 170 L20 130 L20 50 Z"
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={status === 'active' ? '3' : '1.5'}
            className="transition-all duration-300"
          />
          
          {/* Level number */}
          <text
            x="80"
            y="75"
            textAnchor="middle"
            fontSize="14"
            fontFamily="JetBrains Mono, monospace"
            fill={style.textColor}
            opacity="0.6"
          >
            LVL {level}
          </text>

          {/* Title */}
          <text
            x="80"
            y="100"
            textAnchor="middle"
            fontSize="18"
            fontWeight="900"
            fontFamily="Impact, Anton, sans-serif"
            fill={style.textColor}
            className="uppercase"
          >
            {title}
          </text>

          {/* Lock icon for locked nodes */}
          {status === 'locked' && (
            <g transform="translate(70, 110)">
              <Lock size={20} color={style.textColor} />
            </g>
          )}

          {/* Floating arrow for active node */}
          {status === 'active' && (
            <g transform="translate(70, 115)" className="circuit-pulse">
              <ArrowDown size={20} color={style.textColor} />
            </g>
          )}
        </svg>
      </div>

      {/* Description label */}
      {description && status !== 'locked' && (
        <div
          className="mt-4 font-mono text-[10px] tracking-wider text-center px-4"
          style={{
            color: status === 'active' ? '#ff003c' : '#666666',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}
