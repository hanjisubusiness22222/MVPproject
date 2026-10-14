import React, { useState, useEffect } from 'react';
import { TeaserPage } from './components/TeaserPage';
import { OfficialInvitation } from './components/OfficialInvitation';
import { ClassroomSeatShuffle } from './components/ClassroomSeatShuffle';
import { AdminDashboard } from './components/AdminDashboard';
import { EVENT_CONFIG } from './constants/eventConfig';
import { Compass, Users, ShieldCheck, BookOpen } from 'lucide-react';

type ViewMode = 'teaser' | 'main' | 'seat' | 'admin';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#seat') return 'seat';
    if (hash === '#admin') return 'admin';
    return EVENT_CONFIG.isTeaserMode ? 'teaser' : 'main';
  });

  // URL Hash 감지
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#seat') setViewMode('seat');
      else if (hash === '#admin') setViewMode('admin');
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
      {/* 화면 빠른 전환 플로팅 스위처 (우측 하단) */}
      <aside 
        aria-label="화면 모드 전환"
        className="fixed bottom-3 right-3 z-50 bg-[#16231b]/95 border border-[#ffffff]/30 rounded-full p-1.5 text-xs text-[#f7f5ed] font-serif flex items-center space-x-1 shadow-2xl backdrop-blur-md"
      >
        <button
          onClick={() => changeView('teaser')}
          className={`px-2.5 py-1 rounded-full transition-all ${viewMode === 'teaser' ? 'bg-[#b82828] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="교실 칠판 티저"
        >
          칠판
        </button>
        <button
          onClick={() => changeView('main')}
          className={`px-2.5 py-1 rounded-full transition-all ${viewMode === 'main' ? 'bg-[#b82828] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="가정통신문 정식 안내"
        >
          가정통신문
        </button>
        <button
          onClick={() => changeView('seat')}
          className={`px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 ${viewMode === 'seat' ? 'bg-[#2e5238] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="추억의 교실 자리바꾸기"
        >
          <Users className="w-3 h-3" />
          <span>자리바꾸기</span>
        </button>
        <button
          onClick={() => changeView('admin')}
          className={`px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 ${viewMode === 'admin' ? 'bg-[#3b5998] text-white font-bold shadow-sm' : 'hover:bg-white/10 text-[#ccc]'}`}
          title="운영진 관리자 대시보드"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>관리자</span>
        </button>
      </aside>

      {/* 뷰 렌더링 */}
      {viewMode === 'teaser' && (
        <TeaserPage onExploreFullPage={() => changeView('main')} />
      )}
      {viewMode === 'main' && (
        <OfficialInvitation onBackToTeaser={() => changeView('teaser')} />
      )}
      {viewMode === 'seat' && (
        <ClassroomSeatShuffle onBack={() => changeView('main')} />
      )}
      {viewMode === 'admin' && (
        <AdminDashboard onBack={() => changeView('main')} onGoToSeat={() => changeView('seat')} />
      )}
    </div>
  );
};

export default App;
