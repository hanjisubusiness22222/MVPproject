import React, { useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

export const PlanetV3Rsvp: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* 상단 퀵 컨트롤 바 */}
      <div className="flex items-center justify-between bg-white/90 border border-[#d8d1c5] rounded-xl px-3.5 py-2 text-xs font-serif shadow-xs">
        <div className="flex items-center gap-1.5 text-[#2e5238] font-bold text-xs sm:text-sm">
          <span>🎨</span>
          <span>동글동글 색연필 크로키 학생증 공방 & 참가 신청서</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#f5f2eb] hover:bg-[#eae4d7] text-[#444] text-[11px] font-bold transition-all"
            title="신청 폼 새로고침"
          >
            <RefreshCw className="w-3 h-3" />
            <span>새로고침</span>
          </button>
          <a
            href="planet-v3.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#b82828] hover:bg-[#961f1f] text-white text-[11px] font-bold transition-all shadow-xs"
            title="새 창에서 전체화면으로 열기"
          >
            <span>새 창에서 열기</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* planet-v3.html 임베드 프레임 */}
      <div className="w-full bg-[#18241e] rounded-2xl overflow-hidden border-2 border-stone-800 shadow-2xl">
        <iframe
          key={iframeKey}
          src="planet-v3.html"
          title="2026 플래닛독서학교 동글동글 색연필 크로키 학생증 발급처"
          className="w-full h-[1800px] sm:h-[1950px] border-0"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
};
