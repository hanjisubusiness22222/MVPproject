import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Shuffle, Check, 
  Sparkles, BookOpen, User, Copy, CheckCircle2, QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import planetLogo from '../assets/planet-logo.png';

interface PartOption {
  name: string;
  path: string;
}

interface StepData {
  category: string;
  colorName: string;
  colorHex: string;
  options: PartOption[];
}

const PARTS_DATA: Record<string, StepData> = {
  // 1단계: 얼굴형 (파란 사인펜 #2563EB, Y: 30~155)
  face: {
    category: '얼굴형',
    colorName: '파란 사인펜',
    colorHex: '#2563EB',
    options: [
      { name: '동글 찐빵', path: 'M 100 35 C 145 35 168 65 168 105 C 168 145 145 155 100 155 C 55 155 32 145 32 105 C 32 65 55 35 100 35 Z' },
      { name: '각진 네모턱', path: 'M 50 42 L 150 42 C 160 42 165 55 162 90 L 158 140 C 158 152 148 155 135 155 L 65 155 C 52 155 42 152 42 140 L 38 90 C 35 55 40 42 50 42 Z' },
      { name: '뾰족 역삼각', path: 'M 40 45 C 80 40 120 40 160 45 C 165 75 145 120 100 158 C 55 120 35 75 40 45 Z' },
      { name: '볼록 땅콩', path: 'M 100 35 C 135 35 155 55 150 78 C 145 92 135 96 148 112 C 162 130 148 155 100 155 C 52 155 38 130 52 112 C 65 96 55 92 50 78 C 45 55 65 35 100 35 Z' },
      { name: '식빵 모양', path: 'M 60 40 C 80 32 100 42 100 42 C 100 42 120 32 140 40 C 160 48 165 75 158 95 C 165 115 162 150 145 155 L 55 155 C 38 150 35 115 42 95 C 35 75 40 48 60 40 Z' }
    ]
  },
  // 2단계: 눈 (초록 사인펜 #16A34A, Y: 70~85)
  eyes: {
    category: '눈',
    colorName: '초록 사인펜',
    colorHex: '#16A34A',
    options: [
      { name: '순정만화 눈', path: 'M 65 72 C 78 72 82 85 75 88 C 68 90 60 85 65 72 Z M 72 75 A 2 2 0 1 0 72 79 A 2 2 0 1 0 72 75 M 135 72 C 148 72 152 85 145 88 C 138 90 130 85 135 72 Z M 142 75 A 2 2 0 1 0 142 79 A 2 2 0 1 0 142 75' },
      { name: '맑눈광', path: 'M 70 78 A 8 8 0 1 1 70 77.9 M 70 78 A 2 2 0 1 1 70 77.9 M 130 78 A 8 8 0 1 1 130 77.9 M 130 78 A 2 2 0 1 1 130 77.9' },
      { name: '밤샘 팬더', path: 'M 60 82 C 70 75 80 82 82 84 M 58 87 C 68 95 82 92 84 86 M 140 82 C 130 75 120 82 118 84 M 142 87 C 132 95 118 92 116 86 M 68 80 A 2 2 0 1 1 68 79.9 M 132 80 A 2 2 0 1 1 132 79.9' },
      { name: '뱅글 뿔테', path: 'M 55 78 A 12 12 0 1 1 55 77.9 M 145 78 A 12 12 0 1 1 145 77.9 M 92 78 L 108 78 M 67 78 C 65 75 62 76 62 78 C 62 80 66 81 68 79 M 133 78 C 135 75 138 76 138 78 C 138 80 134 81 132 79' },
      { name: '새침 반달', path: 'M 60 76 C 70 68 82 76 82 82 M 140 76 C 130 68 118 76 118 82 M 85 70 L 90 68 M 115 70 L 110 68' }
    ]
  },
  // 3단계: 코 (주황 사인펜 #EA580C, Y: 100~115)
  nose: {
    category: '코',
    colorName: '주황 사인펜',
    colorHex: '#EA580C',
    options: [
      { name: '돼지코', path: 'M 90 106 C 90 101 110 101 110 106 C 110 114 90 114 90 106 Z M 95 106 A 2 2 0 1 1 95 105.9 M 105 106 A 2 2 0 1 1 105 105.9' },
      { name: '피노키오 코', path: 'M 98 98 L 122 108 L 98 110' },
      { name: '콧물 줄줄', path: 'M 96 102 C 104 100 106 108 96 109 M 104 108 C 104 116 107 118 105 120 C 103 121 101 118 101 114' },
      { name: '복 주먹코', path: 'M 93 103 C 90 109 97 114 100 114 C 103 114 110 109 107 103 M 92 108 C 96 109 104 109 108 108' },
      { name: 'L자 콧대', path: 'M 98 98 L 98 110 L 106 110' }
    ]
  },
  // 4단계: 입 (분홍/빨간 사인펜 #DB2777, Y: 128~145)
  mouth: {
    category: '입',
    colorName: '빨간 사인펜',
    colorHex: '#DB2777',
    options: [
      { name: '씨익 미소', path: 'M 80 132 C 90 144 110 144 122 130 M 78 130 L 82 134 M 124 128 L 120 132' },
      { name: '명란젓 입술', path: 'M 82 134 C 92 128 108 128 118 134 C 112 142 88 142 82 134 Z M 82 134 C 92 146 108 146 118 134' },
      { name: "'3' 모양 입", path: 'M 88 135 C 94 130 98 134 100 137 C 102 134 106 130 112 135' },
      { name: '장미 물기', path: 'M 86 135 C 95 140 105 140 114 135 M 110 136 L 135 132 M 135 132 C 142 126 142 138 135 136 Z M 125 134 L 127 138' },
      { name: '함박 건치', path: 'M 78 130 C 88 146 112 146 122 130 Z M 78 133 L 122 133 M 92 130 L 92 142 M 108 130 L 108 142' }
    ]
  },
  // 5단계: 몸통 & 소품 (보라 사인펜 #7C3AED, Y: 155~195)
  body: {
    category: '몸통 & 소품',
    colorName: '보라 사인펜',
    colorHex: '#7C3AED',
    options: [
      { name: '프레피 조끼', path: 'M 65 155 L 50 195 L 150 195 L 135 155 M 82 155 L 100 178 L 118 155 M 100 178 L 100 195' },
      { name: '헐크 어깨', path: 'M 68 155 C 40 152 20 165 15 195 M 132 155 C 160 152 180 165 185 195 M 78 175 C 100 185 122 175 122 175' },
      { name: '벽돌책 독서', path: 'M 65 155 L 50 195 L 150 195 L 135 155 M 75 165 L 125 165 L 125 195 L 75 195 Z M 100 165 L 100 195 M 70 178 C 76 172 82 178 78 186 M 130 178 C 124 172 118 178 122 186' },
      { name: '수학여행 파자마', path: 'M 65 155 L 45 195 L 155 195 L 135 155 M 58 168 L 142 168 M 52 182 L 148 182 M 90 155 L 100 162 L 110 155' },
      { name: '따아 커피잔', path: 'M 65 155 L 50 195 L 150 195 L 135 155 M 120 172 L 140 172 L 138 190 L 122 190 Z M 140 176 C 145 176 146 186 140 186 M 126 168 C 128 163 126 160 128 156 M 134 168 C 136 163 134 160 136 156' }
    ]
  }
};

