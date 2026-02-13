import { useState } from 'react';

interface TrainingScreenProps {
  onStartTrainDrill: () => void;
}

export function TrainingScreen({ onStartTrainDrill }: TrainingScreenProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="h-screen overflow-y-auto pb-16 animate-slide-in">
      <header className="px-16 pt-12 pb-8 border-b border-[#ff003c]/20">
        <span className="font-mono text-[10px] text-gray-500 tracking-wider block mb-4">
          RAW_DATA_COLLECTION
        </span>
        <h1
          className="text-[6rem] leading-[0.85] font-black tracking-tighter uppercase"
          style={{
            fontFamily: 'Impact, "Anton", "Teko", sans-serif',
            color: '#ff003c',
            textShadow: '0 0 30px rgba(255, 0, 60, 0.4)',
          }}
        >
          TRAINING
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-16 py-12">
        <button
          onClick={onStartTrainDrill}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-full text-left border p-8 transition-all duration-300 cursor-pointer"
          style={{
            background: 'rgba(10, 10, 10, 0.8)',
            backdropFilter: 'blur(10px)',
            borderColor: '#ff003c',
            borderWidth: '1px',
            boxShadow: isHovered
              ? '0 0 50px rgba(255, 0, 60, 0.3)'
              : '0 0 30px rgba(255, 0, 60, 0.15)',
          }}
        >
          <span className="font-mono text-[9px] text-gray-500 tracking-wider block mb-4">
            DATA_CAPTURE_MODULE
          </span>
          <h2
            className="text-4xl font-black tracking-tighter uppercase mb-3"
            style={{
              fontFamily: 'Impact, "Anton", "Teko", sans-serif',
              color: '#ff003c',
              textShadow: '0 0 20px rgba(255, 0, 60, 0.4)',
            }}
          >
            TRAIN DRILL
          </h2>
          <span className="font-mono text-[10px] text-gray-500 tracking-wider">
            RECORD_RAW_IMU_DATA
          </span>
        </button>
      </div>
    </div>
  );
}
