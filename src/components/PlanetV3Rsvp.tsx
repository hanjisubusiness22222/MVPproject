import React from 'react';

export const PlanetV3Rsvp: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* planet-v3.html 임베드 프레임 */}
      <div className="w-full bg-[#18241e] rounded-2xl overflow-hidden border-2 border-stone-800 shadow-2xl">
        <iframe
          src="planet-v3.html"
          title="2026 플래닛독서학교 참가 신청"
          className="w-full h-[1800px] sm:h-[1950px] border-0"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
};
