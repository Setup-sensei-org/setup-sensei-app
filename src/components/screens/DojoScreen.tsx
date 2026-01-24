import { DrillListMobile } from '../DrillListMobile';
import { DrillDetail } from '../../types';

interface DojoScreenProps {
  onDrillClick: (drill: DrillDetail) => void;
}

export function DojoScreen({ onDrillClick }: DojoScreenProps) {
  return (
    <div className="min-h-full pb-6">
      {/* Section A: Hero Header - MASSIVE Single Line */}
      <section className="px-6 pt-16 pb-12">
        <h1 
          className="text-[5.5rem] leading-[0.85] font-black tracking-tighter text-[#ff0033] uppercase text-center"
          style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}
        >
          SETUP SENSEI
        </h1>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#ff0033] rounded-full animate-pulse" />
          <span className="font-mono text-[10px] text-gray-500 tracking-wider">
            NEURAL_LINK_ACTIVE
          </span>
        </div>
      </section>

      {/* Section B: Drills (Biometric removed) */}
      <section className="px-6">
        <div className="border-t border-[#ff0033]/20 pt-6 mb-4">
          <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-2">
            ACTIVE_DRILLS
          </div>
        </div>
        <DrillListMobile onDrillClick={onDrillClick} />
      </section>
    </div>
  );
}