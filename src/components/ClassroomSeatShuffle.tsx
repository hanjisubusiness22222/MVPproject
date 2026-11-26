import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Shuffle,
  Users,
  Maximize2,
  Minimize2,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { fetchGoogleSheetRecords } from '../utils/googleSheetSync';
import { CroquisAvatar } from './CroquisAvatar';
import { CLASS_BADGE_OPTIONS, CLASS_BADGE_STYLES } from '../utils/croquisAvatar';
import planetLogo from '../assets/planet-logo.png';

interface Participant {
  id: string;
  name: string;
  session: string;
  bookTitle: string;
  badge: string;
  avatarCode?: string;
  selectedIndices?: number[];
  studentNumber?: string;
}

const DIVISION_NAMES = [
  '1 분단 창가 라인',
  '2 분단 중앙 집중 라인',
  '3 분단 복도 라인',
  '4 분단 앞자리 열정 라인',
  '5 분단 도서관 라인',
  '6 분단 창밖 사색 라인',
  '7 분단 다독왕 라인',
  '8 분단 뒷자리 자유 라인'
];

// 기본 더미 참가자 명단 (20명, 테스트용 가상 성명)
const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: '김하늘', session: '1부 새학기 + 2부 수학여행', bookTitle: '어린 왕자', badge: '🌸 스프링토', avatarCode: '11111111' },
  { id: 'p2', name: '박서연', session: '1부 새학기 + 2부 수학여행', bookTitle: '모순 (양귀자)', badge: '☀️ 썸머데이', avatarCode: '24221232' },
  { id: 'p3', name: '정민우', session: '1부 플래닛의 새학기 (낮)', bookTitle: '데미안', badge: '🍂 어텀', avatarCode: '32332413' },
  { id: 'p4', name: '강현수', session: '1부 새학기 + 2부 수학여행', bookTitle: '우리가 빛의 속도로 갈 수 없다면', badge: '❄️ 윈터블', avatarCode: '46413124' },
  { id: 'p5', name: '최지우', session: '2부 플래닛의 수학여행 (밤)', bookTitle: '달과 6펜스', badge: '🌸 스프링토', avatarCode: '53524341' },
  { id: 'p6', name: '한서희', session: '1부 새학기 + 2부 수학여행', bookTitle: '불편한 편의점', badge: '☀️ 썸머데이', avatarCode: '65145265' },
  { id: 'p7', name: '이준호', session: '1부 플래닛의 새학기 (낮)', bookTitle: '사피엔스', badge: '🍂 어텀', avatarCode: '71236452' },
  { id: 'p8', name: '임태양', session: '1부 새학기 + 2부 수학여행', bookTitle: '작별하지 않는다', badge: '❄️ 윈터블', avatarCode: '87457676' },
  { id: 'p9', name: '윤도원', session: '1부 새학기 + 2부 수학여행', bookTitle: '물고기는 존재하지 않는다', badge: '🌸 스프링토', avatarCode: '14628134' },
  { id: 'p10', name: '송유진', session: '1부 새학기 + 2부 수학여행', bookTitle: '아몬드', badge: '☀️ 썸머데이', avatarCode: '28361527' },
  { id: 'p11', name: '오민재', session: '1부 플래닛의 새학기 (낮)', bookTitle: '코스모스', badge: '🍂 어텀', avatarCode: '31572348' },
  { id: 'p12', name: '배진우', session: '1부 새학기 + 2부 수학여행', bookTitle: '파친코', badge: '❄️ 윈터블', avatarCode: '42783461' },
  { id: 'p13', name: '신하나', session: '1부 새학기 + 2부 수학여행', bookTitle: '구의 증명', badge: '🌸 스프링토', avatarCode: '56814572' },
  { id: 'p14', name: '노은혜', session: '2부 플래닛의 수학여행 (밤)', bookTitle: '밤의 여행자들', badge: '☀️ 썸머데이', avatarCode: '63245683' },
  { id: 'p15', name: '권석주', session: '1부 새학기 + 2부 수학여행', bookTitle: '나는 메트로폴리탄 미술관의 경비원입니다', badge: '🍂 어텀', avatarCode: '74156714' },
  { id: 'p16', name: '유시온', session: '1부 플래닛의 새학기 (낮)', bookTitle: '이방인', badge: '❄️ 윈터블', avatarCode: '85367825' },
  { id: 'p17', name: '백예린', session: '1부 새학기 + 2부 수학여행', bookTitle: '채식주의자', badge: '🌸 스프링토', avatarCode: '16478136' },
  { id: 'p18', name: '황보람', session: '1부 새학기 + 2부 수학여행', bookTitle: '참을 수 없는 존재의 가벼움', badge: '☀️ 썸머데이', avatarCode: '27581247' },
  { id: 'p19', name: '문지원', session: '1부 플래닛의 새학기 (낮)', bookTitle: '호밀밭의 파수꾼', badge: '🍂 어텀', avatarCode: '38612358' },
  { id: 'p20', name: '조현우', session: '1부 새학기 + 2부 수학여행', bookTitle: '1984 (조지 오웰)', badge: '❄️ 윈터블', avatarCode: '41723461' }
];