const STEP_KEYS = ['face', 'eyes', 'nose', 'mouth', 'body'];

interface StudentCardStudioProps {
  onBack: () => void;
}

export const StudentCardStudio: React.FC<StudentCardStudioProps> = ({ onBack }) => {
  // 공책 게임 상태
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0..4
  const [activeSlot, setActiveSlot] = useState(0);             // 0..4
  const [selectedResults, setSelectedResults] = useState<(number | null)[]>([null, null, null, null, null]);
  const [isPlaying, setIsPlaying] = useState(true);

  // 카드 탭: 'student' (학생증) | 'library' (도서대출카드)
  const [cardMode, setCardMode] = useState<'student' | 'library'>('student');

  // 학생증 인적사항 3대 항목 + 세션
  const [name, setName] = useState('김플래닛');
  const [seasonGroup, setSeasonGroup] = useState<'스프링토' | '미들썸머' | '어텀' | '윈터블'>('윈터블');
  const [grade, setGrade] = useState<'1학년' | '2학년' | '3학년' | '4학년'>('2학년');
  const [sessionType, setSessionType] = useState('1부+2부 전체 참석');
  const [bookHint, setBookHint] = useState('삶의 쉼표가 되어준 소설 1권');

  // 이미지 다운로드
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // 기존 등록 명단에서 불러오기
  const [registeredList, setRegisteredList] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('planet_rsvps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredList(parsed);
        }
      }
    } catch {}
  }, []);

  // 볼펜 왕복 타이머 (85ms)
  useEffect(() => {
    if (!isPlaying || currentStepIndex >= STEP_KEYS.length) return;

    let direction = 1;
    const interval = setInterval(() => {
      setActiveSlot(prev => {
        let next = prev + direction;
        if (next >= 4) {
          next = 4;
          direction = -1;
        } else if (next <= 0) {
          next = 0;
          direction = 1;
        }
        return next;
      });
    }, 85);

    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex]);

  // 스페이스바 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          return;
        }
        e.preventDefault();
        handleStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // 멈춰! 핸들러
  const handleStop = () => {
    if (currentStepIndex >= STEP_KEYS.length) return;

    const chosen = activeSlot;
    const updated = [...selectedResults];
    updated[currentStepIndex] = chosen;
    setSelectedResults(updated);

    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.65 }
    });

    const nextStep = currentStepIndex + 1;
    setCurrentStepIndex(nextStep);

    if (nextStep >= STEP_KEYS.length) {
      setIsPlaying(false);
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // 선도부한테 빌어서 재촬영 (초기화)
  const handleReset = () => {
    setSelectedResults([null, null, null, null, null]);
    setCurrentStepIndex(0);
    setActiveSlot(0);
    setIsPlaying(true);
  };

  // 1초 올랜덤 뽑기
  const handleQuickRandom = () => {
    const randoms = [
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5)
    ];
    setSelectedResults(randoms);
    setCurrentStepIndex(5);
    setIsPlaying(false);
    confetti({ particleCount: 50, spread: 70 });
  };

  // 아바타 코드 생성: F{i}-E{i}-N{i}-M{i}-B{i}
  const prefix = ['F', 'E', 'N', 'M', 'B'];
  const avatarCode = selectedResults
    .map((r, i) => `${prefix[i]}${r !== null ? r + 1 : '?'}`)
    .join('-');

  // 학년 라벨 매칭
  const gradeLabelMap: Record<string, string> = {
    '1학년': '1학년 (신규 학우)',
    '2학년': '2학년 (기존 학우)',
    '3학년': '3학년 (진행팀)',
    '4학년': '4학년 (준비팀)'
  };

  // 이미지 다운로드
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `2026_플래닛_학생증_${name || '학우'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
      alert('학생증 저장 중 오류가 발생했습니다. 화면을 캡처해 주세요!');
    } finally {
      setIsDownloading(false);
    }
  };

  // 기존 명단 선택 시 자동 채우기
  const handleSelectRecord = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const found = registeredList.find(r => r.name === val || r.studentNumber === val);
    if (found) {
      setName(found.name || '');
      setBookHint(found.bookTitle || found.bookHint || '선물할 책 준비 중');
      setSessionType(found.session || '1부+2부 전체 참석');
    }
  };

  const currentStepData = currentStepIndex < STEP_KEYS.length 
    ? PARTS_DATA[STEP_KEYS[currentStepIndex]] 
    : null;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1f1b18] font-sans py-4 sm:py-8 px-2.5 sm:px-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">

        {/* 상단 관리자 네비게이션 헤더 */}
        <header className="bg-white/95 border-2 border-[#1f1b18] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#d8d3c7] bg-[#f8f6f0] hover:bg-[#ede8dc] text-xs font-serif text-[#1f1b18] transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#b82828]" />
              <span>관리자 대시보드로 돌아가기</span>
            </button>

            <div className="flex items-center space-x-2">
              <img src={planetLogo} alt="플래닛" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded bg-white border border-[#e5e0d8] p-0.5 shadow-sm" />
              <div>
                <h1 className="font-serif text-sm sm:text-base font-bold text-[#1f1b18] flex items-center space-x-1.5">
                  <span>추억의 공책 게임 아바타 학생증 공작소</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#b82828] text-white">현장 발급</span>
                </h1>
                <p className="text-[10px] text-[#666] font-serif">5단계 '볼펜 멈춰!' 손그림 아바타 생성 및 고화질 네임택 즉시 인쇄</p>
              </div>
            </div>
          </div>

          {/* 명단에서 원클릭 불러오기 (관리자 편의 기능) */}
          {registeredList.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs font-serif">
              <span className="text-[#666] whitespace-nowrap">📋 참가자 불러오기:</span>
              <select 
                onChange={handleSelectRecord}
                className="text-xs font-serif border border-[#ccc] rounded px-2 py-1 bg-white focus:outline-none focus:border-[#b82828]"
              >
                <option value="">명단에서 선택...</option>
                {registeredList.map((r, i) => (
                  <option key={i} value={r.name}>{r.name} ({r.session})</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* 메인 2단 작업 그리드: [좌: 공책 볼펜 멈춰 게임판] / [우: 실시간 발급 카드 & 편집] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">

          {/* ======================================================== */}
          {/* [좌측 7컬럼] 추억의 스프링 공책 "볼펜 멈춰!" 게임판           */}
          {/* ======================================================== */}
          <section className="lg:col-span-7 bg-[#FAF8F2] border-2 border-[#1f1b18] rounded-xl shadow-xl overflow-hidden relative">
            
            {/* 스프링 바인더 철 장식 */}
            <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-[#e8e4dc] border-r-2 border-[#1f1b18] flex flex-col justify-around py-4 items-center z-10 select-none">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-3 h-5 sm:w-4 sm:h-6 bg-[#222] rounded-full border border-gray-400"></div>
              ))}
            </div>

            <div className="pl-8 sm:pl-11 p-4 sm:p-6 min-h-[560px] flex flex-col justify-between"
                 style={{
                   backgroundColor: '#FAF8F2',
                   backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(37, 99, 235, 0.12) 28px)',
                   backgroundSize: '100% 28px'
                 }}>
              
              <div>
                {/* 과목 및 진행도 */}
                <div className="flex items-center justify-between border-b-2 border-[#b82828] pb-2 mb-3">
                  <div className="font-serif text-base sm:text-lg font-bold text-[#b82828] flex items-center space-x-2">
                    <span>과목: 독서학교 학생증 사진촬영</span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#b82828] text-white">제 1 교시</span>
                  </div>
                  <div className="font-serif text-xs sm:text-sm text-[#444]">
                    진행도: <strong className="text-[#2563EB] text-base">{Math.min(currentStepIndex + 1, 5)}/5단계</strong>
                  </div>
                </div>

                {/* 현재 카테고리 알림 */}
                <div className="bg-white/90 border border-[#1f1b18]/30 rounded-lg p-2.5 mb-3 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#777] font-sans">현재 뽑는 부위:</span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold" style={{ color: currentStepData?.colorHex || '#16A34A' }}>
                      {currentStepIndex < 5 
                        ? `${currentStepIndex + 1}단계 <${currentStepData?.category}> (${currentStepData?.colorName})`
                        : '🎉 5단계 완성! 아바타가 모두 조립되었습니다!'}
                    </h3>
                  </div>
                  {isPlaying && currentStepIndex < 5 && (
                    <div className="text-[11px] font-sans text-right text-[#555]">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping mr-1"></span>
                      <span>볼펜 질주 중 (85ms)</span>
                    </div>
                  )}
                </div>

                {/* 5개 파츠 카드 슬롯 그리드 */}
                {currentStepData && (
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3">
                    {currentStepData.options.map((opt, idx) => {
                      const isActive = activeSlot === idx && isPlaying;
                      return (
                        <div 
                          key={idx}
                          className={`bg-white/90 border-2 rounded-lg p-1.5 text-center transition-all duration-75 relative ${
                            isActive 
                              ? 'border-[#DC2626] bg-yellow-100/90 shadow-md scale-105' 
                              : 'border-dashed border-[#888]'
                          }`}
                        >
                          <div className="text-[10px] sm:text-[11px] font-serif font-bold text-[#555] mb-0.5">
                            {['①', '②', '③', '④', '⑤'][idx]}번
                          </div>
                          <div className="w-full aspect-square flex items-center justify-center">
                            <svg viewBox="0 0 200 200" className="w-full h-full fill-none stroke-[4] stroke-linecap-round stroke-linejoin-round" style={{ stroke: currentStepData.colorHex }}>
                              <path d={opt.path} />
                            </svg>
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-serif text-[#333] truncate mt-0.5">
                            {opt.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-center py-1">
                  <div className="inline-flex items-center space-x-1.5 bg-yellow-100/90 px-3 py-1 rounded-full border border-yellow-300 text-[11px] font-serif text-yellow-900">
                    <span>🖋️ 모나미 볼펜이 눈 깜짝할 새 왔다 갔다 하는 중! 타이밍을 맞춰보세요.</span>
                  </div>
                </div>
              </div>

              {/* 공책 하단 조작 버튼 */}
              <div className="pt-4 border-t-2 border-[#1f1b18]/20 space-y-2.5">
                <button
                  type="button"
                  onClick={handleStop}
                  disabled={currentStepIndex >= 5}
                  className={`w-full py-3.5 sm:py-4 rounded-xl text-white font-serif font-black text-lg sm:text-2xl shadow-lg border-2 active:scale-98 transition-all flex items-center justify-center space-x-2 ${
                    currentStepIndex < 5
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C] border-[#7F1D1D]'
                      : 'bg-[#16A34A] border-[#15803D]'
                  }`}
                >
                  {currentStepIndex < 5 ? (
                    <>
                      <span>✋ 멈춰! (클릭 또는 스페이스바)</span>
                    </>
                  ) : (
                    <span>✨ 아바타 완성 완료! (재촬영 가능)</span>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 text-xs font-serif">
                  <button 
                    type="button"
                    onClick={handleQuickRandom}
                    className="px-3 py-1.5 rounded-lg border border-[#888] bg-white hover:bg-[#ede8dc] text-[#333] flex items-center space-x-1 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#2e5238]" />
                    <span>🎲 운명에 맡기기 (1초 랜덤)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg border border-[#dc2626]/40 bg-red-50 hover:bg-red-100 text-[#b91c1c] font-bold flex items-center space-x-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>선도부한테 빌어서 재촬영하기 (초기화)</span>
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* ======================================================== */}
          {/* [우측 5컬럼] 실시간 발급 카드 (학생증/대출증) & 정보 편집 */}
          {/* ======================================================== */}
          <section className="lg:col-span-5 space-y-4">
            
            {/* 카드 탭 스위처: [학생증 모드] vs [도서대출카드 모드] */}
            <div className="flex items-center bg-[#e8e4dc] p-1 rounded-xl border border-[#1f1b18]/30 font-serif text-xs sm:text-sm font-bold">
              <button 
                type="button"
                onClick={() => setCardMode('student')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  cardMode === 'student' ? 'bg-white text-[#1f1b18] shadow-sm' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                🪪 학생증 모드
              </button>
              <button 
                type="button"
                onClick={() => setCardMode('library')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  cardMode === 'library' ? 'bg-white text-[#1f1b18] shadow-sm' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                📖 도서대출카드 모드
              </button>
            </div>

            {/* 캡처 대상: 실물 발급 카드 */}
            <div 
              ref={cardRef}
              className="bg-white border-2 border-[#1f1b18] rounded-xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden"
            >
              {/* 카드 상단 헤더 */}
              <div className="border-b-2 border-[#1f1b18] pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b82828]"></span>
                  <span className="font-mono text-[9px] tracking-widest text-[#777]">PLANET-2026</span>
                </div>
                <div className="font-serif text-[11px] sm:text-xs font-bold text-[#1f1b18]">
                  {cardMode === 'student' ? '2026 플래닛의 새학기 공식 학생증' : '플래닛 도서관 공식 도서대출증'}
                </div>
              </div>

              {/* 카드 본문: [5겹 합체 증명사진] + [인적사항 3대 항목] */}
              <div className="grid grid-cols-12 gap-3 items-center">
                
                {/* 증명사진 란 (5겹 SVG 레이어 스택) */}
                <div className="col-span-5">
                  <div 
                    className="aspect-[3/4] w-full border-2 border-[#1f1b18] rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner"
                    style={{
                      backgroundColor: '#FAF8F5',
                      backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {/* 레이어 0: 얼굴형 */}
                    {selectedResults[0] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full fill-none stroke-[4] stroke-[#2563EB] stroke-linecap-round stroke-linejoin-round">
                        <path d={PARTS_DATA.face.options[selectedResults[0]!].path} />
                      </svg>
                    )}
                    {/* 레이어 1: 눈 */}
                    {selectedResults[1] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full fill-none stroke-[4] stroke-[#16A34A] stroke-linecap-round stroke-linejoin-round">
                        <path d={PARTS_DATA.eyes.options[selectedResults[1]!].path} />
                      </svg>
                    )}
                    {/* 레이어 2: 코 */}
                    {selectedResults[2] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full fill-none stroke-[4] stroke-[#EA580C] stroke-linecap-round stroke-linejoin-round">
                        <path d={PARTS_DATA.nose.options[selectedResults[2]!].path} />
                      </svg>
                    )}
                    {/* 레이어 3: 입 */}
                    {selectedResults[3] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full fill-none stroke-[4] stroke-[#DB2777] stroke-linecap-round stroke-linejoin-round">
                        <path d={PARTS_DATA.mouth.options[selectedResults[3]!].path} />
                      </svg>
                    )}
                    {/* 레이어 4: 몸통 & 소품 */}
                    {selectedResults[4] !== null && (
                      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full fill-none stroke-[4] stroke-[#7C3AED] stroke-linecap-round stroke-linejoin-round">
                        <path d={PARTS_DATA.body.options[selectedResults[4]!].path} />
                      </svg>
                    )}

                    {selectedResults.every(r => r === null) && (
                      <div className="text-center p-2 font-serif text-[11px] text-[#888] select-none leading-tight">
                        왼쪽 공책에서<br/>볼펜 멈춰로<br/>얼굴을 뽑아줘!
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-1 font-serif text-[10px] text-[#777]">증명사진 (5겹 사인펜)</div>
                </div>

                {/* 우측 인적사항 란 */}
                <div className="col-span-7 space-y-1.5 font-serif text-xs text-[#2c2621]">
                  
                  {cardMode === 'student' ? (
                    <div className="space-y-1">
                      <div>
                        <span className="text-[10px] text-[#777]">성명:</span>
                        <div className="font-bold text-sm sm:text-base text-[#111]">{name || '김플래닛'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-[10px] text-[#777]">소속반:</span>
                          <div className="font-bold text-[#2e5238]">{seasonGroup}반</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#777]">학년:</span>
                          <div className="font-bold text-[#b82828]">{grade}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777]">기증 도서 힌트:</span>
                        <div className="text-[10px] text-[#444] line-clamp-1 italic">{bookHint || '선물할 책 준비 중'}</div>
                      </div>
                      <div className="pt-0.5">
                        <span className="text-[10px] text-[#777]">등교 일자:</span>
                        <div className="font-mono text-[10px] text-[#333]">2026. 12. 19. (토) 10:00</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="border border-[#1f1b18] text-center p-1 bg-[#fdfbf7] rounded">
                        <div className="font-bold text-[11px] font-serif text-[#1f1b18]">플래닛 도서대출증</div>
                        <div className="text-[9px] text-[#888]">NO. 2026-PLANET-BOOK</div>
                      </div>
                      <div className="border border-[#1f1b18] text-[9px] text-center">
                        <div className="grid grid-cols-2 bg-[#eae5d8] font-bold border-b border-[#1f1b18] p-0.5">
                          <span>대출일자</span>
                          <span>반납예정</span>
                        </div>
                        <div className="grid grid-cols-2 p-0.5 text-red-600 font-bold">
                          <span>2026.12.19</span>
                          <span>평생 반납금지</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-[#666] pt-0.5">
                        대출자: <strong className="text-[#111]">{name}</strong> ({seasonGroup}반 {grade})
                      </div>
                    </div>
                  )}

                  {/* 아바타 조합 코드 */}
                  <div className="pt-1 border-t border-dashed border-[#ddd]">
                    <span className="text-[9px] text-[#888] font-mono">AVATAR_CODE:</span>
                    <div className="font-mono font-bold text-[10px] text-[#2563EB]">{avatarCode}</div>
                  </div>

                </div>

              </div>

              {/* 카드 하단 결재 직인 날인 */}
              <div className="pt-2 border-t border-[#1f1b18]/20 flex items-center justify-between">
                <div className="font-mono text-[9px] text-[#888]">PLANET READING SCHOOL ★</div>
                <div className="border-2 border-[#b82828] text-[#b82828] text-[10px] px-2 py-0.5 rounded font-bold rotate-[-8deg] shadow-xs">
                  플래닛독서학교장
                </div>
              </div>

            </div>

            {/* 다운로드 버튼 */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-2.5 rounded-lg bg-[#2e5238] hover:bg-[#23402c] text-white font-serif font-bold text-xs sm:text-sm shadow flex items-center justify-center space-x-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? '이미지 저장 중...' : '📸 내 학생증 이미지 저장하기 (PNG)'}</span>
            </button>

            {/* 인적사항 실시간 편집 폼 (관리자 수정용) */}
            <div className="bg-white border-2 border-[#1f1b18] rounded-xl p-4 shadow-sm space-y-3 font-serif">
              <div className="border-b border-[#1f1b18]/20 pb-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-[#1f1b18]">
                  ✍️ 학생증 인적사항 3대 항목 실시간 편집
                </h4>
                <p className="text-[10px] text-[#777]">수정 시 위의 학생증 카드에 즉시 반영됩니다.</p>
              </div>

              {/* 1. 성명 */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-0.5">1. 성명 (이름)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="실명 또는 닉네임"
                  className="w-full text-xs p-2 border border-[#ccc] rounded focus:border-[#b82828] focus:outline-none"
                />
              </div>

              {/* 2. 소속반 (스프링토/미들썸머/어텀/윈터블) */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-1">2. 소속반 (계절 모임반)</label>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-serif">
                  {(['스프링토', '미들썸머', '어텀', '윈터블'] as const).map(grp => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSeasonGroup(grp)}
                      className={`p-1.5 rounded border transition-all ${
                        seasonGroup === grp 
                          ? 'border-[#2e5238] bg-[#2e5238] text-white font-bold shadow-xs' 
                          : 'border-[#ccc] bg-white text-[#555] hover:bg-gray-50'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 학년 (1학년:신규 / 2학년:기존 / 3학년:진행 / 4학년:준비) */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-1">3. 학년 (플래닛 롤)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[11px] font-serif">
                  {(['1학년', '2학년', '3학년', '4학년'] as const).map(grd => (
                    <button
                      key={grd}
                      type="button"
                      onClick={() => setGrade(grd)}
                      className={`p-1.5 rounded border transition-all ${
                        grade === grd 
                          ? 'border-[#b82828] bg-[#b82828] text-white font-bold shadow-xs' 
                          : 'border-[#ccc] bg-white text-[#555] hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold">{grd}</div>
                      <div className="text-[9px] opacity-80">
                        {grd === '1학년' ? '신규' : grd === '2학년' ? '기존' : grd === '3학년' ? '진행' : '준비'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 도서 힌트 */}
              <div>
                <label className="block text-[11px] font-bold text-[#1f1b18] mb-0.5">선물할 도서 제목 / 힌트</label>
                <input 
                  type="text" 
                  value={bookHint} 
                  onChange={e => setBookHint(e.target.value)}
                  placeholder="예: 삶의 쉼표가 되어준 소설 1권"
                  className="w-full text-xs p-2 border border-[#ccc] rounded focus:border-[#b82828] focus:outline-none"
                />
              </div>

            </div>

          </section>

        </div>

      </div>
    </div>
  );
};
