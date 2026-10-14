import React, { useState } from 'react';
import { 
  BookOpen, Calendar, Clock, MapPin, Sparkles, Glasses, 
  CheckCircle2, ArrowLeft, Send, ShieldCheck, Award, 
  Wine, Music, HelpCircle, Heart, Tag, Bookmark, Check,
  ChevronRight, AlertCircle, Copy, Info
} from 'lucide-react';
import { EVENT_CONFIG } from '../constants/eventConfig';
import { sanitizeText, validatePhone, formatPhone } from '../utils/validation';
import { maskPhone } from '../utils/masking';
import confetti from 'canvas-confetti';

interface OfficialInvitationProps {
  onBackToTeaser: () => void;
}

type TabType = 'letter' | 'timeline' | 'lookbook' | 'rsvp';

export const OfficialInvitation: React.FC<OfficialInvitationProps> = ({ onBackToTeaser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('letter');
  const [lookbookCategory, setLookbookCategory] = useState<'day' | 'night' | 'items'>('day');

  // RSVP Form States (성별, 신구구분, 프롬신청곡 제외)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSession, setSelectedSession] = useState<'both' | 'session1' | 'session2'>('both');
  const [bookHint, setBookHint] = useState('');
  const [note, setNote] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  const [hpCheck, setHpCheck] = useState(''); // 허니팟 봇 차단 필드

  // Status & Validation States
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedData, setConfirmedData] = useState<{
    ticketNumber: string;
    name: string;
    phone: string;
    sessionName: string;
    fee: number;
    submittedAt: string;
  } | null>(null);

  // Phone input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatPhone(raw);
    setPhone(formatted);
    if (errorMessage) setErrorMessage('');
  };

  // Form Submit Handler
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 봇 허니팟 검증
    if (hpCheck.trim() !== '') {
      return;
    }

    // 2. 이름 검증
    const cleanName = sanitizeText(name, 20);
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('성함을 올바르게 입력해 주세요. (2자 이상)');
      return;
    }

    // 3. 전화번호 검증
    if (!validatePhone(phone)) {
      setErrorMessage('올바른 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)');
      return;
    }

    // 4. 개인정보 동의 검증
    if (!privacyAgreed) {
      setErrorMessage('개인정보 수집 및 행사 안내 목적 이용에 동의해 주세요.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const s1 = selectedSession === 'both' || selectedSession === 'session1';
    const s2 = selectedSession === 'both' || selectedSession === 'session2';
    const totalFee = (s1 ? EVENT_CONFIG.session1.fee : 0) + (s2 ? EVENT_CONFIG.session2.fee : 0);
    const sessionLabel = 
      selectedSession === 'both' 
        ? '1부(새학기 세미나) + 2부(윈터 프롬) 전체 참석' 
        : selectedSession === 'session1' 
          ? '1부(새학기 세미나) 참석' 
          : '2부(윈터 프롬) 참석';

    const ticketNumber = `PLN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      action: 'register',
      hp_check: hpCheck,
      name: cleanName,
      phone: phone.replace(/[^0-9]/g, ''),
      session1: s1,
      session2: s2,
      bookHint: sanitizeText(bookHint, 100),
      note: sanitizeText(note, 200),
      // 성별/신구구분/신청곡은 사용자 요청에 따라 폼에서 받지 않으므로 백엔드 기본값 처리
      gender: '',
      fellowType: '',
      promSong: ''
    };

    try {
      // GAS 엔드포인트 전송 시도
      if (EVENT_CONFIG.googleScriptUrl && EVENT_CONFIG.googleScriptUrl !== 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
        await fetch(EVENT_CONFIG.googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // 로컬 스토리지에 신청 백업 기록 (오프라인 지원 및 영수증 유지)
      const existingRsvps = JSON.parse(localStorage.getItem('planet_rsvps') || '[]');
      existingRsvps.push({
        ticketNumber,
        ...payload,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('planet_rsvps', JSON.stringify(existingRsvps));

      // 성공 축포
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#c29b38', '#dfc27d', '#872033', '#ffffff']
      });

      setConfirmedData({
        ticketNumber,
        name: cleanName,
        phone: maskPhone(phone),
        sessionName: sessionLabel,
        fee: totalFee,
        submittedAt: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

    } catch (err) {
      console.error(err);
      setErrorMessage('접수 처리 중 일시적인 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#120f0d] text-[#f7f3eb] font-sans selection:bg-[#c29b38]/30 selection:text-[#dfc27d]">
      
      {/* 상단 엠블럼 및 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-[#16120e]/95 backdrop-blur-md border-b border-[#c29b38]/20 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* 좌측: 티저로 돌아가기 & 아카데미 심볼 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToTeaser}
              className="p-1.5 rounded-lg border border-[#c29b38]/30 bg-[#1f1914] hover:bg-[#2e241c] text-[#dfc27d] transition-colors flex items-center space-x-1 text-xs font-serif"
              title="티저 화면으로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">서재(티저)</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded border border-[#c29b38]/40 bg-[#1b2920] flex items-center justify-center text-[#dfc27d] font-serif font-bold text-xs shadow-inner">
                PA
              </div>
              <div>
                <div className="text-xs font-serif font-bold text-[#f7f3eb] tracking-wide">
                  플래닛 북 아카데미
                </div>
                <div className="text-[10px] text-[#a89980] font-mono">
                  2026 연말 모임 공식 안내장
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 탭 네비게이션 (데스크탑) */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {[
              { id: 'letter', label: '공식 서간문' },
              { id: 'timeline', label: '프로그램 안내' },
              { id: 'lookbook', label: '긱 시크 룩북' },
              { id: 'rsvp', label: '참가 신청(RSVP)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-2.5 py-1.5 rounded text-xs font-serif transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#872033] text-[#f7f3eb] font-bold shadow-sm'
                    : 'text-[#bfb29e] hover:text-[#dfc27d] hover:bg-[#1f1914]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 중앙 메인 컨텐츠 영역 */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        {/* ========================================================= */}
        {/* TAB 1: 아카데미 공식 서간문 (The Official Academic Letter) */}
        {/* ========================================================= */}
        {activeTab === 'letter' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 서간문 내지 카드 (옥스포드 크림지 / 도서관 아카이브 서신 양식) */}
            <div className="relative library-card-paper p-6 sm:p-12 rounded-xl text-[#2b2219] shadow-xl border border-[#c29b38]/40 overflow-hidden">
              
              {/* 배경 워터마크 엠블럼 */}
              <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none">
                <BookOpen className="w-72 h-72 text-[#1b2920]" />
              </div>

              {/* 서신 헤더: 아카데미 레터헤드 */}
              <div className="border-b-2 border-[#2b2219]/20 pb-6 mb-8 text-center space-y-2">
                <div className="inline-flex items-center space-x-2 text-[11px] font-mono tracking-widest text-[#872033] font-bold uppercase">
                  <span>PLANET BOOK ACADEMY ARCHIVE • EST. 2017</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1a1511]">
                  2026 플래닛 연말 모임 공식 초청장
                </h1>
                <p className="font-serif italic text-xs sm:text-sm text-[#5c4f42]">
                  「플래닛의 새학기 (The New Semester) & 윈터 프롬 살롱 (The Winter Prom)」
                </p>
                <div className="text-[11px] font-mono text-[#756a5c] pt-1">
                  발신: 플래닛 북 아카데미 운영진 일동 • 수신: 친애하는 플래닛 학우 전원
                </div>
              </div>

              {/* 본문 서간문 */}
              <div className="font-serif text-sm sm:text-base leading-relaxed space-y-5 text-[#382e25]">
                <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-[#872033] first-letter:float-left first-letter:mr-2">
                  친애하는 플래닛 학우 여러분께,
                </p>
                <p>
                  2017년 작은 책방 한편에서 책과 문장을 아끼는 마음으로 닻을 올렸던 플래닛 북 아카데미가 
                  어느덧 열 번째 겨울을 맞이하며 <strong>2026년의 새로운 챕터</strong>를 준비하고 있습니다.
                </p>
                <p>
                  올 한 해 동안 우리는 계절마다 새로운 책장을 넘기며 시대의 지성을 마주했고, 
                  때로는 밤이 깊도록 이어진 토론 속에서 서로의 생각에 따뜻한 온기와 영감을 불어넣었습니다. 
                  우리가 함께 나눈 문장들은 저마다의 삶에 깊은 사유의 뿌리를 내렸습니다.
                </p>
                <p>
                  이에 2026년의 끝자락에서 한 해 동안 함께 지적 여정을 완주한 학우 여러분을 모시고, 
                  낮에는 학술적 영감과 책 선물을 나누는 <strong>1부 [플래닛의 새학기]</strong>, 
                  밤에는 클래식한 음악과 샴페인 잔을 부딪치며 낭만을 나누는 <strong>2부 [플래닛의 윈터 프롬]</strong>을 마련하였습니다.
                </p>
                <p>
                  서로의 다정한 책갈피가 되어주었던 동료 학우들과 마주 앉아 
                  올해의 책을 선물하고 다정한 건배를 나눌 수 있기를 고대합니다.
                </p>
              </div>

              {/* 행사 기본 요약 박스 */}
              <div className="my-8 p-4 sm:p-6 rounded-lg border border-[#c29b38]/30 bg-white/60 space-y-3 font-serif">
                <div className="font-bold text-sm text-[#1a1511] flex items-center space-x-1.5 border-b border-[#2b2219]/10 pb-2">
                  <Calendar className="w-4 h-4 text-[#872033]" />
                  <span>회합 개요 (Event Brief)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#473c33]">
                  <div>
                    <span className="font-bold text-[#1a1511]">일시:</span> 2026년 12월 19일 (토요일) 낮 12:00 ~ 심야
                  </div>
                  <div>
                    <span className="font-bold text-[#1a1511]">1부 장소:</span> 공간나인 강남점 (12:00 ~ 18:00)
                  </div>
                  <div>
                    <span className="font-bold text-[#1a1511]">2부 장소:</span> 강남 프라이빗 파티룸 (18:00 ~ LATE)
                  </div>
                  <div>
                    <span className="font-bold text-[#1a1511]">드레스코드:</span> 클래식 프레피 & 긱 시크
                  </div>
                </div>
              </div>

              {/* 서신 하단: 서명 및 장서인 */}
              <div className="pt-6 border-t border-[#2b2219]/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-serif">
                <div className="text-xs text-[#6e5f50] italic">
                  "Ex Libris, Ad Astra — 책 속에서, 별을 향하여"
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xs font-mono text-[#857766]">Planet Book Academy</div>
                    <div className="font-bold text-sm text-[#1a1511]">운영위원회 및 펠로우 일동</div>
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#872033]/60 flex items-center justify-center text-[#872033] font-mono text-[10px] font-bold text-center rotate-[-12deg] select-none">
                    공식<br />인장
                  </div>
                </div>
              </div>

            </div>

            {/* 하단 이동 버튼 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('timeline')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#c29b38]/40 bg-[#1f1914] hover:bg-[#2b2219] text-[#dfc27d] font-serif text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <span>상세 프로그램 일정 보기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('rsvp')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#872033] hover:bg-[#6e1828] text-[#f7f3eb] font-serif text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <Bookmark className="w-4 h-4 text-[#dfc27d]" />
                <span>지금 참가 신청하기 (RSVP)</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 프로그램 안내 (1부 세미나 & 2부 윈터 프롬 상세 안내) */}
        {/* ========================================================= */}
        {activeTab === 'timeline' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 세션 개요 타이틀 */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-[#c29b38]/30 bg-[#16120e] text-[#dfc27d] text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-[#c29b38]" />
                <span>FULL TIMELINE & SESSIONS</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#f7f3eb]">
                2026 연말 모임 프로그램 일정
              </h2>
              <p className="font-serif text-xs sm:text-sm text-[#bfb29e] max-w-xl mx-auto">
                낮에는 지적 향연과 책 선물의 따스함이, 밤에는 음악과 샴페인의 설렘이 펼쳐집니다.
              </p>
            </div>

            {/* 1부 & 2부 상세 카드 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 1부: 플래닛의 새학기 (Academic Session) */}
              <div className="p-6 rounded-xl border border-[#c29b38]/30 bg-[#181e18] shadow-lg space-y-5">
                <div className="border-b border-[#c29b38]/20 pb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#a89980] mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#1b2920] text-[#dfc27d] border border-[#c29b38]/30 font-bold">
                      1부 • 낮 세션
                    </span>
                    <span>12:00 ~ 18:00 (6시간)</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#dfc27d] mt-2">
                    플래닛의 새학기 (The New Semester)
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-[#bfb29e] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#c29b38]" />
                    <span>공간나인 강남점 (정원 35명)</span>
                  </div>
                </div>

                {/* 1부 타임라인 리스트 */}
                <div className="space-y-4 text-xs font-serif">
                  <div className="flex items-start space-x-3 p-3 rounded bg-[#121612]/70 border border-[#c29b38]/15">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">12:00 ~ 12:30</div>
                    <div>
                      <div className="font-bold text-[#f7f3eb]">등교 및 하우스 조배치 리셉션</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        도착 순서대로 웰컴 드링크와 이름표 수령, 2026 연말 기념 북마크 배부
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded bg-[#121612]/70 border border-[#c29b38]/15">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">12:30 ~ 14:00</div>
                    <div>
                      <div className="font-bold text-[#f7f3eb]">2026 아카데미 학술 세미나 & 북 스피치</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        올 한 해 함께 탐독한 24권의 서적 회고, 학우별 '올해의 인생 문장' 1분 릴레이 스피치
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded bg-[#121612]/70 border border-[#c29b38]/15">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">14:00 ~ 16:30</div>
                    <div>
                      <div className="font-bold text-[#dfc27d]">블라인드 북 익스체인지 (책 선물 교환)</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        학우들이 정성스레 포장해 온 책과 추천 엽서를 무작위로 교환하는 감동의 메인 이벤트
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded bg-[#121612]/70 border border-[#c29b38]/15">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">16:30 ~ 18:00</div>
                    <div>
                      <div className="font-bold text-[#f7f3eb]">2026 명예의 전당 어워즈 & 수료식</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        최다 발제상, 최다 참석상, 다정한 학우상 시상 및 단체 기념 촬영
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#1b2920]/40 border border-[#c29b38]/20 text-[11px] text-[#dfc27d] flex items-center justify-between">
                  <span>참가 회비: 45,000원 (대관료, 다과, 기념 굿즈 포함)</span>
                  <Award className="w-4 h-4 text-[#c29b38]" />
                </div>
              </div>

              {/* 2부: 플래닛의 윈터 프롬 (After Prom & Night Salon) */}
              <div className="p-6 rounded-xl border border-[#872033]/40 bg-[#1f1316] shadow-lg space-y-5">
                <div className="border-b border-[#872033]/30 pb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#bfb29e] mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#3b0b17] text-[#dfc27d] border border-[#872033]/50 font-bold">
                      2부 • 밤 세션
                    </span>
                    <span>18:00 ~ LATE (자유 해산)</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#dfc27d] mt-2">
                    플래닛의 윈터 프롬 (The Winter Prom)
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-[#bfb29e] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#dfc27d]" />
                    <span>강남 프라이빗 파티룸 (정원 25명)</span>
                  </div>
                </div>

                {/* 2부 타임라인 리스트 */}
                <div className="space-y-4 text-xs font-serif">
                  <div className="flex items-start space-x-3 p-3 rounded bg-[#170c0e]/80 border border-[#872033]/20">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">18:00 ~ 19:00</div>
                    <div>
                      <div className="font-bold text-[#f7f3eb]">웰컴 샴페인 토스트 & 프롬 포토월</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        윈터 프롬 포토존 즉석 사진 촬영, 웰컴 스파클링 와인 / 무알콜 칵테일 토스트
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded bg-[#170c0e]/80 border border-[#872033]/20">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">19:00 ~ 20:30</div>
                    <div>
                      <div className="font-bold text-[#f7f3eb]">윈터 살롱 디너 & 테이블 토크</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        케이터링 핑거푸드, 와인과 함께 편안하게 이어지는 자유로운 친교 시간
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded bg-[#170c0e]/80 border border-[#872033]/20">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">20:30 ~ 21:30</div>
                    <div>
                      <div className="font-bold text-[#dfc27d]">베스트 드레서(Prom King & Queen) 모바일 투표</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        학우들이 직접 스마트폰으로 투표하는 실시간 어워즈, 기념 티아라 및 스페셜 기프트 증정
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded bg-[#170c0e]/80 border border-[#872033]/20">
                    <div className="font-mono text-[#dfc27d] font-bold min-w-[75px]">21:30 ~ LATE</div>
                    <div>
                      <div className="font-bold text-[#f7f3eb]">미드나잇 재즈 살롱 & 심야 북토크</div>
                      <p className="text-[#a89980] text-[11px] mt-0.5">
                        잔잔한 재즈 선율과 함께하는 심야 독서 및 자유로운 심야 네트워킹
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#3b0b17]/50 border border-[#872033]/30 text-[11px] text-[#dfc27d] flex items-center justify-between">
                  <span>참가 회비: 35,000원 (파티룸 대관, 와인/음료, 핑거푸드 포함)</span>
                  <Wine className="w-4 h-4 text-[#dfc27d]" />
                </div>
              </div>

            </div>

            {/* 하단 네비게이션 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setActiveTab('lookbook')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#c29b38]/40 bg-[#1f1914] hover:bg-[#2b2219] text-[#dfc27d] font-serif text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <Glasses className="w-4 h-4" />
                <span>드레스코드: 긱 시크 룩북 가이드</span>
              </button>
              <button
                onClick={() => setActiveTab('rsvp')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#872033] hover:bg-[#6e1828] text-[#f7f3eb] font-serif text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <Bookmark className="w-4 h-4 text-[#dfc27d]" />
                <span>참가 신청하러 가기 (RSVP)</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 긱 시크 룩북 가이드 (Geek Chic Lookbook)             */}
        {/* ========================================================= */}
        {activeTab === 'lookbook' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 룩북 헤더 */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-[#c29b38]/30 bg-[#16120e] text-[#dfc27d] text-xs font-mono">
                <Glasses className="w-3.5 h-3.5 text-[#c29b38]" />
                <span>STYLE & DRESS CODE ARCHIVE</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#f7f3eb]">
                클래식 프레피 & 긱 시크 룩북
              </h2>
              <p className="font-serif text-xs sm:text-sm text-[#bfb29e] max-w-xl mx-auto">
                과하지 않은 단정함 속에 지적인 디테일을 담은 2026 연말 모임 스타일링 가이드입니다.
              </p>
            </div>

            {/* 카테고리 셀렉터 버튼 */}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setLookbookCategory('day')}
                className={`px-4 py-2 rounded-lg text-xs font-serif font-bold transition-all ${
                  lookbookCategory === 'day'
                    ? 'bg-[#1b2920] border border-[#c29b38]/60 text-[#dfc27d] shadow-md'
                    : 'bg-[#16120e] border border-[#c29b38]/20 text-[#a89980] hover:text-[#f7f3eb]'
                }`}
              >
                주간 세미나 룩 (Day Preppy)
              </button>
              <button
                onClick={() => setLookbookCategory('night')}
                className={`px-4 py-2 rounded-lg text-xs font-serif font-bold transition-all ${
                  lookbookCategory === 'night'
                    ? 'bg-[#3b0b17] border border-[#872033] text-[#dfc27d] shadow-md'
                    : 'bg-[#16120e] border border-[#c29b38]/20 text-[#a89980] hover:text-[#f7f3eb]'
                }`}
              >
                야간 윈터 프롬 룩 (Night Prom)
              </button>
              <button
                onClick={() => setLookbookCategory('items')}
                className={`px-4 py-2 rounded-lg text-xs font-serif font-bold transition-all ${
                  lookbookCategory === 'items'
                    ? 'bg-[#2b2219] border border-[#c29b38] text-[#dfc27d] shadow-md'
                    : 'bg-[#16120e] border border-[#c29b38]/20 text-[#a89980] hover:text-[#f7f3eb]'
                }`}
              >
                긱 시크 필수 소품 (Key Items)
              </button>
            </div>

            {/* 카테고리 1: 주간 프레피 룩 */}
            {lookbookCategory === 'day' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="p-6 rounded-xl border border-[#c29b38]/30 bg-[#161310] space-y-4">
                  <div className="flex items-center space-x-2 text-[#dfc27d] font-bold text-base font-serif">
                    <Bookmark className="w-4 h-4 text-[#c29b38]" />
                    <span>정통 아카데믹 블레이저 룩</span>
                  </div>
                  <p className="text-xs text-[#bfb29e] font-serif leading-relaxed">
                    네이비, 다크 브라운, 딥 포레스트 그린 컬러의 블레이저와 화이트/블루 옥스포드 셔츠의 조합은 
                    아카데미 회합의 가장 기품 있는 기본입니다.
                  </p>
                  <ul className="space-y-2 text-xs font-serif text-[#a89980]">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>추천 아우터:</strong> 네이비 금장 블레이저, 트위드 재킷</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>추천 이너:</strong> 옥스포드 버튼다운 셔츠, 타탄 체크 셔츠</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>추천 하의:</strong> 치노 팬츠, 플리츠 울 스커트, 슬랙스</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border border-[#c29b38]/30 bg-[#161310] space-y-4">
                  <div className="flex items-center space-x-2 text-[#dfc27d] font-bold text-base font-serif">
                    <Bookmark className="w-4 h-4 text-[#c29b38]" />
                    <span>케이블 니트 & 베스트 레이어링</span>
                  </div>
                  <p className="text-xs text-[#bfb29e] font-serif leading-relaxed">
                    도서관 서가의 아늑한 정취를 풍기는 굵은 짜임의 케이블 니트나 아가일 베스트는 
                    편안하면서도 지적인 프레피 무드를 완성합니다.
                  </p>
                  <ul className="space-y-2 text-xs font-serif text-[#a89980]">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>추천 니트:</strong> 아이보리/버건디 케이블 니트 베스트, 가디건</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>액센트:</strong> 레지멘탈 타이 또는 가느다란 실크 스카프</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>신발:</strong> 가죽 페니 로퍼, 태슬 로퍼, 옥스포드화</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 카테고리 2: 야간 윈터 프롬 룩 */}
            {lookbookCategory === 'night' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="p-6 rounded-xl border border-[#872033]/40 bg-[#1a1114] space-y-4">
                  <div className="flex items-center space-x-2 text-[#dfc27d] font-bold text-base font-serif">
                    <Wine className="w-4 h-4 text-[#872033]" />
                    <span>주간 룩에 이브닝 트위스트 추가하기</span>
                  </div>
                  <p className="text-xs text-[#bfb29e] font-serif leading-relaxed">
                    낮 동안 입었던 단정한 프레피 복장에 작은 소품 하나만 더해도 
                    로맨틱한 윈터 프롬 파티 룩으로 즉시 변신할 수 있습니다. 옷을 전부 갈아입을 필요가 없습니다.
                  </p>
                  <ul className="space-y-2 text-xs font-serif text-[#a89980]">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>타이 변형:</strong> 일반 넥타이 ➔ 블랙/와인 벨벳 보타이로 교체</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>라펠 장식:</strong> 블레이저 깃에 작은 부토니에 꽃 또는 앤틱 브로치</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#dfc27d]" />
                      <span><strong>헤어 & 넥:</strong> 블랙 벨벳 리본 헤어핀, 진주 초커 또는 골드 네크리스</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border border-[#872033]/40 bg-[#1a1114] space-y-4">
                  <div className="flex items-center space-x-2 text-[#dfc27d] font-bold text-base font-serif">
                    <Sparkles className="w-4 h-4 text-[#c29b38]" />
                    <span>베스트 드레서 심사 기준 팁</span>
                  </div>
                  <p className="text-xs text-[#bfb29e] font-serif leading-relaxed">
                    2부 현장 실시간 모바일 투표로 선정되는 '올해의 Prom King & Queen'은 
                    가장 비싼 옷이 아닌, <strong>'지적인 품격과 위트 있는 소품의 조화'</strong>를 갖춘 학우에게 주어집니다.
                  </p>
                  <div className="p-3 bg-[#24151a] rounded border border-[#872033]/30 text-xs text-[#dfc27d] font-serif">
                    👑 우승자에게는 공식 기념 티아라와 명예 트로피, 그리고 고급 도서 상품권이 수여됩니다.
                  </div>
                </div>
              </div>
            )}

            {/* 카테고리 3: 긱 시크 필수 소품 */}
            {lookbookCategory === 'items' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                <div className="p-5 rounded-xl border border-[#c29b38]/30 bg-[#16120e] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border border-[#c29b38]/30 bg-[#1e1713] mx-auto flex items-center justify-center text-[#dfc27d]">
                    <Glasses className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#f7f3eb]">클래식 뿔테 & 오벌 안경</h4>
                  <p className="text-xs text-[#a89980] font-serif leading-relaxed">
                    블랙/톨토이즈 셸 두꺼운 아세테이트 뿔테, 혹은 섬세한 골드 오벌 프레임 안경으로 완성하는 긱 시크의 정수.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-[#c29b38]/30 bg-[#16120e] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border border-[#c29b38]/30 bg-[#1e1713] mx-auto flex items-center justify-center text-[#dfc27d]">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#f7f3eb]">선물 도서 1권 & 만년필</h4>
                  <p className="text-xs text-[#a89980] font-serif leading-relaxed">
                    동료 학우에게 선물할 포장된 책 한 권과 손편지 엽서. 상의 포켓에 꽂힌 만년필 한 자루.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-[#c29b38]/30 bg-[#16120e] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border border-[#c29b38]/30 bg-[#1e1713] mx-auto flex items-center justify-center text-[#dfc27d]">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#f7f3eb]">아가일 삭스 & 로퍼</h4>
                  <p className="text-xs text-[#a89980] font-serif leading-relaxed">
                    발목 사이로 살짝 드러나는 클래식 아가일/스트라이프 양말과 은은하게 길들여진 가죽 로퍼.
                  </p>
                </div>
              </div>
            )}

            {/* 주의사항 박스 */}
            <div className="p-4 rounded-xl border border-[#c29b38]/20 bg-[#16120e] text-xs font-serif text-[#a89980] space-y-1">
              <div className="flex items-center space-x-1.5 text-[#dfc27d] font-bold">
                <Info className="w-3.5 h-3.5 text-[#c29b38]" />
                <span>드레스코드 권장 및 안내</span>
              </div>
              <p>
                * 너무 과한 정장 턱시도나 스포츠 트레이닝복, 등산복 등은 학술 모임의 성격상 지양해 주시길 부탁드립니다.<br />
                * 소장하고 계신 편안한 셔츠나 니트에 뿔테 안경 하나만 착용하셔도 충분히 멋진 긱 시크가 완성됩니다.
              </p>
            </div>

            {/* 참가 신청 이동 버튼 */}
            <div className="text-center pt-2">
              <button
                onClick={() => setActiveTab('rsvp')}
                className="px-8 py-3 rounded-lg bg-[#872033] hover:bg-[#6e1828] text-[#f7f3eb] font-serif text-sm font-bold inline-flex items-center space-x-2 transition-all shadow-md"
              >
                <Bookmark className="w-4 h-4 text-[#dfc27d]" />
                <span>참가 신청서 작성하기 (RSVP)</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RSVP 참가 신청 폼 (성별/신구/신청곡 제외, 필수 항목 반영) */}
        {/* ========================================================= */}
        {activeTab === 'rsvp' && (
          <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
            
            {/* 폼 헤더 */}
            <div className="text-center space-y-2 mb-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-[#c29b38]/30 bg-[#16120e] text-[#dfc27d] text-xs font-mono">
                <Bookmark className="w-3.5 h-3.5 text-[#c29b38]" />
                <span>OFFICIAL REGISTRATION (RSVP)</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#f7f3eb]">
                2026 플래닛 연말 모임 참가 신청
              </h2>
              <p className="font-serif text-xs sm:text-sm text-[#bfb29e]">
                좌석 정원이 한정되어 있으므로 신청 순서에 따라 조기 마감될 수 있습니다.
              </p>
            </div>

            {/* 신청서 카드 본체 */}
            <div className="p-6 sm:p-8 rounded-xl border border-[#c29b38]/40 bg-[#181411] shadow-2xl space-y-6">
              
              <form onSubmit={handleRsvpSubmit} className="space-y-6">
                
                {/* [보안 봇 방지] 허니팟 숨김 필드 */}
                <input
                  type="text"
                  name="hp_check"
                  value={hpCheck}
                  onChange={(e) => setHpCheck(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                />

                {/* 1. 성함 (이름) */}
                <div>
                  <label className="block text-xs font-serif font-bold text-[#dfc27d] mb-1.5">
                    성함 (이름) <span className="text-[#872033] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="실명을 입력해 주세요 (예: 김플래닛)"
                    className="w-full bg-[#120f0d] border border-[#c29b38]/30 rounded-lg p-3 text-sm text-[#f7f3eb] placeholder:text-[#6e5f50] font-serif focus:outline-none focus:border-[#dfc27d]"
                  />
                  <p className="text-[10px] text-[#857766] mt-1 font-serif">
                    * 행사 당일 명찰 제작 및 좌석 배치에 사용됩니다.
                  </p>
                </div>

                {/* 2. 전화번호 (연락처) */}
                <div>
                  <label className="block text-xs font-serif font-bold text-[#dfc27d] mb-1.5">
                    휴대폰 번호 <span className="text-[#872033] font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={13}
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    className="w-full bg-[#120f0d] border border-[#c29b38]/30 rounded-lg p-3 text-sm text-[#f7f3eb] placeholder:text-[#6e5f50] font-mono focus:outline-none focus:border-[#dfc27d]"
                  />
                  <p className="text-[10px] text-[#857766] mt-1 font-serif">
                    * 안내 문자 및 참가 확정 티켓 발송용으로만 사용됩니다.
                  </p>
                </div>

                {/* 3. 참석 세션 선택 (1부 / 2부 / 전체) */}
                <div>
                  <label className="block text-xs font-serif font-bold text-[#dfc27d] mb-2">
                    참석 세션 선택 <span className="text-[#872033] font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* 전체 참석 */}
                    <div 
                      onClick={() => setSelectedSession('both')}
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left flex flex-col justify-between ${
                        selectedSession === 'both'
                          ? 'border-[#c29b38] bg-[#2b2219] shadow-md ring-1 ring-[#c29b38]'
                          : 'border-[#c29b38]/20 bg-[#14100d] hover:border-[#c29b38]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif font-bold text-xs text-[#f7f3eb]">1부 + 2부 전체</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedSession === 'both' ? 'border-[#dfc27d] bg-[#dfc27d]' : 'border-[#6e5f50]'
                        }`}>
                          {selectedSession === 'both' && <Check className="w-3 h-3 text-[#120f0d]" />}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#bfb29e] font-serif">
                        세미나 & 윈터 프롬
                      </div>
                      <div className="text-xs font-mono font-bold text-[#dfc27d] mt-2">
                        80,000원
                      </div>
                    </div>

                    {/* 1부만 참석 */}
                    <div 
                      onClick={() => setSelectedSession('session1')}
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left flex flex-col justify-between ${
                        selectedSession === 'session1'
                          ? 'border-[#c29b38] bg-[#2b2219] shadow-md ring-1 ring-[#c29b38]'
                          : 'border-[#c29b38]/20 bg-[#14100d] hover:border-[#c29b38]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif font-bold text-xs text-[#f7f3eb]">1부만 참석</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedSession === 'session1' ? 'border-[#dfc27d] bg-[#dfc27d]' : 'border-[#6e5f50]'
                        }`}>
                          {selectedSession === 'session1' && <Check className="w-3 h-3 text-[#120f0d]" />}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#bfb29e] font-serif">
                        새학기 세미나 (낮)
                      </div>
                      <div className="text-xs font-mono font-bold text-[#dfc27d] mt-2">
                        45,000원
                      </div>
                    </div>

                    {/* 2부만 참석 */}
                    <div 
                      onClick={() => setSelectedSession('session2')}
                      className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left flex flex-col justify-between ${
                        selectedSession === 'session2'
                          ? 'border-[#c29b38] bg-[#2b2219] shadow-md ring-1 ring-[#c29b38]'
                          : 'border-[#c29b38]/20 bg-[#14100d] hover:border-[#c29b38]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif font-bold text-xs text-[#f7f3eb]">2부만 참석</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedSession === 'session2' ? 'border-[#dfc27d] bg-[#dfc27d]' : 'border-[#6e5f50]'
                        }`}>
                          {selectedSession === 'session2' && <Check className="w-3 h-3 text-[#120f0d]" />}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#bfb29e] font-serif">
                        윈터 프롬 살롱 (밤)
                      </div>
                      <div className="text-xs font-mono font-bold text-[#dfc27d] mt-2">
                        35,000원
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. 선물할 책 제목 또는 추천 힌트 (선택사항) */}
                <div>
                  <label className="block text-xs font-serif font-bold text-[#dfc27d] mb-1.5">
                    선물할 도서 제목 또는 힌트 <span className="text-[#857766] font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={bookHint}
                    onChange={(e) => setBookHint(e.target.value)}
                    placeholder="예: 삶의 쉼표가 되어준 소설 1권 (비공개 가능)"
                    className="w-full bg-[#120f0d] border border-[#c29b38]/30 rounded-lg p-3 text-sm text-[#f7f3eb] placeholder:text-[#6e5f50] font-serif focus:outline-none focus:border-[#dfc27d]"
                  />
                  <p className="text-[10px] text-[#857766] mt-1 font-serif">
                    * 아직 미정이시라면 공란으로 남겨두셔도 괜찮습니다.
                  </p>
                </div>

                {/* 5. 운영진에게 남기는 메모 (선택사항) */}
                <div>
                  <label className="block text-xs font-serif font-bold text-[#dfc27d] mb-1.5">
                    운영진에게 남기는 메모 / 건의사항 <span className="text-[#857766] font-normal">(선택)</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={100}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="못 드시는 음식(알레르기)이나 전하고 싶은 다정한 말을 적어주세요."
                    className="w-full bg-[#120f0d] border border-[#c29b38]/30 rounded-lg p-3 text-sm text-[#f7f3eb] placeholder:text-[#6e5f50] font-serif focus:outline-none focus:border-[#dfc27d] resize-none"
                  />
                </div>

                {/* 에러 메시지 표시 */}
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-[#3b0b17]/80 border border-[#872033] text-xs font-serif text-[#f7f3eb] flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-[#e06c75] flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 개인정보 처리 동의 */}
                <div className="pt-2 border-t border-[#c29b38]/20">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-[#c29b38]/40 bg-[#120f0d] text-[#872033] focus:ring-0"
                    />
                    <span className="text-[11px] font-serif text-[#a89980] leading-snug">
                      [필수] 연말 모임 참가 확인 및 공지 발송을 위한 개인정보(성함, 연락처) 수집에 동의합니다. 
                      (수집된 정보는 행사 종료 후 7일 이내에 영구 파기됩니다.)
                    </span>
                  </label>
                </div>

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-[#872033] hover:bg-[#6e1828] text-[#f7f3eb] font-serif font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>참가 신청 접수 중...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#dfc27d]" />
                      <span>2026 연말 모임 참가 신청서 제출하기</span>
                    </>
                  )}
                </button>

              </form>

            </div>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 신청 완료 영수증 / 참가 확인증 모달 (Admission Ticket)      */}
      {/* ========================================================= */}
      {confirmedData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md library-card-paper p-6 sm:p-8 rounded-xl text-[#2b2219] shadow-2xl border-2 border-[#c29b38]/60 space-y-5 animate-scaleUp">
            
            {/* 상단 스탬프 헤더 */}
            <div className="text-center space-y-1.5 border-b-2 border-dashed border-[#872033]/30 pb-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#872033] bg-white mx-auto flex items-center justify-center text-[#872033]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-mono text-[10px] text-[#872033] font-extrabold tracking-widest uppercase">
                OFFICIAL ADMISSION CONFIRMATION
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1a1511]">
                참가 신청이 정상 접수되었습니다
              </h3>
              <p className="font-serif text-xs text-[#5c4f42]">
                플래닛 북 아카데미 2026 연말 모임에 함께해 주셔서 감사합니다.
              </p>
            </div>

            {/* 티켓 세부 정보 */}
            <div className="p-4 rounded-lg bg-white/80 border border-[#c29b38]/30 space-y-2 text-xs font-serif">
              <div className="flex justify-between py-1 border-b border-[#2b2219]/10">
                <span className="text-[#6e5f50]">접수 번호:</span>
                <span className="font-mono font-bold text-[#872033]">{confirmedData.ticketNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2b2219]/10">
                <span className="text-[#6e5f50]">신청자 성함:</span>
                <span className="font-bold text-[#1a1511]">{confirmedData.name} 학우</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2b2219]/10">
                <span className="text-[#6e5f50]">연락처 (안내용):</span>
                <span className="font-mono text-[#1a1511]">{confirmedData.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2b2219]/10">
                <span className="text-[#6e5f50]">참석 세션:</span>
                <span className="font-bold text-[#1a1511]">{confirmedData.sessionName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2b2219]/10">
                <span className="text-[#6e5f50]">회비 안내:</span>
                <span className="font-mono font-bold text-[#872033]">
                  {confirmedData.fee.toLocaleString()}원 (입금 대기)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6e5f50]">접수 일자:</span>
                <span className="font-mono text-[#6e5f50]">{confirmedData.submittedAt}</span>
              </div>
            </div>

            {/* 입금 계좌 안내 및 주의사항 */}
            <div className="p-3 bg-[#872033]/5 rounded border border-[#872033]/20 text-[11px] font-serif text-[#473c33] space-y-1">
              <div className="font-bold text-[#872033]">📌 향후 안내 사항</div>
              <p>
                * 최종 확정 및 회비 입금 안내 문자가 신청하신 연락처로 개별 발송됩니다.<br />
                * 1부 참석 시 <strong>책 1권</strong>(선물 포장 및 추천사)을 잊지 말고 지참해 주세요.
              </p>
            </div>

            {/* 닫기 버튼 */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setConfirmedData(null)}
                className="w-full py-2.5 rounded bg-[#1a1511] hover:bg-[#2e2620] text-[#f7f3eb] font-serif font-bold text-xs transition-all shadow"
              >
                확인증 닫기
              </button>
              <button
                onClick={onBackToTeaser}
                className="w-full py-2.5 rounded border border-[#c29b38]/40 bg-white hover:bg-cream-100 text-[#2b2219] font-serif font-bold text-xs transition-all shadow"
              >
                서재 메인으로 가기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 하단 푸터 */}
      <footer className="mt-16 py-8 border-t border-[#c29b38]/20 text-center text-xs text-[#857766] font-serif space-y-1">
        <p>© 2026 플래닛 북 아카데미 (PLANET Book Academy). All Rights Reserved.</p>
        <p className="text-[10px] text-[#6e5f50]">
          책과 지성, 다정한 대화가 머무는 2026 연말 모임
        </p>
      </footer>

    </div>
  );
};
