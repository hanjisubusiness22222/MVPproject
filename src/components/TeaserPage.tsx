import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Clock, 
  Calendar, 
  MapPin, 
  Glasses, 
  Wine, 
  BookOpen, 
  Key, 
  Send, 
  CheckCircle2, 
  X,
  ChevronDown,
  Crown
} from 'lucide-react';
import { EVENT_CONFIG } from '../constants/eventConfig';

interface TeaserPageProps {
  onExploreFullPage?: () => void;
}

export const TeaserPage: React.FC<TeaserPageProps> = ({ onExploreFullPage }) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // D-Day 타이머 상태
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // 사전 알림 모달 상태
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [contactInput, setContactInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 시크릿 패스코드 상태
  const [secretCode, setSecretCode] = useState('');
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [secretError, setSecretError] = useState(false);

  // 카운트다운 계산
  useEffect(() => {
    const targetDate = new Date(EVENT_CONFIG.targetDateTime).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio 효과음 (실링 왁스 깨지는 소리 & 오르골 벨)
  const playSoundEffect = (type: 'break' | 'bell' | 'chime') => {
    if (isMuted) return;
    try {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContext) setAudioContext(ctx);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'break') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'bell') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // 실링 왁스 클릭 핸들러
  const handleWaxClick = () => {
    if (!isOpened) {
      playSoundEffect('break');
      setIsOpened(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#741B2D', '#16382C', '#F9F6F0']
      });
    }
  };

  // 사전 알림 제출
  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim()) return;

    // 로컬 스토리지에 임시 저장
    try {
      const existing = JSON.parse(localStorage.getItem('planet_subscribers') || '[]');
      existing.push({ contact: contactInput, date: new Date().toISOString() });
      localStorage.setItem('planet_subscribers', JSON.stringify(existing));
    } catch (err) {}

    setIsSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 70,
      colors: ['#D4AF37', '#16382C']
    });

    setTimeout(() => {
      setIsNotifyModalOpen(false);
      setIsSubmitted(false);
      setContactInput('');
    }, 2200);
  };

  // 비밀 암호 검증
  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = secretCode.trim().toUpperCase();
    if (['PROM', 'IVY', 'PLANET', '프롬', '새학기', '2026'].includes(clean)) {
      setSecretRevealed(true);
      setSecretError(false);
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#C5A059', '#741B2D', '#FFFFFF']
      });
    } else {
      setSecretError(true);
      setTimeout(() => setSecretError(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen bg-ivy-pattern bg-tartan-overlay text-cream-100 flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden selection:bg-gold-500/30 selection:text-gold-200">
      
      {/* 상단 앰비언트 바 */}
      <header className="w-full max-w-5xl flex items-center justify-between py-3 border-b border-gold-500/20 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border border-gold-500/40 bg-ivy-900 flex items-center justify-center text-gold-400 font-crest text-xs shadow-crest">
            PA
          </div>
          <div>
            <span className="font-crest tracking-widest text-xs uppercase text-gold-400 font-bold block sm:inline">
              PLANET BOOK ACADEMY
            </span>
            <span className="text-[10px] text-cream-400 font-typewriter sm:ml-2">
              EST. 2017 • IVY & GEEK CHIC ARCHIVE
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* 오디오 토글 */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (isMuted) playSoundEffect('bell');
            }}
            className="p-2 rounded-full border border-gold-500/30 hover:border-gold-500 bg-ivy-900/60 text-gold-400 hover:text-gold-300 transition-all text-xs flex items-center space-x-1"
            title={isMuted ? "효과음 켜기" : "효과음 끄기"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-gold-400 animate-pulse" />}
          </button>
        </div>
      </header>

      {/* 중앙 메인: 앤틱 봉투 & 실링 왁스 인터랙션 */}
      <main className="w-full max-w-4xl my-auto py-8 sm:py-12 flex flex-col items-center justify-center z-10">
        
        {/* 상단 타이틀 */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-gold-500/30 bg-ivy-900/80 text-gold-300 text-xs font-typewriter">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>CONFIDENTIAL INVITATION • SAVE THE DATE</span>
          </div>
          <h1 className="font-crest text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cream-100 via-gold-300 to-cream-100 drop-shadow-sm">
            The 2026 Annual Planet Gala
          </h1>
          <p className="font-display italic text-sm sm:text-lg text-cream-300 max-w-xl mx-auto">
            "Semester of Planet & The Romantic Winter Prom"
          </p>
        </div>

        {/* 봉투 컨테이너 */}
        <div className="relative w-full max-w-xl perspective-1000">
          
          {/* 봉투 본체 (크림/버건디 라이닝) */}
          <div 
            onClick={handleWaxClick}
            className={`relative mx-auto w-full transition-all duration-700 cursor-pointer select-none ${
              isOpened ? 'cursor-default' : 'hover:scale-[1.01]'
            }`}
          >
            {/* 봉투 외관 박스 */}
            <div className="relative bg-gradient-to-b from-ivy-900 to-[#0b1e17] rounded-xl border-2 border-gold-500/40 p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden">
              
              {/* 타탄체크 은은한 오버레이 */}
              <div className="absolute inset-0 bg-tartan-overlay opacity-30 pointer-events-none"></div>
              
              {/* 모서리 금박 문양 */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-500/60"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-500/60"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-500/60"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-500/60"></div>

              {/* 봉투 덮개 라인 */}
              {!isOpened && (
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ivy-800/80 to-transparent pointer-events-none flex items-center justify-center">
                  <div className="w-full border-b border-gold-500/20 transform -rotate-12 translate-y-6"></div>
                </div>
              )}

              {/* 중앙 실링 왁스 스탬프 */}
              <div className="relative flex flex-col items-center justify-center py-6 sm:py-8 z-20">
                <div 
                  className={`group relative transition-transform duration-500 ${
                    isOpened ? 'scale-75 opacity-90' : 'hover:scale-110'
                  }`}
                >
                  {/* 왁스 원형 본체 (버건디 & 골드 크레스트) */}
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-bordeaux-700 via-bordeaux-800 to-bordeaux-950 p-1.5 shadow-wax border-2 border-gold-500/70 flex items-center justify-center ${
                    !isOpened ? 'animate-pulse' : ''
                  }`}>
                    <div className="w-full h-full rounded-full border border-gold-500/40 flex flex-col items-center justify-center text-center p-2 bg-bordeaux-900/60">
                      <span className="font-crest text-gold-400 font-black text-xl sm:text-2xl tracking-tighter">
                        PLANET
                      </span>
                      <span className="text-[9px] font-typewriter text-gold-300/80 tracking-widest mt-0.5">
                        2017
                      </span>
                    </div>
                  </div>

                  {/* 왁스 위 펄/광택 이펙트 */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold-400/20 blur-sm pointer-events-none"></div>

                  {/* 미개봉 상태 클릭 유도 안내 */}
                  {!isOpened && (
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-sans text-gold-300 font-semibold bg-ivy-950/90 px-3 py-1 rounded-full border border-gold-500/30 shadow-md">
                      👆 인장을 눌러 봉투를 개봉하세요
                    </div>
                  )}
                </div>
              </div>

              {/* 개봉 시 나타나는 초대 서간문 (The Revealed Invitation Card) */}
              <div 
                className={`transition-all duration-700 overflow-hidden ${
                  isOpened 
                    ? 'max-h-[900px] opacity-100 mt-4 pt-6 border-t border-gold-500/30' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="paper-grain rounded-lg p-5 sm:p-7 text-ivy-950 shadow-inner border border-gold-600/30 space-y-5">
                  
                  {/* 카드 헤더 */}
                  <div className="text-center border-b border-ivy-900/20 pb-4">
                    <div className="font-crest text-xs tracking-widest text-ivy-800 font-bold uppercase">
                      OFFICIAL INVITATION • ISSUE NO. 2026-1
                    </div>
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-ivy-900 mt-1">
                      친애하는 플래닛 펠로우(Fellow) 여러분께
                    </h2>
                    <p className="font-classic text-sm text-ivy-800/80 mt-1">
                      2026년 한 해 동안 함께 지적 여정을 일궈온 학우 여러분을 연말 갈라에 초대합니다.
                    </p>
                  </div>

                  {/* 핵심 일정 & 프로그램 2부제 안내 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    {/* 1부 */}
                    <div className="bg-white/80 p-3.5 rounded border border-gold-500/30 shadow-sm space-y-1">
                      <div className="flex items-center space-x-1.5 text-bordeaux-800 font-bold font-crest">
                        <BookOpen className="w-4 h-4 text-bordeaux-700" />
                        <span>1부 • 플래닛의 새학기</span>
                      </div>
                      <div className="text-ivy-900 font-semibold text-xs">
                        12:00 ~ 18:00 @ 공간나인 강남점
                      </div>
                      <p className="text-[11px] text-ivy-800/80">
                        블라인드 북 익스체인지(선물 도서 교환) & 아카데미 명예의 전당 어워즈
                      </p>
                    </div>

                    {/* 2부 */}
                    <div className="bg-white/80 p-3.5 rounded border border-gold-500/30 shadow-sm space-y-1">
                      <div className="flex items-center space-x-1.5 text-ivy-900 font-bold font-crest">
                        <Wine className="w-4 h-4 text-gold-600" />
                        <span>2부 • 플래닛의 윈터 프롬</span>
                      </div>
                      <div className="text-ivy-900 font-semibold text-xs">
                        18:00 ~ LATE @ 강남 프라이빗 파티룸
                      </div>
                      <p className="text-[11px] text-ivy-800/80">
                        샴페인 토스트, 베스트 드레서(Prom King & Queen) 현장 투표 & 재즈 살롱
                      </p>
                    </div>
                  </div>

                  {/* 드레스코드 힌트 요약 */}
                  <div className="p-3 bg-ivy-900/5 rounded border border-ivy-900/10 flex items-start space-x-2.5 text-xs text-ivy-900">
                    <Glasses className="w-4 h-4 text-ivy-800 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Dress Code: </span>
                      <span>Classic Preppy with a Twist of Geek Chic (블레이저, 긱 시크 뿔테·무테 안경 / 야간 프롬 리본 & 보타이)</span>
                    </div>
                  </div>

                  {/* CTA 버튼 영역 */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={() => setIsNotifyModalOpen(true)}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded bg-bordeaux-800 hover:bg-bordeaux-900 text-gold-200 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-gold-400" />
                      <span>신청 오픈 시 사전 알림 받기</span>
                    </button>

                    {onExploreFullPage && (
                      <button
                        onClick={onExploreFullPage}
                        className="w-full sm:w-auto py-2.5 px-4 rounded border border-ivy-900/40 hover:bg-ivy-900/10 text-ivy-900 font-semibold text-xs sm:text-sm transition-all"
                      >
                        본 안내장 전체보기
                      </button>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 하단 카운트다운 타이머 */}
        <div className="w-full max-w-xl mt-8 p-4 rounded-xl border border-gold-500/20 bg-ivy-900/60 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center space-x-2 text-gold-400 text-xs font-crest font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>COUNTDOWN TO GALA (2026.12.19 SAT 12:00)</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-cream-100">
            <div className="bg-ivy-950/80 p-2 sm:p-3 rounded-lg border border-gold-500/20">
              <span className="font-crest text-xl sm:text-3xl font-bold text-gold-300 block">{timeLeft.days}</span>
              <span className="text-[10px] sm:text-xs text-cream-400 uppercase font-typewriter">DAYS</span>
            </div>
            <div className="bg-ivy-950/80 p-2 sm:p-3 rounded-lg border border-gold-500/20">
              <span className="font-crest text-xl sm:text-3xl font-bold text-gold-300 block">{timeLeft.hours}</span>
              <span className="text-[10px] sm:text-xs text-cream-400 uppercase font-typewriter">HOURS</span>
            </div>
            <div className="bg-ivy-950/80 p-2 sm:p-3 rounded-lg border border-gold-500/20">
              <span className="font-crest text-xl sm:text-3xl font-bold text-gold-300 block">{timeLeft.minutes}</span>
              <span className="text-[10px] sm:text-xs text-cream-400 uppercase font-typewriter">MINUTES</span>
            </div>
            <div className="bg-ivy-950/80 p-2 sm:p-3 rounded-lg border border-gold-500/20">
              <span className="font-crest text-xl sm:text-3xl font-bold text-gold-300 block">{timeLeft.seconds}</span>
              <span className="text-[10px] sm:text-xs text-cream-400 uppercase font-typewriter">SECONDS</span>
            </div>
          </div>
        </div>

        {/* 시크릿 패스코드 이스터에그 영역 */}
        <div className="w-full max-w-md mt-6 text-center">
          {!secretRevealed ? (
            <form onSubmit={handleSecretSubmit} className="flex items-center justify-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="비밀 암호 (Passcode) 입력"
                  className="w-full bg-ivy-950/80 border border-gold-500/30 rounded-lg py-1.5 px-3 text-xs text-gold-300 placeholder:text-cream-400/50 font-typewriter focus:outline-none focus:border-gold-500 text-center"
                />
                <Key className="w-3.5 h-3.5 text-gold-500/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-600/20 hover:bg-gold-600/40 text-gold-300 text-xs font-crest transition-all"
              >
                UNLOCK
              </button>
            </form>
          ) : (
            <div className="p-3 rounded-lg border border-gold-500/50 bg-bordeaux-950/80 text-gold-200 text-xs space-y-1 animate-fade-in shadow-lg">
              <div className="flex items-center justify-center space-x-1.5 text-gold-300 font-bold">
                <Crown className="w-4 h-4 text-gold-400" />
                <span>SECRET UNLOCKED : THE WINTER PROM HINT</span>
              </div>
              <p className="text-[11px] text-cream-300">
                "밤의 윈터 프롬에서는 가장 멋진 프레피 룩을 선보인 학우에게 수여되는 특별한 <strong>Prom King & Queen 티아라</strong>가 준비되어 있습니다."
              </p>
            </div>
          )}
          {secretError && (
            <p className="text-[11px] text-red-400 mt-1 font-typewriter">
              Invalid Passcode. (Hint: PROM, IVY, PLANET)
            </p>
          )}
        </div>

      </main>

      {/* 하단 푸터 */}
      <footer className="w-full max-w-5xl py-4 border-t border-gold-500/20 text-center text-[11px] text-cream-400/80 font-typewriter space-y-1 z-20">
        <p>© 2026 PLANET BOOK ACADEMY. ALL RIGHTS RESERVED.</p>
        <p className="text-gold-500/70">WHERE HERITAGE MEETS MODERN FELLOWSHIP</p>
      </footer>

      {/* 사전 알림 등록 모달 */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-ivy-900 border-2 border-gold-500/60 rounded-xl p-6 text-cream-100 shadow-2xl">
            <button
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute top-3 right-3 text-cream-400 hover:text-cream-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-4">
              <div className="w-10 h-10 rounded-full border border-gold-500/40 bg-ivy-950 mx-auto flex items-center justify-center text-gold-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-crest text-lg font-bold text-gold-300">
                EARLY RSVP NOTIFICATION
              </h3>
              <p className="text-xs text-cream-300 font-classic">
                정식 초대장 및 신청 폼이 오픈되는 즉시 가장 먼저 연락을 드립니다.
              </p>
            </div>

            {isSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-gold-400 mx-auto animate-bounce" />
                <p className="font-bold text-sm text-gold-300">알림 예약이 정상 접수되었습니다!</p>
                <p className="text-xs text-cream-300">오픈 당일 문자 또는 이메일로 링크를 발송해 드립니다.</p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gold-400 mb-1">
                    연락처 또는 이메일 주소
                  </label>
                  <input
                    type="text"
                    required
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder="010-0000-0000 또는 email@domain.com"
                    className="w-full bg-ivy-950 border border-gold-500/40 rounded-lg p-2.5 text-sm text-cream-100 placeholder:text-cream-400/40 focus:outline-none focus:border-gold-400 font-sans"
                  />
                </div>

                <div className="text-[11px] text-cream-400/70">
                  * 수집된 연락처는 2026 플래닛 연말 갈라 안내 발송 목적으로만 사용되며 모임 종료 후 파기됩니다.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-bordeaux-800 hover:bg-bordeaux-700 text-gold-200 font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>사전 오픈 알림 신청하기</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
