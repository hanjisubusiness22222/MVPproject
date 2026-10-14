import React, { useState, useEffect } from 'react';
import { TeaserPage } from './components/TeaserPage';
import { OfficialInvitation } from './components/OfficialInvitation';
import { ClassroomSeatShuffle } from './components/ClassroomSeatShuffle';
import { AdminDashboard } from './components/AdminDashboard';
import { SettlementReport } from './components/SettlementReport';
import { EVENT_CONFIG } from './constants/eventConfig';
import { Compass, Users, ShieldCheck, BookOpen, Receipt } from 'lucide-react';

type ViewMode = 'teaser' | 'main' | 'seat' | 'admin' | 'settlement';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#seat') return 'seat';
    if (hash === '#admin') return 'admin';
    if (hash === '#settlement') return 'settlement';
    return EVENT_CONFIG.isTeaserMode ? 'teaser' : 'main';
  });

  // URL Hash 감지
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#seat') setViewMode('seat');
      else if (hash === '#admin') setViewMode('admin');
      else if (hash === '#settlement') setViewMode('settlement');
      else if (hash === '#teaser') setViewMode('teaser');
      else if (hash === '#main') setViewMode('main');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    window.location.hash = mode;
  };

  return (
    <div className="relative min-h-screen">
      {/* 화면 빠른 전환 플로팅 스위처 (모바일 중앙 하단 / 데스크톱 우측 하단) */}
      <aside 
        aria-label="화면 모드 전환"
        className="fixed bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:right-3 sm:translate-x-0 z-50 bg-[#16231b]/95 border border-[#ffffff]/30 rounded-full p-1 sm:p-1.5 text-[11px] sm:text-xs text-[#f7f5ed] font-serif flex items-center space-x-1 shadow-2xl backdrop-blur-md max-w-[calc(100vw-16px)] overflow-x-auto scrollbar-none"
      >
        <button
          onClick={() => changeView('teaser')}
          className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap transition-all ${viewMode === 'teaser' ? 'bg-[#b82828] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="교실 칠판 티저"
        >
          칠판
        </button>
        <button
          onClick={() => changeView('main')}
          className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap transition-all ${viewMode === 'main' ? 'bg-[#b82828] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="가정통신문 정식 안내"
        >
          가정통신문
        </button>
        <button
          onClick={() => changeView('seat')}
          className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap transition-all flex items-center space-x-1 ${viewMode === 'seat' ? 'bg-[#2e5238] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="자리 배치"
        >
          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>자리 배치</span>
        </button>
        <button
          onClick={() => changeView('settlement')}
          className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap transition-all flex items-center space-x-1 ${viewMode === 'settlement' ? 'bg-[#c29b38] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="학생회비 투명 정산"
        >
          <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>정산</span>
        </button>
        <button
          onClick={() => changeView('admin')}
          className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap transition-all flex items-center space-x-1 ${viewMode === 'admin' ? 'bg-[#3b5998] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="운영진 관리자 대시보드"
        >
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>관리자</span>
        </button>
      </aside>

      {/* 뷰 렌더링 */}
      {viewMode === 'teaser' && (
        <TeaserPage onExploreFullPage={() => changeView('main')} />
      )}
      {viewMode === 'main' && (
        <OfficialInvitation 
          onBackToTeaser={() => changeView('teaser')} 
          onGoToSettlement={() => changeView('settlement')}
        />
      )}
      {viewMode === 'seat' && (
        <ClassroomSeatShuffle onBack={() => changeView('main')} />
      )}
      {viewMode === 'settlement' && (
        <SettlementReport 
          onBack={() => changeView('main')} 
          onGoToSeat={() => changeView('seat')} 
          onGoToTeaser={() => changeView('teaser')} 
        />
      )}
      {viewMode === 'admin' && (
        <AdminDashboard 
          onBack={() => changeView('main')} 
          onGoToSeat={() => changeView('seat')} 
          onGoToSettlement={() => changeView('settlement')}
        />
      )}
    </div>
  );
};

export default App;
