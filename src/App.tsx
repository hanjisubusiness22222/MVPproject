import React, { useState } from 'react';
import { TeaserPage } from './components/TeaserPage';
import { EVENT_CONFIG } from './constants/eventConfig';
import { Sparkles, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'teaser' | 'main'>(
    EVENT_CONFIG.isTeaserMode ? 'teaser' : 'main'
  );

  return (
    <div className="relative min-h-screen">
      {/* 개발자 및 시연용 모드 스위처 배너 */}
      <aside 
        aria-label="개발자 뷰 모드 전환"
        className="fixed bottom-3 right-3 z-50 bg-ivy-950/90 border border-gold-500/40 rounded-full py-1.5 px-3 text-[11px] text-gold-300 font-typewriter flex items-center space-x-2 shadow-2xl backdrop-blur-md"
      >
        <Compass className="w-3.5 h-3.5 text-gold-400" />
        <span>MODE:</span>
        <button
          onClick={() => setViewMode(viewMode === 'teaser' ? 'main' : 'teaser')}
          className="px-2 py-0.5 rounded bg-gold-600/20 hover:bg-gold-600/40 text-gold-200 font-bold underline transition-colors"
        >
          {viewMode === 'teaser' ? '티저 모드 (Teaser)' : '본 안내장 (Main)'}
        </button>
      </aside>

      {/* 뷰 렌더링 */}
      {viewMode === 'teaser' ? (
        <TeaserPage onExploreFullPage={() => setViewMode('main')} />
      ) : (
        /* Day 2에서 본격 구현될 공식 안내장 프리뷰 스켈레톤 */
        <div className="min-h-screen bg-ivy-pattern bg-tartan-overlay text-cream-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-gold-500/60 bg-ivy-900 flex items-center justify-center text-gold-400 font-crest text-xl shadow-crest">
            PA
          </div>
          <h2 className="font-crest text-2xl sm:text-3xl font-bold text-gold-300">
            THE OFFICIAL INVITATION GAZETTE
          </h2>
          <p className="font-display italic text-cream-300 max-w-md">
            "2026 플래닛 연말 갈라 정식 안내장 및 신청 폼은 Day 2 스프린트에서 본격적으로 완성됩니다."
          </p>
          <button
            onClick={() => setViewMode('teaser')}
            className="py-2 px-5 rounded-lg border border-gold-500/50 bg-bordeaux-800 text-gold-200 text-xs font-bold hover:bg-bordeaux-700 transition-all shadow-md flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>티저(Teaser) 페이지로 돌아가기</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
