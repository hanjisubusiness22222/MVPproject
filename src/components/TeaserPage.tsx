import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  Glasses, 
  Wine, 
  BookOpen, 
  Key, 
  Send, 
  CheckCircle2, 
  X,
  Scroll,
  Bookmark,
  Library,
  Volume2,
  VolumeX,
  Tag
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

  // 초대 코드 상태
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

  // Web Audio 효과음: 서재 책 넘기는 사운드 & 앤틱 오르골 차임
  const playLibrarySound = () => {
    if (isMuted) return;
    try {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContext) setAudioContext(ctx);

      const now = ctx.currentTime;
      // 책장 펄럭이는 부드러운 화이트 노이즈 버스트
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // 은은한 도서관 앤틱 벨 차임
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now + 0.1); // D5
      oscGain.gain.setValueAtTime(0.12, now + 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now + 0.1);
      osc.stop(now + 0.8);

    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // 장서 인장/표지 클릭 핸들러
  const handleOpenClick = () => {
    if (!isOpened) {
      playLibrarySound();
      setIsOpened(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#DFC27D', '#C29B38', '#872033', '#F7F3EB', '#2B4234']
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
      particleCount: 60,
      spread: 70,
      colors: ['#DFC27D', '#2B4234', '#872033']
    });

    setTimeout(() => {
      setIsNotifyModalOpen(false);
      setIsSubmitted(false);
      setContactInput('');
      setHpCheck('');
      setValidationError('');
    }, 2200);
  };

  // 초대 코드 검증
  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = secretCode.trim().toUpperCase();
    const validCodes = ['PROM', 'IVY', 'PLANET', '프롬', '새학기', '2026', '모임', '도서관'];

    if (validCodes.includes(clean)) {
      setSecretRevealed(true);
      setSecretError(false);
      playLibrarySound();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.65 },
        colors: ['#DFC27D', '#F7F3EB', '#872033', '#2B4234']
      });
    } else {
      setSecretError(true);
      setTimeout(() => setSecretError(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen bg-library-study bg-library-grid text-[#e6ded1] flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 overflow-x-hidden selection:bg-[#c29b38]/30 selection:text-[#dfc27d]">
      
      {/* 도서관 서가 뱅커스 램프 조명 느낌의 아늑한 상단 글로우 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#1e3d2c]/20 rounded-full blur-[140px] pointer-events-none"></div>

      {/* 상단 도서관 아카이브 헤더 */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-[#c29b38]/20 z-20">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg border border-[#c29b38]/40 bg-[#16231b] flex items-center justify-center text-[#dfc27d] shadow-sm">
            <Library className="w-5 h-5 text-[#dfc27d]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-sm tracking-wider text-[#dfc27d] font-bold">
                플래닛 독서학교 아카이브
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono text-[#a89980] border border-[#c29b38]/30 bg-[#1e1914]">
                EST. 2017
              </span>
            </div>
            <p className="text-[11px] text-[#9c8e7a] font-serif tracking-wide mt-0.5 flex items-center space-x-1.5">
              <span>장서 열람 및 연말 공식 회합</span>
              <span className="text-[#c29b38]/50">•</span>
              <span className="text-[#a89980]">보존서고 특별 발간</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (isMuted) playLibrarySound();
            }}
            className="p-2.5 rounded-lg border border-[#c29b38]/30 hover:border-[#dfc27d] bg-[#1a1613] text-[#dfc27d] hover:text-[#f7f3eb] transition-all text-xs flex items-center space-x-1.5"
            title={isMuted ? "서재 사운드 켜기" : "음소거"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#756a5c]" />
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#dfc27d]" />
                <span className="hidden sm:inline text-[11px] text-[#dfc27d]">서재 사운드</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 중앙 메인: 양장본 도서 / 도서관 카드 포켓 모티프 */}
      <main className="w-full max-w-3xl my-auto py-8 sm:py-10 flex flex-col items-center justify-center z-10">
        
        {/* 상단 도서관 청구기호 라벨 */}
        <div className="text-center mb-6 space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded border border-[#c29b38]/30 bg-[#161310] text-[#dfc27d] text-[11px] font-mono tracking-widest shadow-sm">
            <Tag className="w-3 h-3 text-[#c29b38]" />
            <span>청구기호 : 813.5-플2026-모임 (열람제한 : 회원전용)</span>
          </div>
          
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-[#f7f3eb] drop-shadow-sm">
            2026 플래닛 연말 모임
          </h1>
          
          <p className="font-serif italic text-base sm:text-lg text-[#bfb29e] max-w-xl mx-auto">
            「새학기의 설렘과 낭만적인 윈터 프롬 살롱」
          </p>

          <div className="text-xs font-mono text-[#a89980] tracking-widest pt-1">
            2026년 12월 19일 토요일 • 낮 12:00 개관
          </div>
        </div>

        {/* 양장본 북 커버 / 도서관 대출 포켓 컨테이너 */}
        <div className="relative w-full max-w-xl">
          
          {/* 책등 책갈피 리본 효과 */}
          <div className="absolute -top-3 right-10 w-7 h-10 bg-[#872033] rounded-t-sm shadow-md flex items-end justify-center pb-1 z-30 pointer-events-none">
            <Bookmark className="w-3.5 h-3.5 text-[#f7f3eb]" />
          </div>

          <div 
            onClick={handleOpenClick}
            className={`relative mx-auto w-full transition-all duration-500 select-none ${
              isOpened ? 'cursor-default' : 'cursor-pointer hover:translate-y-[-2px]'
            }`}
          >
            {/* 고서 양장본 클로스 커버 (다크 에메랄드 북 바인딩) */}
            <div className="relative book-cloth-cover rounded-xl p-6 sm:p-9 overflow-hidden">
              
              {/* 책등(Spine) 왼쪽 주름 음영 라인 */}
              <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none border-r border-[#c29b38]/20"></div>

              {/* 양장본 표지 금박 프레임 라인 */}
              <div className="absolute inset-3 border border-[#c29b38]/30 rounded-lg pointer-events-none"></div>

              {/* 중앙 장서인 직인 (Ex Libris Seal) */}
              <div className="relative flex flex-col items-center justify-center py-7 sm:py-9 z-20">
                <div 
                  className={`group relative transition-all duration-300 ${
                    isOpened ? 'scale-80 opacity-80' : 'hover:scale-105'
                  }`}
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full library-seal p-1 flex items-center justify-center border border-[#dfc27d]/40">
                    <div className="w-full h-full rounded-full border border-dashed border-[#dfc27d]/30 flex flex-col items-center justify-center text-center p-2">
                      <BookOpen className="w-5 h-5 text-[#dfc27d] mb-1" />
                      <span className="font-serif text-[#f7f3eb] font-bold text-sm tracking-widest">
                        藏書
                      </span>
                      <span className="text-[8px] font-mono text-[#dfc27d]/80 tracking-wider">
                        EX LIBRIS
                      </span>
                    </div>
                  </div>

                  {!isOpened && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-serif text-[#dfc27d] bg-[#14100d] px-3.5 py-1 rounded border border-[#c29b38]/40 shadow-md">
                      표지를 눌러 안내장을 펼쳐보세요
                    </div>
                  )}
                </div>
              </div>

              {/* 펼쳐졌을 때: 도서관 대출 카드(Library Checkout Card) 형태의 초대장 */}
              <div 
                className={`transition-all duration-700 overflow-hidden ${
                  isOpened 
                    ? 'max-h-[1100px] opacity-100 mt-4 pt-6 border-t border-[#c29b38]/30' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="library-card-paper rounded-lg p-6 sm:p-8 text-[#26201a] shadow-md border border-[#c29b38]/40 space-y-5 relative">
                  
                  {/* 도서관 대출카드 헤더 & 스탬프 */}
                  <div className="border-b-2 border-[#26201a]/15 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] tracking-widest text-[#7a6a57] uppercase">
                        PLANET BOOK ACADEMY • BORROWER'S INVITATION
                      </div>
                      <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#1a1511] mt-0.5">
                        친애하는 플래닛 학우 여러분께
                      </h2>
                    </div>

                    {/* 도서관 날짜 스탬프 */}
                    <div className="ex-libris-border px-3 py-1 text-center bg-[#872033]/5 rounded">
                      <div className="text-[9px] font-mono text-[#872033] font-bold">DATE DUE (회합 일자)</div>
                      <div className="font-mono text-sm text-[#872033] font-extrabold tracking-wider">2026. 12. 19</div>
                    </div>
                  </div>

                  <p className="font-serif text-xs sm:text-sm text-[#473c33] leading-relaxed">
                    한 해 동안 책을 통해 다정한 우정을 나누어 온 학우 여러분을 위해, 2026년을 기념하는 특별한 연말 모임의 장을 엽니다.
                  </p>

                  {/* 1부 & 2부 세션 안내 (도서관 인덱스 카드 서식) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* 1부 */}
                    <div className="bg-white/90 p-3.5 rounded border border-[#c29b38]/30 shadow-sm space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-[#872033] font-bold font-serif">
                        <BookOpen className="w-4 h-4 text-[#872033]" />
                        <span>1부 • 플래닛의 새학기</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#5c4f42]">
                        12:00 ~ 18:00 @ 공간나인 강남점
                      </div>
                      <p className="text-[11px] text-[#6b5d4f] leading-normal font-serif">
                        하우스 조배치, 블라인드 책 선물 교환식, 2026 명예의 전당 어워즈
                      </p>
                    </div>

                    {/* 2부 */}
                    <div className="bg-white/90 p-3.5 rounded border border-[#c29b38]/30 shadow-sm space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-[#1e3d2c] font-bold font-serif">
                        <Wine className="w-4 h-4 text-[#1e3d2c]" />
                        <span>2부 • 플래닛의 윈터 프롬</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#5c4f42]">
                        18:00 ~ LATE @ 강남 프라이빗 파티룸
                      </div>
                      <p className="text-[11px] text-[#6b5d4f] leading-normal font-serif">
                        샴페인 토스트, 베스트 드레서 현장 모바일 투표, 미드나잇 재즈 살롱
                      </p>
                    </div>
                  </div>

                  {/* 도서관 안내 사항 (드레스코드 & 도서 1권) */}
                  <div className="p-3 bg-[#e8e2d5]/60 rounded border border-[#c29b38]/20 text-[11px] text-[#473c33] space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-[#1a1511]">
                      <Glasses className="w-3.5 h-3.5 text-[#5c4f42]" />
                      <span>용의복장 및 필수 지참물:</span>
                    </div>
                    <p className="font-serif leading-relaxed">
                      • <strong>용의복장</strong>: 클래식 프레피 & 긱 시크 (블레이저, 셔츠/니트, 클래식 안경 / 야간 보타이·리본)<br />
                      • <strong>준비물</strong>: 동료 학우에게 선물할 <strong>책 1권</strong> (추천 엽서 동봉), 필기구
                    </p>
                  </div>

                  {/* CTA 버튼 */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={() => setIsNotifyModalOpen(true)}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded bg-[#872033] hover:bg-[#6e1828] text-[#f7f3eb] font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span>신청 오픈 시 사전 알림 예약</span>
                    </button>

                    {onExploreFullPage && (
                      <button
                        onClick={onExploreFullPage}
                        className="w-full sm:w-auto py-2.5 px-4 rounded border border-[#26201a]/30 hover:bg-[#26201a]/5 text-[#26201a] font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1"
                      >
                        <Scroll className="w-3.5 h-3.5 text-[#5c4f42]" />
                        <span>안내장 전문 보기</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 카운트다운 타이머 (도서관 서가 인덱스 스타일) */}
        <div className="w-full max-w-xl mt-8 p-4 rounded-xl border border-[#c29b38]/20 bg-[#16120e]/80 text-center shadow-md">
          <div className="flex items-center justify-center space-x-1.5 text-[#dfc27d] text-xs font-mono mb-3">
            <Clock className="w-3.5 h-3.5 text-[#c29b38]" />
            <span>모임 개막 카운트다운 • 2026.12.19 (토) 12:00</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-[#f7f3eb]">
            <div className="bg-[#1e1914] p-2.5 rounded border border-[#c29b38]/20">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#dfc27d] block">{timeLeft.days}</span>
              <span className="text-[10px] text-[#9c8e7a] font-serif">일 (Days)</span>
            </div>
            <div className="bg-[#1e1914] p-2.5 rounded border border-[#c29b38]/20">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#dfc27d] block">{timeLeft.hours}</span>
              <span className="text-[10px] text-[#9c8e7a] font-serif">시간 (Hrs)</span>
            </div>
            <div className="bg-[#1e1914] p-2.5 rounded border border-[#c29b38]/20">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#dfc27d] block">{timeLeft.minutes}</span>
              <span className="text-[10px] text-[#9c8e7a] font-serif">분 (Mins)</span>
            </div>
            <div className="bg-[#1e1914] p-2.5 rounded border border-[#c29b38]/20">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#dfc27d] block">{timeLeft.seconds}</span>
              <span className="text-[10px] text-[#9c8e7a] font-serif">초 (Secs)</span>
            </div>
          </div>
        </div>

        {/* 초대 코드 입력창 */}
        <div className="w-full max-w-md mt-6 text-center">
          {!secretRevealed ? (
            <form onSubmit={handleSecretSubmit} className="flex items-center justify-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="비밀 초대 코드 입력 (프롬 / 새학기 / 도서관)"
                  className="w-full bg-[#16120e] border border-[#c29b38]/30 rounded-lg py-2 px-3 text-xs text-[#dfc27d] placeholder:text-[#756a5c] font-serif focus:outline-none focus:border-[#dfc27d] text-center"
                />
                <Key className="w-3.5 h-3.5 text-[#c29b38]/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg border border-[#c29b38]/40 bg-[#2b2219] hover:bg-[#3d3023] text-[#dfc27d] text-xs font-serif transition-all"
              >
                확인
              </button>
            </form>
          ) : (
            <div className="p-3.5 rounded-lg border border-[#c29b38]/40 bg-[#1e1713] text-[#dfc27d] text-xs space-y-1 shadow-sm">
              <div className="font-serif font-bold text-[#f7f3eb]">
                📖 윈터 프롬 살롱 특별 안내
              </div>
              <p className="text-[11px] text-[#bfb29e] font-serif">
                "2부 윈터 프롬 파티에서는 가장 멋진 프레피 룩을 선보인 학우에게 특별한 기념 티아라와 선물이 수여됩니다."
              </p>
            </div>
          )}
          {secretError && (
            <p className="text-[11px] text-[#e06c75] mt-1 font-serif">
              올바른 코드를 입력해 주세요. (힌트: 프롬, 새학기, 도서관, 모임)
            </p>
          )}
        </div>

      </main>

      {/* 하단 푸터 */}
      <footer className="w-full max-w-4xl py-4 border-t border-[#c29b38]/20 text-center text-[11px] text-[#857766] font-serif space-y-1 z-20">
        <p>© 2026 플래닛 독서학교 아카이브. All Rights Reserved.</p>
        <p className="text-[#a89980] text-[10px]">책과 지성, 다정한 대화가 머무는 연말 모임</p>
      </footer>

      {/* 사전 알림 등록 모달 */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#191512] border border-[#c29b38]/40 rounded-xl p-6 text-[#f7f3eb] shadow-xl">
            <button
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-[#857766] hover:text-[#f7f3eb] p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5 mb-5">
              <div className="w-10 h-10 rounded-full border border-[#c29b38]/40 bg-[#120f0d] mx-auto flex items-center justify-center text-[#dfc27d]">
                <BookOpen className="w-5 h-5 text-[#dfc27d]" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#dfc27d]">
                사전 알림 예약 접수
              </h3>
              <p className="text-xs text-[#a89980] font-serif">
                정식 초대장과 참가 신청 폼이 열리는 즉시 가장 먼저 안내를 드립니다.
              </p>
            </div>

            {isSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#dfc27d] mx-auto" />
                <p className="font-bold text-sm text-[#dfc27d] font-serif">사전 알림 예약이 완료되었습니다!</p>
                <p className="text-xs text-[#a89980]">오픈 당일 문자 또는 이메일로 링크를 보내드립니다.</p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
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
                  <label className="block text-xs font-serif text-[#dfc27d] mb-1">
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
                    className="w-full bg-[#120f0d] border border-[#c29b38]/30 rounded p-2.5 text-sm text-[#f7f3eb] placeholder:text-[#5c4f42] focus:outline-none focus:border-[#dfc27d] font-serif"
                  />
                  {validationError && (
                    <p className="text-[11px] text-[#e06c75] mt-1 font-serif">
                      ⚠️ {validationError}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-[#857766] font-serif">
                  * [개인정보 보호] 입력하신 연락처는 2026 플래닛 연말 모임 안내 발송용으로만 사용되며, 행사 종료 후 7일 이내 안전하게 파기됩니다.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-[#872033] hover:bg-[#6e1828] text-[#f7f3eb] font-bold text-sm transition-all shadow flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>사전 알림 신청하기</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
