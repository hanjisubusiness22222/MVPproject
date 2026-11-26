import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Scissors,
  Plus,
  Users,
  Sparkles
} from 'lucide-react';
import { fetchGoogleSheetRecords } from '../utils/googleSheetSync';
import { CroquisAvatar } from './CroquisAvatar';
import { CLASS_BADGE_OPTIONS, CLASS_BADGE_STYLES } from '../utils/croquisAvatar';
import planetLogo from '../assets/planet-logo.png';

interface PrintCardItem {
  id: string;
  studentNumber: string;
  name: string;
  session: string;
  bookTitle: string;
  motto: string;
  badge: string;
  avatarCode?: string;
  selectedIndices?: number[];
  isExtraBlank?: boolean;
}

const DEFAULT_PRINT_ROSTER: PrintCardItem[] = [
  { id: 'pr1', studentNumber: '2026-PLANET-1001', name: '김하늘', session: '1부 새학기 + 2부 수학여행', bookTitle: '어린 왕자', motto: '올해도 플래닛과 함께 완독!', badge: '🌸 스프링토', avatarCode: '11111111' },
  { id: 'pr2', studentNumber: '2026-PLANET-1002', name: '박서연', session: '1부 새학기 + 2부 수학여행', bookTitle: '모순 (양귀자)', motto: '꺾이지 않는 텐션으로!', badge: '☀️ 썸머데이', avatarCode: '24221232' },
  { id: 'pr3', studentNumber: '2026-PLANET-1003', name: '정민우', session: '1부 플래닛의 새학기 (낮)', bookTitle: '데미안', motto: '새학기 친구들 반가워요!', badge: '🍂 어텀', avatarCode: '32332413' },
  { id: 'pr4', studentNumber: '2026-PLANET-1004', name: '강현수', session: '1부 새학기 + 2부 수학여행', bookTitle: '우리가 빛의 속도로 갈 수 없다면', motto: '겨울밤 책수다 기대됩니다!', badge: '❄️ 윈터블', avatarCode: '46413124' },
  { id: 'pr5', studentNumber: '2026-PLANET-1005', name: '최지우', session: '2부 플래닛의 수학여행 (밤)', bookTitle: '달과 6펜스', motto: '밤새 책 이야기 나눠요!', badge: '🌸 스프링토', avatarCode: '53524341' },
  { id: 'pr6', studentNumber: '2026-PLANET-1006', name: '한서희', session: '1부 새학기 + 2부 수학여행', bookTitle: '불편한 편의점', motto: '따뜻한 연말 되세요!', badge: '☀️ 썸머데이', avatarCode: '65145265' },
  { id: 'pr7', studentNumber: '2026-PLANET-1007', name: '이준호', session: '1부 플래닛의 새학기 (낮)', bookTitle: '사피엔스', motto: '좋은 책 추천 기다려요', badge: '🍂 어텀', avatarCode: '71236452' },
  { id: 'pr8', studentNumber: '2026-PLANET-1008', name: '임태양', session: '1부 새학기 + 2부 수학여행', bookTitle: '작별하지 않는다', motto: '2026년 마무리 잘해요!', badge: '❄️ 윈터블', avatarCode: '87457676' }
];

interface StudentPrintStudioProps {
  onBack: () => void;
  onGoToSeat?: () => void;
}

