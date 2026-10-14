import React, { useState } from 'react';
import { TeaserPage } from './components/TeaserPage';
import { OfficialInvitation } from './components/OfficialInvitation';
import { EVENT_CONFIG } from './constants/eventConfig';
import { Compass } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'teaser' | 'main'>(
    EVENT_CONFIG.isTeaserMode ? 'teaser' : 'main'
  );

  return (
    <div className="relative min-h-screen">
      {/* 개발자 및 시연용 모드 스위처 배너 */}
      <aside 
        aria-label="화면 모드 전환"
        className="fixed bottom-3 right-3 z-50 bg-[#16231b]/95 border border-[#ffffff]/30 rounded-full py-1.5 px-3 text-[11px] text-[#f7f5ed] font-serif flex items-center space-x-2 shadow-2xl backdrop-blur-md"
      >
        <Compass className="w-3.5 h-3.5 text-[#dfc27d]" />
        <span>화면:</span>
        <button
          onClick={() => setViewMode(viewMode === 'teaser' ? 'main' : 'teaser')}
          className="px-2 py-0.5 rounded bg-[#b82828] hover:bg-[#961e1e] text-white font-bold transition-colors"
        >
          {viewMode === 'teaser' ? '교실 칠판 (티저)' : '가정통신문 (본 안내장)'}
        </button>
      </aside>

      {/* 뷰 렌더링 */}
      {viewMode === 'teaser' ? (
        <TeaserPage onExploreFullPage={() => setViewMode('main')} />
      ) : (
        <OfficialInvitation onBackToTeaser={() => setViewMode('teaser')} />
      )}
    </div>
  );
};

export default App;
