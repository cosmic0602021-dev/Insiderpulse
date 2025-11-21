import React from 'react';

const Overlay: React.FC = () => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-[#0f0f0f] px-8 py-4 border border-neutral-800 shadow-2xl shadow-black">
        <h1 className="text-neutral-300 font-black text-xl md:text-3xl tracking-tight uppercase whitespace-nowrap select-none">
          InsiderPulse Signal
        </h1>
      </div>
    </div>
  );
};

export default Overlay;