export const StudentPrintStudio: React.FC<StudentPrintStudioProps> = ({ onBack, onGoToSeat }) => {
  const [cards, setCards] = useState<PrintCardItem[]>(DEFAULT_PRINT_ROSTER);
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'BOTH' | 'PART1' | 'PART2'>('ALL');
  const [columns, setColumns] = useState<2 | 3>(2);
  const [showCutLines, setShowCutLines] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCards = async () => {
    setIsSyncing(true);
    try {
      const { records } = await fetchGoogleSheetRecords();
      const syncedItems: PrintCardItem[] = records.map((r, idx) => ({
        id: r.studentNumber || `synced_${idx}`,
        studentNumber: r.studentNumber,
        name: r.rawName || r.name,
        session: r.session,
        bookTitle: r.bookTitle || '(선물 책 준비 중)',
        motto: r.motto || '새학기처럼 신선하게!',
        badge: r.badge || CLASS_BADGE_OPTIONS[idx % CLASS_BADGE_OPTIONS.length],
        avatarCode: r.avatarCode,
        selectedIndices: r.selectedIndices?.map((v) => v ?? 0)
      }));
      const seenKeys = new Set(syncedItems.map((i) => `${i.studentNumber}|${i.name}`));
      const extraDummies = DEFAULT_PRINT_ROSTER.filter(
        (d) => !seenKeys.has(`${d.studentNumber}|${d.name}`)
      );
      setCards([...syncedItems, ...extraDummies]);
    } catch (err) {
      console.error('인쇄 명단 동기화 오류:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncCards();
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (sessionFilter === 'ALL') return true;
      const isPart1 = c.session.includes('1부');
      const isPart2 = c.session.includes('2부');
      if (sessionFilter === 'BOTH') return isPart1 && isPart2;
      if (sessionFilter === 'PART1') return isPart1 && !isPart2;
      if (sessionFilter === 'PART2') return isPart2 && !isPart1;
      return true;
    });
  }, [cards, sessionFilter]);

  const handleAddExtraBlanks = () => {
    const baseNum = cards.length + 1;
    const extras: PrintCardItem[] = [0, 1].map((offset) => ({
      id: `blank_${Date.now()}_${offset}`,
      studentNumber: `2026-PLANET-현장${String(baseNum + offset).padStart(2, '0')}`,
      name: '(현장 기입)',
      session: '현장 등록 참석자',
      bookTitle: '(현장 확인)',
      motto: '플래닛 새학기 환영합니다!',
      badge: CLASS_BADGE_OPTIONS[(baseNum + offset) % CLASS_BADGE_OPTIONS.length],
      avatarCode: '11111111',
      isExtraBlank: true
    }));
    setCards((prev) => [...prev, ...extras]);
  };

  const handleAddSample = () => {
    const sampleIdx = cards.length + 1;
    const code = Array.from({ length: 8 }, () => Math.floor(Math.random() * 8) + 1).join('');
    setCards((prev) => [
      ...prev,
      {
        id: `sample_${Date.now()}`,
        studentNumber: `2026-PLANET-${9000 + sampleIdx}`,
        name: `박샘플${sampleIdx}`,
        session: '1부 새학기 + 2부 수학여행',
        bookTitle: '밤에 읽는 에세이',
        motto: '새학기 친구들 반가워요!',
        badge: CLASS_BADGE_OPTIONS[sampleIdx % CLASS_BADGE_OPTIONS.length],
        avatarCode: code
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f1b18] font-sans pb-24 print:bg-white print:pb-0">
      {/* 상단 네비게이션 (인쇄 시 숨김) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e5e0d4] px-3 sm:px-6 py-3 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1.5 rounded-lg border border-[#d8d3c7] bg-[#f8f6f0] hover:bg-[#ede8dc] text-xs font-serif flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>대시보드로</span>
            </button>
            <img src={planetLogo} alt="PLANET" className="w-7 h-7 object-contain rounded border border-[#e5e0d8] p-0.5 bg-white hidden sm:block" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-serif font-bold text-[#1f1b18]">
                  교무실 A4 학생증 일괄 인쇄 조판기
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#b82828] text-white">
                  인쇄실
                </span>
              </div>
              <p className="text-[11px] text-[#666] font-serif">
                신청자 전원의 색연필 크로키 아바타 명찰 A4 일괄 조판 및 인쇄
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onGoToSeat && (
              <button
                type="button"
                onClick={onGoToSeat}
                className="px-2.5 py-1.5 rounded-lg border border-[#d8d3c7] bg-white hover:bg-[#f8f6f0] text-xs font-serif flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-[#2e5238]" />
                <span>자리 배치</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSyncCards}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg border border-[#d8d3c7] bg-white hover:bg-[#f8f6f0] text-xs font-serif flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>명단 동기화</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-lg bg-[#1f1b18] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4 일괄 인쇄 (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 space-y-4 print:max-w-none print:p-0">
        {/* 인쇄 팁 배너 (인쇄 시 숨김) */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="space-y-0.5">
            <div className="font-bold text-amber-950">
              🖨️ 교무실 A4 학생증 인쇄 팁 (재단선 포함)
            </div>
            <p className="text-[11px] text-amber-900">
              인쇄 대화상자에서 <b>[배경 그래픽]</b>을 체크하고 여백을 <b>[최소]</b>로 설정하시면 <code>95mm × 70mm</code> 명찰 케이스 규격에 알맞게 출력됩니다.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-900 text-white font-bold text-[11px] shrink-0">
            인쇄 대상: 총 {filteredCards.length}매
          </span>
        </div>

        {/* 조판 필터 & 옵션 툴바 (인쇄 시 숨김) */}
        <div className="bg-white border border-[#e5e0d4] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-[#555] mr-1">세션 필터:</span>
            {[
              { id: 'ALL', label: `전체 (${cards.length})` },
              { id: 'BOTH', label: '1+2부 전체' },
              { id: 'PART1', label: '1부만' },
              { id: 'PART2', label: '2부만' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSessionFilter(f.id as typeof sessionFilter)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  sessionFilter === f.id
                    ? 'bg-[#2e5238] text-white'
                    : 'bg-[#f4f1ea] text-[#555] hover:bg-[#e8e3d8]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#f4f1ea] rounded-lg p-0.5 border border-[#e0dbd0]">
              <button
                type="button"
                onClick={() => setColumns(2)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  columns === 2 ? 'bg-white text-[#111] shadow-xs' : 'text-[#666]'
                }`}
              >
                2열 (권장·큼직함)
              </button>
              <button
                type="button"
                onClick={() => setColumns(3)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  columns === 3 ? 'bg-white text-[#111] shadow-xs' : 'text-[#666]'
                }`}
              >
                3열 (콤팩트)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCutLines((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                showCutLines
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-white border-stone-300 text-stone-500'
              }`}
            >
              <Scissors className="w-3 h-3" />
              <span>가위선 {showCutLines ? '켜짐' : '꺼짐'}</span>
            </button>

            <button
              type="button"
              onClick={handleAddExtraBlanks}
              className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-[11px] font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>현장 여분카드 +2</span>
            </button>

            <button
              type="button"
              onClick={handleAddSample}
              className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>+ 샘플</span>
            </button>
          </div>
        </div>

        {/* A4 학생증 조판 그리드 */}
        <div
          className={`grid gap-4 print:gap-3 ${
            columns === 2
              ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3'
          }`}
        >
          {filteredCards.map((card, idx) => {
            const badgeStyle = CLASS_BADGE_STYLES[card.badge] || CLASS_BADGE_STYLES['🌸 스프링토'];

            return (
              <article
                key={card.id}
                className={`bg-[#fffdf9] rounded-xl p-3.5 relative break-inside-avoid ${
                  showCutLines
                    ? 'border-2 border-dashed border-stone-400'
                    : 'border-2 border-stone-800 shadow-sm'
                }`}
              >
                {showCutLines && (
                  <span className="absolute -top-2.5 right-3 bg-[#f4f1ea] print:bg-white px-1.5 text-[9px] font-mono text-stone-500">
                    ✂ 재단선
                  </span>
                )}

                <div className="border-2 border-stone-900 rounded-lg p-3 bg-white space-y-2.5">
                  {/* 카드 상단 타이틀 */}
                  <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1.5">
                    <span className="font-serif font-black text-xs text-stone-900">
                      🪪 2026 플래닛 학생증 #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* 아바타 + 학적 정보 */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5 relative aspect-[4/5] rounded-lg border-2 border-stone-800 bg-[#fffdf9] overflow-hidden">
                      <CroquisAvatar
                        avatarCode={card.avatarCode}
                        selectedIndices={card.selectedIndices}
                        seed={card.studentNumber || card.name}
                        className="w-full h-full"
                      />
                      {/* 교무처인 직인 */}
                      <div className="absolute bottom-1 right-1 border border-[#b82828] text-[#b82828] bg-white/80 text-[8px] font-serif font-black px-1 py-0.5 rounded -rotate-6">
                        교무처인
                      </div>
                    </div>

                    <div className="col-span-7 text-[11px] font-serif space-y-1">
                      <div>
                        <span className="text-stone-500 font-bold">성명: </span>
                        <span className="font-black text-sm text-black">{card.name}</span>
                      </div>
                      <div className="font-mono text-[10px] text-[#872033] font-bold">
                        {card.studentNumber}
                      </div>
                      <div className="truncate text-[10px]">
                        <span className="text-stone-500 font-bold">세션: </span>
                        <span className="text-amber-900 font-bold">{card.session}</span>
                      </div>
                      <div className="truncate text-[10px]">
                        <span className="text-stone-500 font-bold">도서: </span>
                        <span>{card.bookTitle}</span>
                      </div>
                      <div className="mt-1 bg-[#f8f6f0] border border-[#e5e0d4] rounded px-2 py-1 text-[10px] italic text-stone-700 truncate">
                        "{card.motto}"
                      </div>
                    </div>
                  </div>

                  {/* 카드 하단 */}
                  <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between text-[9px] font-mono text-stone-500">
                    <span>PLANET READING SCHOOL GALA 2026</span>
                    <span className="text-stone-700 font-bold">확인: 플래닛 교무국 검인済</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
};
