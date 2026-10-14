import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Shuffle, Users, Sparkles, Maximize2, Minimize2, 
  Download, RotateCcw, Award, CheckCircle2, SlidersHorizontal, 
  Plus, Trash2, Edit3, Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import planetLogo from '../assets/planet-logo.png';

interface Participant {
  id: string;
  name: string;
  gender: 'M' | 'F';
  type: 'new' | 'senior'; // 신규 어른이 vs 기존 어른이
  seatIndex?: number;
}

// 기본 샘플 어른이 명단 (초기 데이터)
const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: '김하늘', gender: 'F', type: 'senior' },
  { id: 'p2', name: '이준호', gender: 'M', type: 'new' },
  { id: 'p3', name: '박서연', gender: 'F', type: 'senior' },
  { id: 'p4', name: '정민우', gender: 'M', type: 'senior' },
  { id: 'p5', name: '최지우', gender: 'F', type: 'new' },
  { id: 'p6', name: '강도현', gender: 'M', type: 'senior' },
  { id: 'p7', name: '윤채원', gender: 'F', type: 'senior' },
  { id: 'p8', name: '임태양', gender: 'M', type: 'new' },
  { id: 'p9', name: '한소희', gender: 'F', type: 'new' },
  { id: 'p10', name: '오승재', gender: 'M', type: 'senior' },
  { id: 'p11', name: '송예진', gender: 'F', type: 'senior' },
  { id: 'p12', name: '배진우', gender: 'M', type: 'senior' },
  { id: 'p13', name: '신유나', gender: 'F', type: 'new' },
  { id: 'p14', name: '권혁주', gender: 'M', type: 'new' },
  { id: 'p15', name: '백서린', gender: 'F', type: 'senior' },
  { id: 'p16', name: '문재원', gender: 'M', type: 'senior' },
  { id: 'p17', name: '노다혜', gender: 'F', type: 'new' },
  { id: 'p18', name: '유시온', gender: 'M', type: 'new' },
  { id: 'p19', name: '황가람', gender: 'F', type: 'senior' },
  { id: 'p20', name: '조현우', gender: 'M', type: 'senior' },
  { id: 'p21', name: '전민서', gender: 'F', type: 'new' },
  { id: 'p22', name: '서강진', gender: 'M', type: 'senior' },
  { id: 'p23', name: '양다은', gender: 'F', type: 'senior' },
  { id: 'p24', name: '구동혁', gender: 'M', type: 'new' }
];

interface ClassroomSeatShuffleProps {
  onBack: () => void;
}