function getShortSessionLabel(session: string): string {
  if (session.includes('1부') && session.includes('2부')) return '1차+2차';
  if (session.includes('2부')) return '2차 수학여행';
  return '1차 새학기';
}

interface ClassroomSeatShuffleProps {
  onBack: () => void;
}

export const ClassroomSeatShuffle: React.FC<ClassroomSeatShuffleProps> = ({ onBack }) => {
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
  const [divisionSetting, setDivisionSetting] = useState<'auto' | number>('auto');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  const [seats, setSeats] = useState<(Participant | null)[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // 명단 추가 입력 상태
  const [newName, setNewName] = useState('');
  const [newSession, setNewSession] = useState('1부 새학기 + 2부 수학여행');

  const classroomRef = useRef<HTMLDivElement>(null);

  const recommendedDivisions = useMemo(() => {
    const needed = Math.ceil(Math.max(participants.length, 18) / 6);
    return Math.max(3, Math.min(8, needed));
  }, [participants.length]);

  const activeDivisions = divisionSetting === 'auto' ? recommendedDivisions : divisionSetting;
  const totalSeatCount = activeDivisions * 6;

  // 신청자 명단 동기화 (마스킹된 더미 + localStorage 신청 데이터)
  const handleSyncApplicants = async () => {
    setIsSyncing(true);
    try {
      const { records, syncedAt } = await fetchGoogleSheetRecords();
      if (records.length > 0) {
        const syncedEntries: Participant[] = records.map((rec, idx) => ({
          id: rec.studentNumber || `synced_${idx}`,
          studentNumber: rec.studentNumber,
          name: rec.rawName || rec.name,
          session: rec.session,
          bookTitle: rec.bookTitle || '(선물 책 준비 중)',
          badge: rec.badge || CLASS_BADGE_OPTIONS[idx % CLASS_BADGE_OPTIONS.length],
          avatarCode: rec.avatarCode,
          selectedIndices: rec.selectedIndices?.map((v) => (v ?? 0))
        }));

        // 구글 시트 + 로컬 신청 명단 그대로 사용 (중복 더미 혼합 방지)
        setParticipants(syncedEntries);
        setLastSyncedAt(syncedAt);
      } else {
        setParticipants(DEFAULT_PARTICIPANTS);
      }
    } catch (err) {
      console.error('자리배치 명단 동기화 오류:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncApplicants();
  }, []);

  // 인원 또는 분단 수 변경 시 좌석 배열 동기화
  useEffect(() => {
    const nextSeats: (Participant | null)[] = new Array(totalSeatCount).fill(null);
    participants.slice(0, totalSeatCount).forEach((p, idx) => {
      nextSeats[idx] = p;
    });
    setSeats(nextSeats);
  }, [participants, totalSeatCount]);

  // 자리 배치 셔플 (Fisher-Yates + 애니메이션)
  const handleShuffle = () => {
    if (isShuffling) return;
    setIsShuffling(true);

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const tempPool = [...participants];
      for (let i = tempPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempPool[i], tempPool[j]] = [tempPool[j], tempPool[i]];
      }
      const previewSeats: (Participant | null)[] = new Array(totalSeatCount).fill(null);
      tempPool.slice(0, totalSeatCount).forEach((p, idx) => {
        previewSeats[idx] = p;
      });
      setSeats(previewSeats);

      if (tick >= 12) {
        clearInterval(interval);
        setIsShuffling(false);
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#b82828', '#2e5238', '#dfc27d', '#ffffff']
        });
      }
    }, 85);
  };

  // 배치표 PNG 저장
  const handleDownloadImage = async () => {
    if (!classroomRef.current) return;
    try {
      setIsCapturing(true);
      const dataUrl = await toPng(classroomRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#16231b'
      });
      const link = document.createElement('a');
      link.download = `플래닛_새학기_교실자리배치도_${activeDivisions}분단.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('이미지 저장 실패:', err);
      alert('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  // 수동 참가자 추가
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const newEntry: Participant = {
      id: `manual_${Date.now()}`,
      name: trimmed,
      session: newSession,
      bookTitle: '(현장 추가)',
      badge: CLASS_BADGE_OPTIONS[participants.length % CLASS_BADGE_OPTIONS.length]
    };
    setParticipants((prev) => [newEntry, ...prev]);
    setNewName('');
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div
      className={`min-h-screen bg-[#16231b] text-[#f7f5ed] font-sans transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6' : 'pb-20'
      }`}
    >
      {/* 상단 툴바 */}
      <header className="sticky top-0 z-30 bg-[#111b15]/95 backdrop-blur-md border-b border-white/15 px-3 sm:px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-serif flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>돌아가기</span>
            </button>
            <img src={planetLogo} alt="PLANET" className="w-8 h-8 rounded bg-white p-0.5 object-contain hidden sm:block" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-serif font-bold text-[#f7f5ed]">
                  교실 자리 배치 (1~{activeDivisions}분단)
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2e5238] border border-emerald-400/40 text-emerald-200">
                  신청 {participants.length}명 • 최대 50인+
                </span>
              </div>
              <p className="text-[11px] text-[#a8b8ae] font-serif">
                2026 플래닛 독서학교 1~{activeDivisions}분단 통합 테이블 배치도 (분단당 6석)
                {lastSyncedAt && <span className="ml-2 text-emerald-300/80">• 동기화: {lastSyncedAt}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 분단 수 선택기 */}
            <div className="flex items-center space-x-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-[#dfc27d] font-bold">분단:</span>
              <select
                value={divisionSetting}
                onChange={(e) =>
                  setDivisionSetting(e.target.value === 'auto' ? 'auto' : Number(e.target.value))
                }
                aria-label="분단 수 선택"
                className="bg-transparent text-[#f7f5ed] font-bold focus:outline-none cursor-pointer [&>option]:text-stone-900"
              >
                <option value="auto">자동 추천 ({recommendedDivisions}분단)</option>
                <option value={3}>3 분단 (기본)</option>
                <option value={4}>4 분단</option>
                <option value={5}>5 분단</option>
                <option value={6}>6 분단 (30~45인)</option>
                <option value={7}>7 분단</option>
                <option value={8}>8 분단 (50인 안팎)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSyncApplicants}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs flex items-center space-x-1 transition-colors"
              title="최신 신청자 불러오기"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">명단 새로고침</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManageModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs flex items-center space-x-1 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#dfc27d]" />
              <span>신청자 ({participants.length}명)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isCapturing}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs flex items-center space-x-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span className="hidden sm:inline">{isCapturing ? '저장 중...' : '배치표 이미지 저장'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs flex items-center space-x-1 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? '창 닫기' : '빔프로젝터 전체화면'}</span>
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              disabled={isShuffling}
              className="px-4 py-1.5 rounded-lg bg-[#b82828] hover:bg-[#961f1f] text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg transition-all active:scale-95"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{isShuffling ? '자리 섞는 중...' : '자리 배치 시작!'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 교실 칠판 및 분단별 자리배치도 본문 */}
      <main ref={classroomRef} className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
        {/* 교실 칠판 배너 */}
        <div className="bg-[#1b3324] border-4 border-[#6c4829] rounded-2xl p-4 sm:p-5 text-center shadow-2xl space-y-1.5">
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#dfc27d] uppercase">
            CLASSROOM SIGNBOARD • 1 ~ {activeDivisions} DIVISION
          </div>
          <h2 className="text-lg sm:text-2xl font-serif font-extrabold text-[#f7f5ed]">
            2026 플래닛 독서학교 「새학기 교실 자리배치도」
          </h2>
          <div className="inline-block mt-1 px-4 py-1 rounded bg-[#112218] border border-white/15 text-xs font-serif text-[#cfe0d5]">
            [ 칠 판 &amp; 교 탁 (선생님 / 운영진 교무석) ]
          </div>
        </div>

        {/* 분단별 6석 통합 테이블 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {Array.from({ length: activeDivisions }).map((_, divIdx) => {
            const startIdx = divIdx * 6;
            const divSeats = seats.slice(startIdx, startIdx + 6);
            const occupiedCount = divSeats.filter(Boolean).length;

            return (
              <section
                key={divIdx}
                className="bg-[#fcfbf9] text-[#1f1b18] rounded-2xl border-2 border-[#dfc27d]/60 shadow-xl overflow-hidden"
              >
                {/* 분단 헤더 */}
                <div className="bg-[#233b2d] text-[#f7f5ed] px-4 py-2.5 flex items-center justify-between border-b border-[#dfc27d]/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-[#dfc27d] text-[#1f1b18] font-mono font-black text-xs flex items-center justify-center">
                      {divIdx + 1}
                    </span>
                    <h3 className="font-serif font-bold text-sm">
                      {DIVISION_NAMES[divIdx] || `${divIdx + 1} 분단`}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#dfc27d] font-bold">
                    {occupiedCount} / 6명
                  </span>
                </div>

                {/* 2x3 좌석 카드 */}
                <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#f7f4ec]">
                  {divSeats.map((person, localIdx) => {
                    const seatNumber = startIdx + localIdx + 1;
                    const badgeStyle = person
                      ? CLASS_BADGE_STYLES[person.badge] || CLASS_BADGE_STYLES['🌸 스프링토']
                      : null;

                    return (
                      <div
                        key={seatNumber}
                        className={`rounded-xl border p-2.5 transition-all flex flex-col justify-between min-h-[138px] ${
                          person
                            ? 'bg-white border-[#d6cfc2] shadow-xs hover:border-[#b82828]/60'
                            : 'bg-[#efebe2]/60 border-dashed border-[#ccc3b4] opacity-70'
                        } ${isShuffling ? 'scale-[0.98] opacity-80' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-[#666]">
                            #{String(seatNumber).padStart(2, '0')}
                          </span>
                          {person && badgeStyle && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold truncate ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
                            >
                              {person.badge}
                            </span>
                          )}
                        </div>

                        {person ? (
                          <div className="flex items-center gap-2 my-auto">
                            <div className="w-12 h-14 shrink-0 rounded-lg border border-stone-300 bg-[#fffdf9] overflow-hidden">
                              <CroquisAvatar
                                avatarCode={person.avatarCode}
                                selectedIndices={person.selectedIndices}
                                seed={person.studentNumber || person.name}
                                className="w-full h-full"
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="font-serif font-extrabold text-sm text-[#111] truncate">
                                {person.name}
                              </div>
                              <div className="text-[10px] font-bold text-[#872033]">
                                {getShortSessionLabel(person.session)}
                              </div>
                              <div className="text-[9px] text-[#666] flex items-center gap-0.5 truncate">
                                <BookOpen className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{person.bookTitle}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="my-auto text-center text-[11px] font-serif text-[#999]">
                            빈 자리
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* 참가자 명단 관리 모달 */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] text-[#1f1b18] rounded-2xl max-w-lg w-full border-2 border-[#1f1b18] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-[#233b2d] text-[#f7f5ed] flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm">참가자 명단 관리 ({participants.length}명)</h3>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-xs px-2.5 py-1 rounded bg-white/15 hover:bg-white/25"
              >
                완료
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="p-4 border-b border-[#e5e0d4] bg-[#f7f4ec] flex flex-wrap gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="참가자 성함"
                className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-[#ccc] bg-white text-xs focus:outline-none focus:border-[#2e5238]"
              />
              <select
                value={newSession}
                onChange={(e) => setNewSession(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#ccc] bg-white text-xs focus:outline-none"
              >
                <option value="1부 새학기 + 2부 수학여행">1차+2차</option>
                <option value="1부 플래닛의 새학기 (낮)">1차만</option>
                <option value="2부 플래닛의 수학여행 (밤)">2차만</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#2e5238] hover:bg-[#1f3d27] text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto divide-y divide-[#eee9df] px-4 py-2">
              {participants.map((p, idx) => (
                <div key={p.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] text-[#888] w-5">{idx + 1}</span>
                    <div className="w-8 h-9 rounded border border-stone-300 bg-[#fffdf9] overflow-hidden shrink-0">
                      <CroquisAvatar
                        avatarCode={p.avatarCode}
                        selectedIndices={p.selectedIndices}
                        seed={p.studentNumber || p.name}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#111] truncate">{p.name}</div>
                      <div className="text-[10px] text-[#666] truncate">
                        {p.badge} · {getShortSessionLabel(p.session)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#f7f4ec] border-t border-[#e5e0d4] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleSyncApplicants}
                className="text-[#2e5238] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>신청서/명단 다시 불러오기</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1f1b18] text-white font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
