export function SpacingSystem() {
  const spacing = [
    { name: 'XS', value: '8px', usage: 'TIGHT' },
    { name: 'SM', value: '16px', usage: 'COMPACT' },
    { name: 'MD', value: '24px', usage: 'DEFAULT' },
    { name: 'LG', value: '48px', usage: 'BREATHE' },
    { name: 'XL', value: '96px', usage: 'CINEMATIC' },
    { name: 'XXL', value: '192px', usage: 'EPIC' },
  ];

  return (
    <section>
      <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">SPACING SCALE</div>
      <div className="border-t border-[#ff0033]/20 pt-6">
        <div className="space-y-6">
          {spacing.map((space, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-white">{space.name}</span>
                <span className="font-mono text-xs text-gray-500">{space.value}</span>
              </div>
              <div className="flex items-center gap-4">
                <div 
                  className="h-2 bg-[#ff0033]" 
                  style={{ width: space.value }}
                />
                <span className="font-mono text-[10px] text-gray-500 tracking-wider">{space.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