export const ClassroomSeatShuffle: React.FC<ClassroomSeatShuffleProps> = ({ onBack }) => {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    // 1. 로컬스토리지에 저장된 실제 RSVP 신청자 확인
    const savedRsvps = localStorage.getItem('planet_rsvps');
    if (savedRsvps) {
      try {
        const parsed = JSON.parse(savedRsvps);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: { name: string }, idx: number) => ({
            id: `rsvp_${idx}`,
            name: item.name,
            gender: (idx % 2 === 0 ? 'F' : 'M') as 'M' | 'F',
            type: (idx % 3 === 0 ? 'new' : 'senior') as 'new' | 'senior'
          }));
        }
      } catch {
        // Fallback to defaults
      }
    }
    return DEFAULT_PARTICIPANTS;
  });

  const [seats, setSeats] = useState<(Participant | null)[]>(new Array(24).fill(null));
  const [isShuffling, setIsShuffling] = useState(false);
  const [balanceGender, setBalanceGender] = useState(true);
  const [balanceSeniority, setBalanceSeniority] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('F');
  const [newType, setNewType] = useState<'new' | 'senior'>('new');
  const [isCapturing, setIsCapturing] = useState(false);

  const classroomRef = useRef<HTMLDivElement>(null);

  // 드럼롤 사운드 (Web Audio API 가속 비트)
  const playDrumrollSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const count = 28;
      
      for (let i = 0; i < count; i++) {
        const time = ctx.currentTime + (i * 0.1) * (1 - i / (count * 1.5));
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + (i * 4), time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
      }

      // 최종 팡파레 심벌즈 효과
      setTimeout(() => {
        const chimeNotes = [523.25, 659.25, 783.99, 1046.50]; // 도-미-솔-도
        chimeNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 1.2);
        });
      }, 2500);

    } catch {
      // AudioContext policy
    }
  };

  // 2대 스마트 균형 셔플 알고리즘
  const runSmartShuffle = () => {
    if (participants.length === 0 || isShuffling) return;

    setIsShuffling(true);
    playDrumrollSound();

    let step = 0;
    const maxSteps = 22;
    const intervalTime = 110;

    const interval = setInterval(() => {
      // 임시 셔플 효과 (빠르게 회전)
      const randomTemp = [...participants].sort(() => Math.random() - 0.5);
      const tempSeats: (Participant | null)[] = new Array(24).fill(null);
      randomTemp.slice(0, 24).forEach((p, i) => {
        tempSeats[i] = p;
      });
      setSeats(tempSeats);
      step++;

      if (step >= maxSteps) {
        clearInterval(interval);

        // 최종 균형 배치 연산
        const finalSeats: (Participant | null)[] = new Array(24).fill(null);
        let pool = [...participants];

        if (balanceGender && balanceSeniority) {
          // 남/여, 신/구 분리
          const seniorF = pool.filter(p => p.gender === 'F' && p.type === 'senior').sort(() => Math.random() - 0.5);
          const seniorM = pool.filter(p => p.gender === 'M' && p.type === 'senior').sort(() => Math.random() - 0.5);
          const newF = pool.filter(p => p.gender === 'F' && p.type === 'new').sort(() => Math.random() - 0.5);
          const newM = pool.filter(p => p.gender === 'M' && p.type === 'new').sort(() => Math.random() - 0.5);

          // 짝꿍(Desk: 2인 1조) 단위로 신규+기존 / 남+여 교차 배합
          for (let desk = 0; desk < 12; desk++) {
            const seat1 = desk * 2;
            const seat2 = desk * 2 + 1;

            const p1 = seniorF.pop() || seniorM.pop() || newF.pop() || newM.pop() || null;
            const p2 = (p1?.gender === 'F' ? (newM.pop() || seniorM.pop()) : (newF.pop() || seniorF.pop()))
                       || newF.pop() || seniorF.pop() || newM.pop() || seniorM.pop() || null;

            finalSeats[seat1] = p1;
            finalSeats[seat2] = p2;
          }
        } else {
          // 완전 무작위 셔플
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          shuffled.slice(0, 24).forEach((p, idx) => {
            finalSeats[idx] = p;
          });
        }

        setSeats(finalSeats);
        setIsShuffling(false);

        // 축하 컨페티 효과
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#b82828', '#2e5238', '#dfc27d', '#ffffff']
        });
      }
    }, intervalTime);
  };

  // 초기 1회 기본 셔플 배치
  useEffect(() => {
    const initialSeats: (Participant | null)[] = new Array(24).fill(null);
    participants.slice(0, 24).forEach((p, idx) => {
      initialSeats[idx] = p;
    });
    setSeats(initialSeats);
  }, [participants]);

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 배치도 이미지(PNG) 다운로드
  const handleDownloadSeats = async () => {
    if (!classroomRef.current) return;
    try {
      setIsCapturing(true);
      const dataUrl = await toPng(classroomRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#fcfbf9'
      });
      const link = document.createElement('a');
      link.download = `2026_플래닛_교실_자리배치표.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('배치표 저장 중 오류가 발생했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  // 참가자 추가
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newP: Participant = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      gender: newGender,
      type: newType
    };
    setParticipants([...participants, newP]);
    setNewName('');
  };

  // 참가자 삭제
  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1f1b18] font-sans selection:bg-[#b82828]/20 selection:text-[#b82828] pb-16">
      
      {/* 상단 헤더 & 컨트롤 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* 좌측: 홈으로 & 타이틀 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-[#d8d3c7] bg-[#f8f6f0] hover:bg-[#ede8dc] text-[#1f1b18] transition-colors flex items-center space-x-1 text-xs font-serif shadow-sm"
              title="뒤로 가기"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>돌아가기</span>
            </button>

            <div className="flex items-center space-x-2">
              <img src={planetLogo} alt="플래닛" className="w-8 h-8 object-contain rounded bg-white border border-[#e5e0d8] p-0.5 shadow-sm" />
              <div>
                <h1 className="text-sm font-serif font-bold text-[#1f1b18] flex items-center space-x-1.5">
                  <span>추억의 교실 자리바꾸기</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#b82828] text-white">현장용</span>
                </h1>
                <p className="text-[10px] text-[#666] font-serif">2026 플래닛 독서학교 1·2분단 스마트 좌석 배정</p>
              </div>
            </div>
          </div>

          {/* 우측: 셔플 및 컨트롤 버튼 */}
          <div className="flex items-center space-x-2">
            
            <button
              onClick={() => setShowManageModal(true)}
              className="px-3 py-1.5 rounded text-xs font-serif border border-[#d8d3c7] bg-white hover:bg-[#f8f6f0] text-[#1f1b18] flex items-center space-x-1 transition-all shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-[#2e5238]" />
              <span>명단 관리 ({participants.length}명)</span>
            </button>

            <button
              onClick={handleDownloadSeats}
              disabled={isCapturing}
              className="px-3 py-1.5 rounded text-xs font-serif border border-[#d8d3c7] bg-white hover:bg-[#f8f6f0] text-[#1f1b18] flex items-center space-x-1 transition-all shadow-sm"
              title="배치표 이미지 저장"
            >
              <Download className="w-3.5 h-3.5 text-[#555]" />
              <span className="hidden sm:inline">배치표 저장</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-xs font-serif border border-[#d8d3c7] bg-white hover:bg-[#f8f6f0] text-[#1f1b18] transition-all shadow-sm"
              title={isFullscreen ? "전체화면 종료" : "빔프로젝터 전체화면"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* 메인 셔플 액션 버튼 */}
            <button
              onClick={runSmartShuffle}
              disabled={isShuffling}
              className="px-4 py-2 rounded-lg bg-[#b82828] hover:bg-[#961e1e] text-white font-serif font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition-all disabled:opacity-50 active:scale-95"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{isShuffling ? '자리 섞는 중...' : '자리바꾸기 시작!'}</span>
            </button>

          </div>

        </div>
      </header>

      {/* 스마트 알고리즘 옵션 안내 바 */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-serif border-b border-[#e8e4dc]">
        <div className="flex items-center space-x-4">
          <span className="text-[#666] font-bold">스마트 밸런스 옵션:</span>
          
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={balanceGender} 
              onChange={e => setBalanceGender(e.target.checked)} 
              className="rounded border-[#bbb] text-[#b82828] focus:ring-0"
            />
            <span className="text-[#333]">성비 균형 (남녀 짝꿍 믹스)</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={balanceSeniority} 
              onChange={e => setBalanceSeniority(e.target.checked)} 
              className="rounded border-[#bbb] text-[#b82828] focus:ring-0"
            />
            <span className="text-[#333]">신·구 조화 (신규 + 기존 어른이)</span>
          </label>
        </div>

        <div className="text-[11px] text-[#888]">
          총 24석 배치 (1분단 8석 • 2분단 8석 • 3분단 8석)
        </div>
      </div>

      {/* 메인 교실 배치도 영역 (캡처 대상) */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        <div 
          ref={classroomRef}
          className="bg-white border-2 border-[#1f1b18] rounded-2xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden"
        >
          
          {/* 상단: 칠판 및 교탁 (선생님 / 운영진) */}
          <div className="text-center space-y-3">
            
            {/* 레트로 칠판 헤더 */}
            <div className="chalkboard-bg text-white max-w-xl mx-auto py-3 px-6 rounded-lg border-4 border-[#8B4513] shadow-lg relative">
              <div className="text-[10px] font-mono text-[#dfc27d] tracking-widest uppercase">
                CLASSROOM BLACKBOARD
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-black tracking-widest text-[#f7f5ed]">
                2026 플래닛 독서학교 「새학기 교실」
              </h2>
              <div className="text-[11px] text-[#a8b8ae] font-serif mt-0.5">
                * 책을 사랑하는 어른이들의 다정한 첫 만남
              </div>
            </div>

            {/* 교탁 그래픽 */}
            <div className="inline-block px-8 py-2 rounded-t-lg bg-[#5c4033] text-[#f7f5ed] font-serif font-bold text-xs border-2 border-b-4 border-[#3e2723] shadow-md">
              [ 교 탁 (선생님 / 운영진 교무석) ]
            </div>

          </div>

          {/* 중앙: 3개 분단 책상 레이아웃 (1분단 / 2분단 / 3분단) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4">
            
            {/* 분단 정의: 0~7 (1분단), 8~15 (2분단), 16~23 (3분단) */}
            {[
              { id: 1, name: '1 분단', sub: '창가 라인' },
              { id: 2, name: '2 분단', sub: '중앙 집중 라인' },
              { id: 3, name: '3 분단', sub: '복도 라인' }
            ].map((blandan, bIdx) => (
              <div 
                key={blandan.id} 
                className="bg-[#fcfbf9] border border-[#dcd6c8] rounded-xl p-4 space-y-4 shadow-sm"
              >
                
                {/* 분단 헤더 */}
                <div className="flex items-center justify-between pb-2 border-b border-[#e2ddd3]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b82828] inline-block"></span>
                    <h3 className="font-serif font-bold text-sm text-[#1f1b18]">{blandan.name}</h3>
                  </div>
                  <span className="text-[10px] font-serif text-[#777]">{blandan.sub}</span>
                </div>

                {/* 분단 내 4개 책상 (각 책상 2인 1조 짝꿍) */}
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((rowIdx) => {
                    const seatLeftIndex = bIdx * 8 + rowIdx * 2;
                    const seatRightIndex = seatLeftIndex + 1;
                    const pLeft = seats[seatLeftIndex];
                    const pRight = seats[seatRightIndex];

                    return (
                      <div 
                        key={rowIdx} 
                        className="bg-white border-2 border-[#1f1b18]/30 rounded-lg p-2 shadow-sm hover:border-[#1f1b18] transition-colors"
                      >
                        <div className="text-[9px] font-mono text-[#888] mb-1.5 text-center">
                          {rowIdx + 1}분임 책상 (짝꿍)
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          
                          {/* 왼쪽 좌석 */}
                          <div 
                            className={`p-2.5 rounded border text-center transition-all min-h-[58px] flex flex-col items-center justify-center ${
                              pLeft 
                                ? 'bg-[#fdfcf9] border-[#1f1b18]/40 shadow-sm' 
                                : 'bg-[#f7f5ed] border-dashed border-[#ccc]'
                            }`}
                          >
                            {pLeft ? (
                              <div className="space-y-0.5">
                                <div className="font-serif font-bold text-sm text-[#111] tracking-wide">
                                  {pLeft.name}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-[9px] px-1 rounded ${pLeft.gender === 'F' ? 'bg-[#fceded] text-[#b82828]' : 'bg-[#eef2ff] text-[#3b5998]'}`}>
                                    {pLeft.gender === 'F' ? '여' : '남'}
                                  </span>
                                  <span className={`text-[9px] px-1 rounded ${pLeft.type === 'new' ? 'bg-[#eaf4ec] text-[#2e5238]' : 'bg-[#ede8dc] text-[#555]'}`}>
                                    {pLeft.type === 'new' ? '신규' : '기존'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#aaa] font-serif">빈 자리</span>
                            )}
                          </div>

                          {/* 오른쪽 좌석 */}
                          <div 
                            className={`p-2.5 rounded border text-center transition-all min-h-[58px] flex flex-col items-center justify-center ${
                              pRight 
                                ? 'bg-[#fdfcf9] border-[#1f1b18]/40 shadow-sm' 
                                : 'bg-[#f7f5ed] border-dashed border-[#ccc]'
                            }`}
                          >
                            {pRight ? (
                              <div className="space-y-0.5">
                                <div className="font-serif font-bold text-sm text-[#111] tracking-wide">
                                  {pRight.name}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-[9px] px-1 rounded ${pRight.gender === 'F' ? 'bg-[#fceded] text-[#b82828]' : 'bg-[#eef2ff] text-[#3b5998]'}`}>
                                    {pRight.gender === 'F' ? '여' : '남'}
                                  </span>
                                  <span className={`text-[9px] px-1 rounded ${pRight.type === 'new' ? 'bg-[#eaf4ec] text-[#2e5238]' : 'bg-[#ede8dc] text-[#555]'}`}>
                                    {pRight.type === 'new' ? '신규' : '기존'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#aaa] font-serif">빈 자리</span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}

          </div>

          {/* 하단 배치도 설명 및 플래닛 독서학교 인증마크 */}
          <div className="pt-4 border-t border-[#e2ddd3] flex flex-wrap items-center justify-between text-xs font-serif text-[#666]">
            <div>
              * 자리 배치가 완료된 후 서로의 학생증과 선물할 책을 나누며 인사를 시작해 주세요.
            </div>
            <div className="font-bold text-[#1f1b18]">
              플래닛 독서학교 운영위원회 자리배치도 제2026호
            </div>
          </div>

        </div>

      </main>

      {/* 명단 관리 모달 */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#fcfbf9] border-2 border-[#1f1b18] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#e2ddd3]">
              <h3 className="font-serif font-bold text-base text-[#1f1b18]">
                참가 어른이 명단 관리 ({participants.length}명)
              </h3>
              <button 
                onClick={() => setShowManageModal(false)}
                className="text-[#888] hover:text-[#111] text-sm"
              >
                ✕ 닫기
              </button>
            </div>

            {/* 신규 어른이 추가 폼 */}
            <form onSubmit={handleAddParticipant} className="flex gap-2 p-3 bg-white border border-[#e2ddd3] rounded-lg">
              <input 
                type="text" 
                placeholder="이름 (예: 홍길동)" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="flex-1 border border-[#ccc] rounded px-2.5 py-1.5 text-xs font-serif focus:outline-none focus:border-[#b82828]"
              />
              <select 
                value={newGender} 
                onChange={e => setNewGender(e.target.value as 'M' | 'F')}
                className="border border-[#ccc] rounded px-2 text-xs font-serif"
              >
                <option value="F">여성</option>
                <option value="M">남성</option>
              </select>
              <select 
                value={newType} 
                onChange={e => setNewType(e.target.value as 'new' | 'senior')}
                className="border border-[#ccc] rounded px-2 text-xs font-serif"
              >
                <option value="new">신규</option>
                <option value="senior">기존</option>
              </select>
              <button 
                type="submit" 
                className="px-3 py-1.5 rounded bg-[#2e5238] hover:bg-[#23402c] text-white text-xs font-serif flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </form>

            {/* 명단 리스트 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {participants.map((p, idx) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-2 rounded bg-white border border-[#e8e4dc] text-xs font-serif"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-[#888] w-5">{idx + 1}.</span>
                    <span className="font-bold text-[#111]">{p.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.gender === 'F' ? 'bg-[#fceded] text-[#b82828]' : 'bg-[#eef2ff] text-[#3b5998]'}`}>
                      {p.gender === 'F' ? '여성' : '남성'}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.type === 'new' ? 'bg-[#eaf4ec] text-[#2e5238]' : 'bg-[#ede8dc] text-[#555]'}`}>
                      {p.type === 'new' ? '신규 어른이' : '기존 어른이'}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="p-1 text-[#aaa] hover:text-[#b82828] transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#e2ddd3] flex justify-between items-center text-xs font-serif">
              <button 
                onClick={() => setParticipants(DEFAULT_PARTICIPANTS)}
                className="text-[#777] hover:text-[#111] underline"
              >
                기본 샘플 24인 복원
              </button>
              <button 
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded bg-[#1f1b18] text-white font-bold"
              >
                적용 완료
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
