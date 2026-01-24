import { TypeScale } from './TypeScale';
import { ColorSystem } from './ColorSystem';
import { SpacingSystem } from './SpacingSystem';
import { DrillList } from './DrillList';
import { BiometricVisual } from './BiometricVisual';
import { NavigationSystem } from './NavigationSystem';
import { ComponentShowcase } from './ComponentShowcase';

export function DesignSystemBoard() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#ff0033]/20 px-12 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 border-2 border-[#ff0033] flex items-center justify-center">
              <div className="text-[#ff0033] font-mono text-xs">SS</div>
            </div>
            <h1 className="text-[#ff0033] font-mono text-sm tracking-wider">SETUP SENSEI</h1>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-gray-500 font-mono text-xs">DESIGN SYSTEM</span>
            <span className="text-gray-500 font-mono text-xs">v1.0</span>
          </div>
        </div>
      </header>

      {/* Hero Title */}
      <section className="px-12 py-24">
        <h1 className="text-[12rem] leading-[0.85] font-black tracking-tighter text-[#ff0033] uppercase" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
          CYBERPUNK<br />DOJO
        </h1>
        <p className="text-[#ff0033] font-mono text-sm mt-6 max-w-2xl">
          A MARTIAL ARTS AI TRAINING SYSTEM BUILT FOR THE FUTURE.<br />
          WHERE BIOMECHANICS MEET NEURAL NETWORKS.
        </p>
      </section>

      {/* Main Grid */}
      <div className="px-12 pb-24 space-y-32">
        {/* Typography System */}
        <TypeScale />

        {/* Color & Spacing */}
        <div className="grid grid-cols-2 gap-16">
          <ColorSystem />
          <SpacingSystem />
        </div>

        {/* Components Section */}
        <section>
          <h2 className="text-7xl font-black tracking-tighter text-[#ff0033] uppercase mb-16" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
            COMPONENTS
          </h2>
          <ComponentShowcase />
        </section>

        {/* Navigation System */}
        <NavigationSystem />

        {/* Drill List Component */}
        <section>
          <h2 className="text-7xl font-black tracking-tighter text-[#ff0033] uppercase mb-16" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
            DRILL LIST
          </h2>
          <DrillList />
        </section>

        {/* Biometric Visuals */}
        <section>
          <h2 className="text-7xl font-black tracking-tighter text-[#ff0033] uppercase mb-16" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
            BIOMETRICS
          </h2>
          <BiometricVisual />
        </section>
      </div>
    </div>
  );
}
