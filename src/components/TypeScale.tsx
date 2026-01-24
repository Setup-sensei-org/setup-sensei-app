export function TypeScale() {
  return (
    <section>
      <h2 className="text-7xl font-black tracking-tighter text-[#ff0033] uppercase mb-16" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
        TYPOGRAPHY
      </h2>
      
      <div className="grid grid-cols-2 gap-16">
        {/* Display Typography */}
        <div className="space-y-12">
          <div>
            <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">DISPLAY / HEADERS</div>
            <div className="border-t border-[#ff0033]/20 pt-6 space-y-8">
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">H1 / 192px</span>
                <h1 className="text-8xl font-black tracking-tighter text-[#ff0033] uppercase" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
                  STRIKE
                </h1>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">H2 / 112px</span>
                <h2 className="text-7xl font-black tracking-tighter text-white uppercase" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
                  DEFEND
                </h2>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">H3 / 56px</span>
                <h3 className="text-5xl font-black tracking-tighter text-white uppercase" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
                  COUNTER
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Body Typography */}
        <div className="space-y-12">
          <div>
            <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">BODY / DATA</div>
            <div className="border-t border-[#ff0033]/20 pt-6 space-y-6">
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">MONO LARGE / 16px</span>
                <p className="font-mono text-base text-white">
                  ACCURACY: 94.7%
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">MONO MEDIUM / 14px</span>
                <p className="font-mono text-sm text-white">
                  FORM ANALYSIS: OPTIMAL
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">MONO SMALL / 12px</span>
                <p className="font-mono text-xs text-gray-400">
                  SESSION_ID: 0x7AF2E9D1
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-xs block mb-2">LABEL / 10px</span>
                <p className="font-mono text-[10px] text-gray-500 tracking-wider">
                  NEURAL_NETWORK_ACTIVE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
