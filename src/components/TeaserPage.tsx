import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Clock, 
  Glasses, 
  Wine, 
  BookOpen, 
  Key, 
  Send, 
  CheckCircle2, 
  X,
  Crown,
  Scroll
} from 'lucide-react';
import { EVENT_CONFIG } from '../constants/eventConfig';
import { sanitizeText, validatePhone, validateEmail } from '../utils/validation';

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
  const [hpCheck, setHpCheck] = useState('');
  const [validationError, setValidationError] = useState('');
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

  // Web Audio 효과음 (고급 샴페인 글라스 챙 & 하프 톤)
  const playLuxurySound = (type: 'seal' | 'chime') => {
    if (isMuted) return;
    try {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContext) setAudioContext(ctx);

      const now = ctx.currentTime;
      if (type === 'seal') {
        // 부드럽게 깨지는 왁스 + 샴페인 토스트 글라스 벨 소리
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1760, now); // A6
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.8);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2637, now); // E7
        osc2.frequency.exponentialRampToValueAtTime(1318, now + 1.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } else {
        // 벨 톤
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // 실링 왁스 클릭 핸들러
  const handleWaxClick = () => {
    if (!isOpened) {
      playLuxurySound('seal');
      setIsOpened(true);
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#D4AF37', '#E8CB85', '#741B2D', '#FAF2DE', '#16382C']
      });
    }
  };

  // 사전 알림 제출
  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (hpCheck.trim() !== '') {
      setIsSubmitted(true);
      setTimeout(() => { setIsNotifyModalOpen(false); setIsSubmitted(false); }, 1500);
      return;
    }

    const sanitizedContact = sanitizeText(contactInput, 100);
    if (!sanitizedContact) {
      setValidationError('연락처 또는 이메일을 입력해 주세요.');
      return;
    }

    const isPhone = validatePhone(sanitizedContact);
    const isEmail = validateEmail(sanitizedContact);
    if (!isPhone && !isEmail) {
      setValidationError('올바른 휴대폰 번호(010-0000-0000) 또는 이메일 형식을 입력해 주세요.');
      return;
    }

    try {
      if (EVENT_CONFIG.googleScriptUrl) {
        await fetch(EVENT_CONFIG.googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'early_notify',
            contact: sanitizedContact,
            hp_check: hpCheck
          })
        });
      }
      
      const existing = JSON.parse(localStorage.getItem('planet_subscribers') || '[]');
      existing.push({ contact: sanitizedContact, date: new Date().toISOString() });
      localStorage.setItem('planet_subscribers', JSON.stringify(existing));
    } catch (err) {}

    setIsSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      colors: ['#D4AF37', '#E8CB85', '#16382C']
    });

    setTimeout(() => {
      setIsNotifyModalOpen(false);
      setIsSubmitted(false);
      setContactInput('');
      setHpCheck('');
      setValidationError('');
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
        particleCount: 120,
        spread: 100,
        origin: { y: 0.65 },
        colors: ['#D4AF37', '#C5A059', '#741B2D', '#FAF2DE', '#FFFFFF']
      });
    } else {
      setSecretError(true);
      setTimeout(() => setSecretError(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen bg-ivy-pattern bg-tartan-overlay text-cream-100 flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 overflow-x-hidden selection:bg-gold-500/30 selection:text-gold-200">
      
      {/* 럭셔리 배경 앰비언트 글로우 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ivy-800/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-2/3 left-1/3 w-[450px] h-[450px] bg-bordeaux-900/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 상단 헤리티지 네비게이션 바 */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-gold-500/30 z-20">
        <div className="flex items-center space-x-3.5">
          {/* 아카데미 럭셔리 크레스트 엠블럼 */}
          <div className="w-10 h-10 rounded-full border-2 border-gold-400/60 bg-gradient-to-br from-ivy-900 via-ivy-950 to-navy-950 flex items-center justify-center text-gold-300 font-crest text-xs shadow-crest ring-1 ring-gold-500/20">
            <span className="font-extrabold tracking-tighter text-sm text-gold-300">PA</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-crest tracking-[0.25em] text-xs uppercase text-gold-300 font-bold">
                PLANET BOOK ACADEMY
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-typewriter text-gold-400/80 border border-gold-500/30 bg-gold-500/10">
                MMXVII
              </span>
            </div>
            <p className="text-[10px] text-cream-400/70 font-classic italic tracking-wider">
              Litterae, Veritas et Amicitia • Classic Ivy & Romantic Prom
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (isMuted) playLuxurySound('chime');
            }}
            className="p-2.5 rounded-full border border-gold-500/40 hover:border-gold-400 bg-ivy-900/80 text-gold-300 hover:text-gold-200 transition-all shadow-md"
            title={isMuted ? "효과음 켜기" : "효과음 끄기"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-cream-400/60" /> : <Volume2 className="w-4 h-4 text-gold-300 animate-pulse" />}
          </button>
        </div>
      </header>

      {/* 중앙 메인: 앤틱 봉투 & 3D 실링 왁스 인터랙션 */}
      <main className="w-full max-w-3xl my-auto py-8 sm:py-12 flex flex-col items-center justify-center z-10">
        
        {/* 상단 타이틀 & 모토 */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-gold-400/30 bg-ivy-900/90 text-gold-300 text-[11px] font-typewriter tracking-widest shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>CONFIDENTIAL INVITATION • PRIVÉ</span>
          </div>
          <h1 className="font-crest text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-gold-metallic drop-shadow-md">
            The Annual Planet Gala
          </h1>
          <p className="font-display italic text-base sm:text-xl text-cream-200/90 max-w-xl mx-auto font-medium">
            "Semester of Planet & The Romantic Winter Prom"
          </p>
          <div className="flex items-center justify-center space-x-3 pt-1">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"></div>
            <span className="text-[11px] font-typewriter text-gold-400/90 tracking-[0.2em] uppercase">
              SATURDAY, DECEMBER 19, 2026
            </span>
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"></div>
          </div>
        </div>

        {/* 봉투 컨테이너 */}
        <div className="relative w-full max-w-xl">
          
          <div 
            onClick={handleWaxClick}
            className={`relative mx-auto w-full transition-all duration-700 select-none ${
              isOpened ? 'cursor-default' : 'cursor-pointer hover:scale-[1.015]'
            }`}
          >
            {/* 봉투 본체: 다크 포레스트 그린 레더 텍스처 & 이중 금박 라인 */}
            <div className="relative bg-gradient-to-b from-[#0b1f18] via-[#091a13] to-[#06140e] rounded-2xl border-2 border-gold-500/40 p-6 sm:p-9 envelope-shadow overflow-hidden">
              
              {/* 타탄 오버레이 & 미세 빛 반사 */}
              <div className="absolute inset-0 bg-tartan-overlay opacity-25 pointer-events-none"></div>
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold-400/5 rounded-full blur-2xl pointer-events-none"></div>
              
              {/* 4개 코너 장식 (Antique Filigree Corner Brackets) */}
              <svg className="absolute top-2.5 left-2.5 w-6 h-6 text-gold-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 12V4C2 2.89543 2.89543 2 4 2H12" />
                <path d="M5 9V5H9" />
                <circle cx="5" cy="5" r="1" fill="currentColor" />
              </svg>
              <svg className="absolute top-2.5 right-2.5 w-6 h-6 text-gold-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12V4C22 2.89543 21.1046 2 20 2H12" />
                <path d="M19 9V5H15" />
                <circle cx="19" cy="5" r="1" fill="currentColor" />
              </svg>
              <svg className="absolute bottom-2.5 left-2.5 w-6 h-6 text-gold-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 12V20C2 21.1046 2.89543 22 4 22H12" />
                <path d="M5 15V19H9" />
                <circle cx="5" cy="19" r="1" fill="currentColor" />
              </svg>
              <svg className="absolute bottom-2.5 right-2.5 w-6 h-6 text-gold-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12V20C22 21.1046 21.1046 22 20 22H12" />
                <path d="M19 15V19H15" />
                <circle cx="19" cy="19" r="1" fill="currentColor" />
              </svg>

              {/* 이중 골드 이너 프레임 라인 */}
              <div className="absolute inset-2 border border-gold-500/20 rounded-xl pointer-events-none"></div>

              {/* 중앙 실링 왁스 스탬프 (3D 불규칙 외곽선 엠보싱) */}
              <div className="relative flex flex-col items-center justify-center py-6 sm:py-8 z-20">
                <div 
                  className={`group relative transition-all duration-500 ${
                    isOpened ? 'scale-75 opacity-90' : 'hover:scale-105'
                  }`}
                >
                  {/* 불규칙한 실제 왁스 림 효과 SVG 래퍼 */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    
                    {/* 뒤틀린 왁스 외곽 글로우 */}
                    <div className="absolute inset-0 rounded-full bg-bordeaux-900/60 blur-md pointer-events-none animate-shimmer"></div>

                    {/* 버건디 3D 왁스 바디 */}
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-bordeaux-700 via-bordeaux-800 to-bordeaux-950 p-2 wax-seal-shadow border border-gold-400/60 flex items-center justify-center">
                      
                      {/* 음각 엠보싱 크레스트 링 */}
                      <div className="w-full h-full rounded-full border-2 border-dashed border-gold-500/40 bg-gradient-to-b from-bordeaux-900/90 to-bordeaux-950/90 flex flex-col items-center justify-center text-center p-2 shadow-inner">
                        
                        {/* 크레스트 엠블럼 아이콘 */}
                        <Crown className="w-4 h-4 text-gold-300 drop-shadow-sm mb-0.5" />
                        <span className="font-crest text-gold-metallic font-black text-xl sm:text-2xl tracking-tighter">
                          PLANET
                        </span>
                        <span className="text-[8px] font-typewriter text-gold-300/90 tracking-widest uppercase">
                          • EST. 2017 •
                        </span>
                      </div>
                    </div>

                    {/* 금박 펄 파우더 하이라이트 */}
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gold-300/25 blur-sm pointer-events-none"></div>
                  </div>

                  {/* 미개봉 상태 클릭 툴팁 */}
                  {!isOpened && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-sans text-gold-200 font-semibold bg-ivy-950/95 px-4 py-1.5 rounded-full border border-gold-500/50 shadow-xl flex items-center space-x-1.5 animate-bounce">
                      <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                      <span>인장을 눌러 봉투를 개봉하세요</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 개봉 시 나타나는 공식 서간문 (The Revealed Dean's Epistle) */}
              <div 
                className={`transition-all duration-700 overflow-hidden ${
                  isOpened 
                    ? 'max-h-[1000px] opacity-100 mt-4 pt-6 border-t border-gold-500/30' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="paper-grain rounded-xl p-6 sm:p-8 text-ivy-950 shadow-2xl border border-gold-600/40 space-y-6 relative overflow-hidden">
                  
                  {/* 종이 배경 연한 워터마크 크레스트 */}
                  <div className="absolute right-4 bottom-4 font-crest text-8xl font-black text-ivy-900/[0.04] select-none pointer-events-none">
                    PA
                  </div>

                  {/* 서간문 헤더 */}
                  <div className="text-center border-b-2 border-ivy-900/15 pb-5">
                    <div className="font-crest text-xs tracking-[0.25em] text-ivy-800 font-bold uppercase">
                      COLLEGIATE GAZETTE • BULLETIN NO. 2026-1
                    </div>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-ivy-950 mt-1.5">
                      친애하는 플래닛 펠로우(Fellow) 여러분께
                    </h2>
                    <p className="font-classic text-sm sm:text-base text-ivy-900/80 mt-1 italic">
                      "책을 사랑하고 지적인 우정을 쌓아온 모든 학우를 연말 갈라에 모십니다."
                    </p>
                  </div>

                  {/* 1부 & 2부 듀얼 세션 카드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                    {/* 1부 새학기 세미나 */}
                    <div className="bg-white/90 p-4 rounded-lg border border-gold-500/40 shadow-sm space-y-2">
                      <div className="flex items-center space-x-2 text-bordeaux-800 font-bold font-crest">
                        <BookOpen className="w-4 h-4 text-bordeaux-700" />
                        <span className="text-sm">SESSION I • 플래닛의 새학기</span>
                      </div>
                      <div className="text-ivy-900 font-semibold text-xs font-sans">
                        12:00 ~ 18:00 @ 공간나인 강남점
                      </div>
                      <p className="text-[12px] text-ivy-800/85 leading-relaxed font-classic">
                        하우스 조배치 & 블라인드 책 선물 교환식, 2026 명예의 전당 아카데미 어워즈
                      </p>
                    </div>

                    {/* 2부 윈터 프롬 */}
                    <div className="bg-white/90 p-4 rounded-lg border border-gold-500/40 shadow-sm space-y-2">
                      <div className="flex items-center space-x-2 text-ivy-900 font-bold font-crest">
                        <Wine className="w-4 h-4 text-gold-600" />
                        <span className="text-sm">SESSION II • 플래닛의 윈터 프롬</span>
                      </div>
                      <div className="text-ivy-900 font-semibold text-xs font-sans">
                        18:00 ~ LATE @ Secret Prom Lounge
                      </div>
                      <p className="text-[12px] text-ivy-800/85 leading-relaxed font-classic">
                        샴페인 토스트, 베스트 드레서(Prom King & Queen) 현장 모바일 투표 & 재즈 살롱
                      </p>
                    </div>
                  </div>

                  {/* 드레스코드 룩북 박스 */}
                  <div className="p-3.5 bg-ivy-900/5 rounded-lg border border-ivy-900/15 flex items-start space-x-3 text-xs text-ivy-900">
                    <Glasses className="w-4 h-4 text-ivy-800 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-ivy-950 font-crest">DRESS CODE: </span>
                      <span className="font-classic text-[13px]">
                        정통 프레피 & 긱 시크 (블레이저, 아가일 니트, 뿔테·무테 안경 / 야간 윈터 프롬용 보타이 & 코사지 포인트)
                      </span>
                    </div>
                  </div>

                  {/* 인터랙션 버튼 */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      onClick={() => setIsNotifyModalOpen(true)}
                      className="w-full sm:flex-1 py-3 px-5 rounded-lg bg-gradient-to-r from-bordeaux-800 to-bordeaux-900 hover:from-bordeaux-700 hover:to-bordeaux-800 text-gold-200 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-gold-500/10 border border-gold-400/40"
                    >
                      <Sparkles className="w-4 h-4 text-gold-400" />
                      <span>신청 오픈 시 사전 알림 예약</span>
                    </button>

                    {onExploreFullPage && (
                      <button
                        onClick={onExploreFullPage}
                        className="w-full sm:w-auto py-3 px-5 rounded-lg border border-ivy-900/30 hover:bg-ivy-900/10 text-ivy-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Scroll className="w-4 h-4 text-ivy-800" />
                        <span>공식 안내장 전체보기</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 카운트다운 타이머 (럭셔리 골드 프레임) */}
        <div className="w-full max-w-xl mt-9 p-5 rounded-2xl border border-gold-500/30 bg-ivy-950/80 backdrop-blur-md text-center shadow-2xl">
          <div className="flex items-center justify-center space-x-2 text-gold-400 text-xs font-crest font-semibold uppercase tracking-[0.2em] mb-4">
            <Clock className="w-3.5 h-3.5 text-gold-400" />
            <span>COUNTDOWN TO GALA • 2026.12.19 SAT 12:00</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 text-cream-100">
            <div className="bg-ivy-900/90 p-3 rounded-xl border border-gold-500/30 shadow-inner">
              <span className="font-crest text-2xl sm:text-4xl font-extrabold text-gold-metallic block">{timeLeft.days}</span>
              <span className="text-[10px] text-cream-400/80 uppercase font-typewriter tracking-wider">DAYS</span>
            </div>
            <div className="bg-ivy-900/90 p-3 rounded-xl border border-gold-500/30 shadow-inner">
              <span className="font-crest text-2xl sm:text-4xl font-extrabold text-gold-metallic block">{timeLeft.hours}</span>
              <span className="text-[10px] text-cream-400/80 uppercase font-typewriter tracking-wider">HOURS</span>
            </div>
            <div className="bg-ivy-900/90 p-3 rounded-xl border border-gold-500/30 shadow-inner">
              <span className="font-crest text-2xl sm:text-4xl font-extrabold text-gold-metallic block">{timeLeft.minutes}</span>
              <span className="text-[10px] text-cream-400/80 uppercase font-typewriter tracking-wider">MINUTES</span>
            </div>
            <div className="bg-ivy-900/90 p-3 rounded-xl border border-gold-500/30 shadow-inner">
              <span className="font-crest text-2xl sm:text-4xl font-extrabold text-gold-metallic block">{timeLeft.seconds}</span>
              <span className="text-[10px] text-cream-400/80 uppercase font-typewriter tracking-wider">SECONDS</span>
            </div>
          </div>
        </div>

        {/* 시크릿 패스코드 이스터에그 */}
        <div className="w-full max-w-md mt-7 text-center">
          {!secretRevealed ? (
            <form onSubmit={handleSecretSubmit} className="flex items-center justify-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="비밀 암호 (Passcode) 입력"
                  className="w-full bg-ivy-950/90 border border-gold-500/30 rounded-xl py-2 px-3 text-xs text-gold-300 placeholder:text-cream-400/40 font-typewriter focus:outline-none focus:border-gold-400 text-center tracking-widest shadow-inner"
                />
                <Key className="w-3.5 h-3.5 text-gold-500/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl border border-gold-400/50 bg-gradient-to-r from-gold-600/30 to-gold-500/20 hover:bg-gold-600/40 text-gold-300 text-xs font-crest tracking-wider transition-all shadow-md"
              >
                UNLOCK
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl border border-gold-500/60 bg-gradient-to-br from-bordeaux-950/90 to-ivy-950/90 text-gold-200 text-xs space-y-1.5 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-center space-x-1.5 text-gold-300 font-bold font-crest">
                <Crown className="w-4 h-4 text-gold-400" />
                <span>SECRET UNLOCKED : THE WINTER PROM HINT</span>
              </div>
              <p className="text-[12px] text-cream-200/90 font-classic">
                "밤의 윈터 프롬에서는 가장 멋진 프레피 룩을 선보인 학우에게 수여되는 특별한 <strong>Prom King & Queen 티아라</strong>가 준비되어 있습니다."
              </p>
            </div>
          )}
          {secretError && (
            <p className="text-[11px] text-red-400 mt-1.5 font-typewriter">
              Invalid Passcode. (Hint: PROM, IVY, PLANET)
            </p>
          )}
        </div>

      </main>

      {/* 하단 푸터 */}
      <footer className="w-full max-w-4xl py-5 border-t border-gold-500/30 text-center text-[11px] text-cream-400/80 font-typewriter space-y-1 z-20">
        <p>© 2026 PLANET BOOK ACADEMY. ALL RIGHTS RESERVED.</p>
        <p className="text-gold-400/80 font-crest tracking-widest">WHERE HERITAGE MEETS MODERN FELLOWSHIP</p>
      </footer>

      {/* 사전 알림 등록 모달 (보안 허니팟 탑재) */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-b from-ivy-900 to-[#081711] border-2 border-gold-500/60 rounded-2xl p-7 text-cream-100 shadow-2xl">
            <button
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute top-4 right-4 text-cream-400 hover:text-gold-300 p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-5">
              <div className="w-12 h-12 rounded-full border border-gold-400/50 bg-ivy-950 mx-auto flex items-center justify-center text-gold-300 shadow-crest">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-crest text-lg font-bold text-gold-300 tracking-wider">
                EARLY RSVP NOTIFICATION
              </h3>
              <p className="text-xs text-cream-300/90 font-classic">
                정식 초대장 및 신청 폼이 오픈되는 즉시 가장 먼저 연락을 드립니다.
              </p>
            </div>

            {isSubmitted ? (
              <div className="py-6 text-center space-y-2.5">
                <CheckCircle2 className="w-12 h-12 text-gold-400 mx-auto animate-bounce" />
                <p className="font-bold text-sm text-gold-300 font-crest">알림 예약이 정상 접수되었습니다!</p>
                <p className="text-xs text-cream-300">오픈 당일 문자 또는 이메일로 링크를 발송해 드립니다.</p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                {/* 봇 방지 허니팟 */}
                <input
                  type="text"
                  name="hp_check"
                  value={hpCheck}
                  onChange={(e) => setHpCheck(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                />

                <div>
                  <label className="block text-xs font-semibold text-gold-300 mb-1 font-typewriter">
                    연락처 또는 이메일 주소
                  </label>
                  <input
                    type="text"
                    required
                    value={contactInput}
                    onChange={(e) => {
                      setContactInput(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="010-0000-0000 또는 fellow@planet.org"
                    className="w-full bg-ivy-950/90 border border-gold-500/40 rounded-xl p-3 text-sm text-cream-100 placeholder:text-cream-400/40 focus:outline-none focus:border-gold-400 font-sans shadow-inner"
                  />
                  {validationError && (
                    <p className="text-[11px] text-red-400 mt-1.5 font-typewriter">
                      ⚠️ {validationError}
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-cream-400/70 font-classic">
                  * [개인정보 처리방침] 수집된 연락처는 2026 플래닛 연말 갈라 안내 발송 목적으로만 사용되며, 행사 종료 후 7일 이내 안전하게 영구 파기됩니다.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-bordeaux-800 to-bordeaux-900 hover:from-bordeaux-700 hover:to-bordeaux-800 text-gold-200 font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 border border-gold-400/30"
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
