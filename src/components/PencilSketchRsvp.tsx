import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { 
  Download, Shuffle, Eraser, 
  Scissors, AlertCircle, Copy, CheckCircle2,
  Search, Loader2, Inbox, RefreshCw
} from 'lucide-react';
import { STAGES } from './pencilData';
import { EVENT_CONFIG } from '../constants/eventConfig';
import { sanitizeText, validatePhone, formatPhone } from '../utils/validation';
import { maskPhone } from '../utils/masking';

interface PencilSketchRsvpProps {
  onSuccess?: () => void;
}

interface ValidationErrorInfo {
  reason: string;
  action: string;
}

export const PencilSketchRsvp: React.FC<PencilSketchRsvpProps> = ({ onSuccess }) => {
  // 6단계 인덱스: [얼굴, 헤어, 눈, 코/안경, 입, 의상/소품]
  const [currentStage, setCurrentStage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedIndices, setSelectedIndices] = useState<(number | null)[]>([0, 0, 0, 1, 0, 0]);

  // 카드 탭 모드: 'id' (학생증) | 'library' (도서대출카드)
  const [cardMode, setCardMode] = useState<'id' | 'library'>('id');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 참가 신청 폼 상태
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSession, setSelectedSession] = useState<'both' | 'session1' | 'session2'>('both');
  const [team, setTeam] = useState('미들썸머반');
  const [grade, setGrade] = useState('2학년 (기존)');
  const [bookHint, setBookHint] = useState('');
  const [memo, setMemo] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  // 4대 화면 상태 (로딩 / 정상 / 빈 결과 / 오류) 및 잘못된 입력 안내 상태
  const [validationError, setValidationError] = useState<ValidationErrorInfo | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverErrorInfo, setServerErrorInfo] = useState<ValidationErrorInfo | null>(null);
  const [simulateErrorMode, setSimulateErrorMode] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // 발급 학생증 조회 (빈 결과 / 로딩 / 정상 상태 시연 및 재조회 기능)
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'empty' | 'success'>('idle');
  const [lookupResults, setLookupResults] = useState<any[]>([]);

  // 1. 공책 위 볼펜/연필 좌우 왕복 애니메이션 (90ms)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        let next = prev + direction;
        if (next >= 5) {
          next = 5;
          setDirection(-1);
        } else if (next <= 0) {
          next = 0;
          setDirection(1);
        }
        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isPlaying, direction]);

  // 스페이스바를 누르면 '멈춰!' 인터랙션 발동
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStage, activeIndex, isPlaying]);

  // [멈춰!] 버튼 또는 스페이스바 클릭 시 현재 파츠 확정
  const handleStop = () => {
    const newSelected = [...selectedIndices];
    newSelected[currentStage] = activeIndex;
    setSelectedIndices(newSelected);

    if (currentStage < 5) {
      setCurrentStage(prev => prev + 1);
    } else {
      setIsPlaying(false);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#292524', '#78716c', '#b91c1c']
      });
    }
  };

  // 파츠 박스 직접 클릭 시 바로 선택 & 다음 단계 이동
  const handleSelectPart = (idx: number) => {
    const newSelected = [...selectedIndices];
    newSelected[currentStage] = idx;
    setSelectedIndices(newSelected);
    setActiveIndex(idx);

    if (currentStage < 5) {
      setCurrentStage(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // 특정 단계 탭으로 점프
  const jumpToStage = (stageIdx: number) => {
    setCurrentStage(stageIdx);
    setActiveIndex(selectedIndices[stageIdx] ?? 0);
    setIsPlaying(true);
  };

  // 원클릭 전신 랜덤 생성
  const handleRandomize = () => {
    const randoms = STAGES.map(stage => Math.floor(Math.random() * stage.items.length));
    setSelectedIndices(randoms);
    setIsPlaying(false);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.5 },
      colors: ['#292524', '#a8a29e', '#f59e0b']
    });
  };

  // 지우개로 처음부터 다시 그리기
  const handleReset = () => {
    setSelectedIndices([0, 0, 0, 1, 0, 0]);
    setCurrentStage(0);
    setActiveIndex(0);
    setIsPlaying(true);
  };

  // 학생증 / 대출증 고화질 PNG 다운로드
  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#faf8f2'
      });
      const link = document.createElement('a');
      const safeName = (name.trim() || '김플래닛').replace(/[^a-zA-Z0-9가-힣]/g, '');
      const modeLabel = cardMode === 'id' ? '학생증' : '도서대출증';
      link.download = `2026-플래닛-${modeLabel}-${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('이미지 저장 오류:', err);
      alert('이미지 저장 중 오류가 발생했습니다. 화면을 캡처해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 폰 번호 입력 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    if (validationError) setValidationError(null);
  };

  // 참가 신청 폼 제출 (잘못된 입력 안내 + 로딩/정상/오류 상태 처리)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 20);

    // 1. 잘못된 입력 검증 (이유 + 할 일 명시)
    if (!cleanName || cleanName.length < 2) {
      setValidationError({
        reason: '성함이 입력되지 않았거나 2글자 미만입니다.',
        action: '성함 입력란에 2자 이상의 실명(예: 김플래닛)을 입력한 후 다시 제출 버튼을 눌러주세요.'
      });
      return;
    }
    if (!validatePhone(phone)) {
      setValidationError({
        reason: `휴대폰 번호 형식이 올바르지 않습니다 (현재 입력값: "${phone || '미입력'}").`,
        action: '010-1234-5678 형식으로 숫자 11자리를 정확히 입력한 뒤 다시 제출해 주세요.'
      });
      return;
    }
    if (!privacyAgreed) {
      setValidationError({
        reason: '필수 개인정보 수집 및 이용 동의 항목이 체크되지 않았습니다.',
        action: '제출 버튼 바로 위에 있는 "[필수] 개인정보 수집 동의" 체크박스를 선택한 후 다시 제출해 주세요.'
      });
      return;
    }

    setValidationError(null);
    setServerErrorInfo(null);
    setSubmitStatus('loading');

    const s1 = selectedSession === 'both' || selectedSession === 'session1';
    const s2 = selectedSession === 'both' || selectedSession === 'session2';
    const totalFee = (s1 ? EVENT_CONFIG.session1.fee : 0) + (s2 ? EVENT_CONFIG.session2.fee : 0);
    const sessionLabel = 
      selectedSession === 'both' 
        ? '1부(새학기) + 2부(수학여행) 전체 참석' 
        : selectedSession === 'session1' 
          ? '1부(새학기)만 참석' 
          : '2부(수학여행)만 참석';

    const studentNumber = `2026-PLANET-${Math.floor(1000 + Math.random() * 9000)}`;
    const avatarCode = selectedIndices.map(v => (v !== null ? v + 1 : 0)).join('');
    const recipeNames = selectedIndices.map((val, sIdx) => (val !== null ? STAGES[sIdx].items[val].name : '미정'));

    const payload = {
      action: 'register',
      name: cleanName,
      phone: phone,
      maskedPhone: maskPhone(phone),
      session: sessionLabel,
      team: team,
      grade: grade,
      bookTitle: sanitizeText(bookHint, 100) || '(선물 책 준비 중)',
      memo: sanitizeText(memo, 200),
      fee: totalFee,
      paymentStatus: '입금 대기',
      studentNumber: studentNumber,
      avatarCode: avatarCode,
      avatarRecipe: recipeNames.join(' / '),
      selectedIndices: selectedIndices,
      submittedAt: new Date().toISOString()
    };

    try {
      // 시각적 로딩 상태 확인을 위한 최소 대기 시간 (600ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      // 로컬 스토리지 안전 백업 저장
      const existingRsvps = JSON.parse(localStorage.getItem('planet_rsvps') || '[]');
      existingRsvps.push(payload);
      localStorage.setItem('planet_rsvps', JSON.stringify(existingRsvps));

      // 오류 시뮬레이션 모드 또는 오프라인 상태 체크
      if (simulateErrorMode || !navigator.onLine) {
        throw new Error(simulateErrorMode ? 'SIMULATED_SERVER_ERROR' : 'NETWORK_OFFLINE');
      }

      if (EVENT_CONFIG.googleScriptUrl && EVENT_CONFIG.googleScriptUrl !== 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
        await fetch(EVENT_CONFIG.googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      }

      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#b82828', '#2e5238', '#dfc27d', '#292524']
      });

      setSubmittedData({
        ...payload,
        displayDate: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
      setSubmitStatus('success');

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
      setServerErrorInfo({
        reason: !navigator.onLine
          ? '현재 인터넷(네트워크) 연결이 끊어져 외부 구글 시트 서버로 신청서를 전송하지 못했습니다.'
          : '외부 구글 시트 서버 응답 지연 또는 일시적인 통신 오류가 발생했습니다.',
        action: '1) 네트워크 연결 상태를 확인하거나 [오류 테스트 체크 해제] 후 아래 [다시 제출하기] 버튼을 눌러주세요. 2) 입력하신 정보는 브라우저 임시 보관함에 안전하게 백업되었으므로 좌측의 [완성된 학생증 이미지 저장하기]는 지금 바로 이용 가능합니다.'
      });
    }
  };

  // 발급된 학생증 / 신청 내역 조회 핸들러 (로딩 ➔ 빈 결과 / 정상 상태 전환)
  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = sanitizeText(lookupQuery, 20).trim();
    setLookupStatus('loading');

    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      const saved: any[] = JSON.parse(localStorage.getItem('planet_rsvps') || '[]');
      const matched = q
        ? saved.filter(
            item =>
              (item.name && item.name.includes(q)) ||
              (item.phone && item.phone.includes(q)) ||
              (item.studentNumber && item.studentNumber.toLowerCase().includes(q.toLowerCase()))
          )
        : [];

      if (matched.length === 0) {
        setLookupResults([]);
        setLookupStatus('empty');
      } else {
        setLookupResults(matched.reverse());
        setLookupStatus('success');
      }
    } catch {
      setLookupResults([]);
      setLookupStatus('empty');
    }
  };

  // 조회된 학생증 정보를 현재 프리뷰 카드로 복원
  const handleRestoreRecord = (rec: any) => {
    setName(rec.name || '');
    setTeam(rec.team || '미들썸머반');
    setGrade(rec.grade || '2학년 (기존)');
    if (rec.bookTitle && rec.bookTitle !== '(선물 책 준비 중)') {
      setBookHint(rec.bookTitle);
    }
    if (Array.isArray(rec.selectedIndices) && rec.selectedIndices.length === 6) {
      setSelectedIndices(rec.selectedIndices);
      setIsPlaying(false);
    }
    setCardMode('id');
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const recipeNames = selectedIndices.map((val, sIdx) => val !== null ? STAGES[sIdx].items[val].name : '미정');
  const codeStr = selectedIndices.map(v => v !== null ? v + 1 : 0).join('');
  const currentStageData = currentStage < 6 ? STAGES[currentStage] : null;

  const feeInfo = {
    both: '80,000원',
    session1: '45,000원',
    session2: '35,000원'
  };

  return (
    <div className="w-full max-w-4xl mx-auto gengji-paper rounded-sm shadow-2xl border-4 border-stone-800 p-3 sm:p-7 relative font-serif text-[#292524]">
      
      {/* 전역 SVG 연필 질감 필터 정의 */}
      <svg width="0" height="0" className="absolute pointer-events-none opacity-0">
        <defs>
          <filter id="pencil-sketch" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 1. 상단 HWP 가정통신문 헤더 */}
      <div className="border-2 border-black bg-white/60 mb-5 shadow-xs">
        <div className="grid grid-cols-12 divide-x-2 divide-black items-center text-center">
          <div className="col-span-3 py-2 px-1">
            <div className="font-black text-base sm:text-xl tracking-tighter text-stone-800 font-sans">PLANET</div>
            <div className="text-[10px] text-stone-600 font-serif">since 2017</div>
          </div>
          <div className="col-span-6 py-3">
            <h1 className="font-hwp-title font-black text-lg sm:text-2xl text-black tracking-[0.2em]">가 정 통 신 문</h1>
          </div>
          <div className="col-span-3 py-1.5 px-2 text-[10px] sm:text-xs leading-tight font-hwp-body text-left">
            <div className="font-bold">플래닛독서학교</div>
            <div className="text-stone-600">제2026-1호</div>
            <div className="text-stone-600">2026.12.19.</div>
          </div>
        </div>
      </div>

      {/* 안내 타이틀 */}
      <div className="text-center mb-5">
        <h2 className="font-bold text-base sm:text-lg text-black tracking-tight font-hwp-title">
          - 2026 플래닛 연말 파티 「플래닛의 새학기」 학생증 스케치 &amp; 참가 신청서 -
        </h2>
        <p className="text-xs sm:text-sm text-stone-700 mt-1 font-hwp-body">
          ※ 미대생 짝꿍이 공책 귀퉁이에 그려준 <b>&apos;연필 크로키 공책 게임&apos;</b>으로 학생증 초상화를 완성해 보세요.
        </p>
      </div>

      {/* ========================================== */}
      {/* 2. 연필 드로잉 공책 게임 ("연필 멈춰!") 섹션 */}
      {/* ========================================== */}
      <div className="relative lined-notebook border-2 border-stone-800 rounded-r-lg shadow-lg p-3.5 sm:p-6 pl-7 sm:pl-10 mb-7">
        
        {/* 왼쪽 스프링 링 장식 */}
        <div className="absolute left-1.5 top-3 bottom-3 flex flex-col justify-between py-1 pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="spiral-ring"></div>
          ))}
        </div>

        {/* 공책 상단 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-stone-400 pb-2.5 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-stone-800 text-stone-100 px-2.5 py-0.5 rounded font-hand font-bold text-sm sm:text-base">
              ✏️ 4B 연필 공책 게임
            </span>
            <span className="font-hand text-base sm:text-lg font-bold text-stone-800">
              연필이 왔다 갔다 할 때 <span className="underline decoration-wavy decoration-stone-800 font-black">&quot;멈춰!&quot;</span>를 외쳐 초상화 완성하기
            </span>
          </div>
          <span className="text-xs font-bold bg-stone-200 border border-stone-600 text-stone-900 px-2.5 py-1 rounded-full">
            {currentStage + 1}/6 단계: {STAGES[currentStage]?.title} 스케치 중
          </span>
        </div>

        {/* 6단계 진행 상태 탭 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3.5 text-center font-hand text-xs sm:text-sm font-bold">
          {STAGES.map((s, idx) => {
            const isCur = currentStage === idx;
            const isDone = selectedIndices[idx] !== null;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpToStage(idx)}
                className={`py-1 px-1 rounded transition border-2 ${
                  isCur
                    ? 'border-stone-800 bg-stone-800 text-white shadow-xs'
                    : isDone
                      ? 'border-stone-400 bg-white/90 text-stone-800'
                      : 'border-stone-300 bg-white/50 text-stone-400'
                }`}
              >
                {idx + 1}. {s.title.replace(/[<>]/g, '')}
              </button>
            );
          })}
        </div>

        {/* 현재 단계의 6가지 연필 드로잉 파츠가 나열되는 판 (키보드 Tab 이동 및 선택 지원) */}
        {currentStageData && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 my-3" role="group" aria-label={`${STAGES[currentStage]?.title} 파츠 선택`}>
            {currentStageData.items.map((item, idx) => {
              const isPenHere = activeIndex === idx;
              const isSelected = selectedIndices[currentStage] === idx;
              const svgContent = item.svg || item.frontSvg || '';
              return (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectPart(idx)}
                  className={`border-2 rounded p-1 sm:p-2 cursor-pointer transition flex flex-col items-center justify-between min-h-[90px] sm:min-h-[115px] bg-white/70 select-none text-left ${
                    isPenHere ? 'pen-active' : 'border-stone-300 hover:border-stone-500'
                  } ${isSelected ? 'ring-2 ring-stone-900 bg-amber-50/50' : ''}`}
                >
                  <div className="w-full flex items-center justify-center h-14 sm:h-20">
                    <svg
                      viewBox="0 0 200 220"
                      className="w-full h-full max-h-[75px]"
                      filter="url(#pencil-sketch)"
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  </div>
                  <span className="text-[11px] font-hand font-bold text-stone-800 text-center leading-tight truncate w-full mt-1">
                    {idx + 1}. {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 연필 상태 메시지 & 컨트롤 버튼 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-dashed border-stone-400">
          <div
            role="status"
            aria-live="polite"
            className="font-hand text-sm sm:text-base font-bold text-stone-700 flex items-center gap-1.5"
          >
            <span className="inline-block animate-bounce">✏️</span>
            <span>
              {isPlaying 
                ? '금손 짝꿍의 4B 연필이 공책 위를 왕복하고 있습니다... (원하는 그림을 직접 클릭해도 됩니다!)'
                : '스케치가 확정되었습니다! 다시 움직이려면 [지우개] 또는 단계 탭을 누르세요.'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleStop}
              className="flex-1 sm:flex-initial bg-stone-900 hover:bg-black active:scale-95 text-white font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded shadow-md border-2 border-black transition flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <span>✋ 멈춰!</span>
              <span className="text-[10px] font-normal opacity-80">(Space)</span>
            </button>

            <button
              type="button"
              onClick={handleRandomize}
              className="bg-amber-100 hover:bg-amber-200 text-stone-900 font-bold px-3 py-2 sm:py-2.5 rounded border-2 border-black text-xs transition flex items-center gap-1"
              title="한 번에 랜덤 조합 뽑기"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>원클릭 랜덤</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-2 sm:py-2.5 rounded border-2 border-black text-xs transition flex items-center gap-1"
              title="지우개로 지우고 처음부터"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>지우개</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 3. 실시간 학생증 / 도서대출증 프리뷰 & 참가 신청서 폼 */}
      {/* ======================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* 좌측: 실시간 학생증 & 대출증 프리뷰 (5칸) */}
        <div className="md:col-span-5 flex flex-col items-center w-full min-w-0">
          
          {/* 카드 모드 전환 탭 */}
          <div className="flex w-full mb-2 border-2 border-black rounded overflow-hidden text-xs font-bold font-hwp-title">
            <button
              type="button"
              aria-pressed={cardMode === 'id'}
              onClick={() => setCardMode('id')}
              className={`flex-1 py-2 transition ${
                cardMode === 'id' ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              🪪 공식 학생증 뷰
            </button>
            <button
              type="button"
              aria-pressed={cardMode === 'library'}
              onClick={() => setCardMode('library')}
              className={`flex-1 py-2 transition ${
                cardMode === 'library' ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              📚 도서대출카드 뷰
            </button>
          </div>

          {/* 캡처 대상 카드 영역 */}
          <div ref={cardRef} className="w-full bg-[#faf8f2] border-2 border-black p-3 sm:p-4 shadow-md relative text-[#292524] overflow-hidden">
            
            {/* [모드 1] 플래닛독서학교 학생증 */}
            {cardMode === 'id' && (
              <div>
                <div className="border-b-2 border-black pb-1.5 mb-3 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 tracking-widest font-sans">PLANET BOOK SCHOOL</div>
                    <div className="font-hwp-title font-black text-base sm:text-lg text-black leading-none mt-0.5">학 생 증</div>
                  </div>
                  <span className="text-[10px] font-hwp-body border border-black px-1.5 py-0.5 bg-stone-100">제2026-1호</span>
                </div>

                {/* 증명사진(연필 일러스트 합체) + 학적 정보 */}
                <div className="grid grid-cols-12 gap-2.5 sm:gap-3 items-center">
                  {/* 합체된 연필 일러스트 아바타 캔버스 */}
                  <div className="col-span-5 sketch-paper border-2 border-stone-800 aspect-[4/5] relative flex items-center justify-center overflow-hidden shadow-inner">
                    <svg viewBox="0 0 200 220" className="w-full h-full" filter="url(#pencil-sketch)">
                      {/* 1. 뒷머리 */}
                      {selectedIndices[1] !== null && STAGES[1].items[selectedIndices[1]]?.backSvg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[1].items[selectedIndices[1]].backSvg || '' }} />
                      )}
                      {/* 2. 얼굴 & 귀목선 */}
                      {selectedIndices[0] !== null && STAGES[0].items[selectedIndices[0]]?.svg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[0].items[selectedIndices[0]].svg || '' }} />
                      )}
                      {/* 3. 눈매 */}
                      {selectedIndices[2] !== null && STAGES[2].items[selectedIndices[2]]?.svg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[2].items[selectedIndices[2]].svg || '' }} />
                      )}
                      {/* 4. 코 & 안경 */}
                      {selectedIndices[3] !== null && STAGES[3].items[selectedIndices[3]]?.svg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[3].items[selectedIndices[3]].svg || '' }} />
                      )}
                      {/* 5. 입모양 */}
                      {selectedIndices[4] !== null && STAGES[4].items[selectedIndices[4]]?.svg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[4].items[selectedIndices[4]].svg || '' }} />
                      )}
                      {/* 6. 앞머리 */}
                      {selectedIndices[1] !== null && STAGES[1].items[selectedIndices[1]]?.frontSvg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[1].items[selectedIndices[1]].frontSvg || '' }} />
                      )}
                      {/* 7. 의상 & 소품 (제일 앞으로 배치) */}
                      {selectedIndices[5] !== null && STAGES[5].items[selectedIndices[5]]?.svg && (
                        <g dangerouslySetInnerHTML={{ __html: STAGES[5].items[selectedIndices[5]].svg || '' }} />
                      )}
                    </svg>
                  </div>

                  {/* 우측 학생 정보 표 */}
                  <div className="col-span-7 text-xs font-hwp-body space-y-1.5 min-w-0">
                    <div className="border-b border-stone-400 pb-0.5">
                      <span className="text-stone-500 font-bold block text-[10px]">성 명 (학우명)</span>
                      <span className="font-bold text-sm text-black truncate block">{name.trim() || '김플래닛'}</span>
                    </div>
                    <div className="border-b border-stone-400 pb-0.5 flex justify-between gap-1">
                      <div className="min-w-0">
                        <span className="text-stone-500 font-bold block text-[10px]">소 속 반</span>
                        <span className="font-bold text-stone-900 text-[11px] sm:text-xs truncate block">{team}</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <span className="text-stone-500 font-bold block text-[10px]">학 년</span>
                        <span className="font-bold text-stone-900 text-[11px] sm:text-xs">{grade.split(' ')[0]}</span>
                      </div>
                    </div>
                    <div className="border-b border-stone-400 pb-0.5">
                      <span className="text-stone-500 font-bold block text-[10px]">수강 과정</span>
                      <span className="font-bold text-stone-900 text-[11px] break-keep">
                        {selectedSession === 'both' ? '1부 새학기 + 2부 수학여행' : selectedSession === 'session1' ? '1부 새학기' : '2부 수학여행'}
                      </span>
                    </div>
                    <div className="border-b border-stone-400 pb-0.5">
                      <span className="text-stone-500 font-bold block text-[10px]">기증 도서 힌트</span>
                      <span className="text-stone-800 text-[11px] line-clamp-1">{bookHint.trim() || '삶의 쉼표가 되어준 소설 1권'}</span>
                    </div>
                  </div>
                </div>

                {/* 아바타 파츠 조합 요약 태그 */}
                <div className="mt-2.5 bg-stone-200/70 border border-stone-400 px-2 py-1 text-[10px] font-hand text-stone-700 truncate">
                  ✏️ 스케치 노트: {recipeNames.join(' / ')} (코드: {codeStr})
                </div>

                {/* 하단 직인 날인 & 바코드 */}
                <div className="mt-3 pt-2 border-t border-black flex justify-between items-center gap-2">
                  <div className="text-[10px] font-hwp-body text-stone-600 leading-tight">
                    개학일: <b>2026. 12. 19. (토)</b><br />
                    위 사람은 본교 어른이임을 증명함.
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-hwp-body font-bold text-xs text-black">플래닛독서학교장</span>
                    <div className="stamp-seal w-9 h-9 text-[9px] flex items-center justify-center leading-tight text-center p-0.5">
                      플래닛<br />학교장인
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* [모드 2] 도서대출증 (블라인드 북 교환 카드) */}
            {cardMode === 'library' && (
              <div>
                <div className="text-center border-b-2 border-black pb-2 mb-2">
                  <div className="text-[10px] tracking-widest text-stone-500 font-sans">PLANET LIBRARY BORROWER&apos;S CARD</div>
                  <div className="font-hwp-title font-black text-base text-black">도 서 대 출 카 드</div>
                </div>

                <div className="border-2 border-black text-[11px] font-hwp-body mb-2">
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-4 bg-stone-200 font-bold p-1.5 border-r border-black">청구기호</div>
                    <div className="col-span-8 p-1.5 font-mono text-[10px]">813.5-플2026-{codeStr}</div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-4 bg-stone-200 font-bold p-1.5 border-r border-black">기증 학우</div>
                    <div className="col-span-8 p-1.5 font-bold truncate">{name.trim() || '김플래닛'}</div>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-4 bg-stone-200 font-bold p-1.5 border-r border-black">블라인드 힌트</div>
                    <div className="col-span-8 p-1.5 text-red-900 font-bold break-words">{bookHint.trim() || '삶의 쉼표가 되어준 소설 1권'}</div>
                  </div>
                </div>

                {/* 대출 날짜 도장 테이블 + 미니 크로키 스탬프 */}
                <div className="grid grid-cols-12 border-2 border-black bg-white">
                  <div className="col-span-7 border-r border-black p-2 text-[10px] font-hwp-body space-y-1">
                    <div className="font-bold border-b border-stone-300 pb-0.5 text-center text-stone-800">대출일 / 반납예정일</div>
                    <div className="text-red-700 font-mono font-bold tracking-tight">대출: 2026. 12. 19. 개학일</div>
                    <div className="text-stone-500">반납: 2026. 12. 19. 수학여행 밤</div>
                    <div className="text-stone-400 text-[9px]">※ 꺾이지 않는 텐션 확인필</div>
                  </div>
                  <div className="col-span-5 flex flex-col items-center justify-center p-1 sketch-paper">
                    <div className="w-14 h-16">
                      <svg viewBox="0 0 200 220" className="w-full h-full" filter="url(#pencil-sketch)">
                        {/* 1. 뒷머리 */}
                        {selectedIndices[1] !== null && STAGES[1].items[selectedIndices[1]]?.backSvg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[1].items[selectedIndices[1]].backSvg || '' }} />
                        )}
                        {/* 2. 얼굴 & 귀목선 */}
                        {selectedIndices[0] !== null && STAGES[0].items[selectedIndices[0]]?.svg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[0].items[selectedIndices[0]].svg || '' }} />
                        )}
                        {/* 3. 눈매 */}
                        {selectedIndices[2] !== null && STAGES[2].items[selectedIndices[2]]?.svg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[2].items[selectedIndices[2]].svg || '' }} />
                        )}
                        {/* 4. 코 & 안경 */}
                        {selectedIndices[3] !== null && STAGES[3].items[selectedIndices[3]]?.svg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[3].items[selectedIndices[3]].svg || '' }} />
                        )}
                        {/* 5. 입모양 */}
                        {selectedIndices[4] !== null && STAGES[4].items[selectedIndices[4]]?.svg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[4].items[selectedIndices[4]].svg || '' }} />
                        )}
                        {/* 6. 앞머리 */}
                        {selectedIndices[1] !== null && STAGES[1].items[selectedIndices[1]]?.frontSvg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[1].items[selectedIndices[1]].frontSvg || '' }} />
                        )}
                        {/* 7. 의상 & 소품 (제일 앞) */}
                        {selectedIndices[5] !== null && STAGES[5].items[selectedIndices[5]]?.svg && (
                          <g dangerouslySetInnerHTML={{ __html: STAGES[5].items[selectedIndices[5]].svg || '' }} />
                        )}
                      </svg>
                    </div>
                    <span className="text-[9px] font-hand text-stone-500 mt-0.5">기증자 연필 크로키</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 이미지 저장 버튼 */}
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="w-full mt-3 bg-stone-800 hover:bg-black text-white font-bold py-2.5 px-4 rounded border-2 border-black shadow flex items-center justify-center gap-2 text-xs sm:text-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? '고화질 이미지 생성 중...' : '📸 완성된 학생증/대출증 이미지 저장하기'}</span>
          </button>
        </div>

        {/* 우측: 절취선 참가 신청서 입력 폼 (7칸) */}
        <div className="md:col-span-7 w-full bg-white/70 border-2 border-black p-4 sm:p-5 shadow-sm min-w-0">
          <div className="text-center border-b-2 border-dashed border-stone-500 pb-2 mb-4">
            <span className="text-xs font-mono text-stone-500">------------ (절 취 선) ------------</span>
            <h3 className="font-bold text-sm sm:text-base text-black mt-1 font-hwp-title">
              2026년도 플래닛 연말파티 「플래닛의 새학기」 참가 신청서
            </h3>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs sm:text-sm font-hwp-body">
            
            {/* 성함 */}
            <div>
              <label htmlFor="rsvp-name" className="block font-bold text-stone-800 mb-1">
                성함 (이름) <span className="text-red-600">*</span>
              </label>
              <input
                id="rsvp-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="실명을 입력해 주세요 (예: 김플래닛, 2자 이상)"
                className="w-full border-2 border-stone-800 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-700 font-sans text-sm"
              />
            </div>

            {/* 휴대폰 번호 */}
            <div>
              <label htmlFor="rsvp-phone" className="block font-bold text-stone-800 mb-1">
                휴대폰 번호 <span className="text-red-600">*</span>
              </label>
              <input
                id="rsvp-phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000 (숫자 11자리)"
                maxLength={13}
                className="w-full border-2 border-stone-800 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-700 font-sans text-sm"
              />
            </div>

            {/* 소속반 & 학년 선택 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
              <div>
                <label htmlFor="rsvp-team" className="block font-bold text-stone-800 mb-1 font-serif">
                  소속반 <span className="text-red-600">*</span>
                </label>
                <select
                  id="rsvp-team"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full border-2 border-stone-800 bg-white px-2.5 py-2 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-stone-700"
                >
                  <option value="스프링토반">스프링토반</option>
                  <option value="미들썸머반">미들썸머반</option>
                  <option value="어텀반">어텀반</option>
                  <option value="윈터블반">윈터블반</option>
                </select>
              </div>

              <div>
                <label htmlFor="rsvp-grade" className="block font-bold text-stone-800 mb-1 font-serif">
                  학년 (구분) <span className="text-red-600">*</span>
                </label>
                <select
                  id="rsvp-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full border-2 border-stone-800 bg-white px-2.5 py-2 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-stone-700"
                >
                  <option value="2학년 (기존)">2학년 (기존 멤버)</option>
                  <option value="1학년 (신규)">1학년 (신규 멤버)</option>
                  <option value="3학년 (진행팀)">3학년 (진행팀)</option>
                  <option value="4학년 (준비팀)">4학년 (준비팀)</option>
                </select>
              </div>
            </div>

            {/* 참석 세션 선택 (키보드 Tab 초점 표시 지원 & 모바일 가로 넘침 방지) */}
            <fieldset>
              <legend className="block font-bold text-stone-800 mb-1">
                참석 세션 선택 <span className="text-red-600">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-sans">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="session"
                    value="both"
                    checked={selectedSession === 'both'}
                    onChange={() => setSelectedSession('both')}
                    className="peer sr-only"
                  />
                  <div className="border-2 border-stone-400 peer-checked:border-stone-900 peer-checked:bg-stone-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#b82828] p-2 text-center rounded transition">
                    <div className="font-bold text-xs text-stone-900">1부 + 2부 전체</div>
                    <div className="text-[10px] text-stone-600">새학기 &amp; 수학여행</div>
                    <div className="font-black text-xs text-red-800 mt-1">{feeInfo.both}</div>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="session"
                    value="session1"
                    checked={selectedSession === 'session1'}
                    onChange={() => setSelectedSession('session1')}
                    className="peer sr-only"
                  />
                  <div className="border-2 border-stone-400 peer-checked:border-stone-900 peer-checked:bg-stone-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#b82828] p-2 text-center rounded transition">
                    <div className="font-bold text-xs text-stone-900">1부만 참석</div>
                    <div className="text-[10px] text-stone-600">새학기 본파티(낮)</div>
                    <div className="font-black text-xs text-red-800 mt-1">{feeInfo.session1}</div>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="session"
                    value="session2"
                    checked={selectedSession === 'session2'}
                    onChange={() => setSelectedSession('session2')}
                    className="peer sr-only"
                  />
                  <div className="border-2 border-stone-400 peer-checked:border-stone-900 peer-checked:bg-stone-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#b82828] p-2 text-center rounded transition">
                    <div className="font-bold text-xs text-stone-900">2부만 참석</div>
                    <div className="text-[10px] text-stone-600">수학여행 뒤풀이</div>
                    <div className="font-black text-xs text-red-800 mt-1">{feeInfo.session2}</div>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* 선물할 도서 제목 또는 힌트 */}
            <div>
              <label htmlFor="rsvp-bookhint" className="block font-bold text-stone-800 mb-1">
                선물할 도서 제목 또는 한 줄 힌트 <span className="text-stone-500 font-normal">(대출카드 인쇄용)</span>
              </label>
              <input
                id="rsvp-bookhint"
                type="text"
                value={bookHint}
                onChange={(e) => setBookHint(e.target.value)}
                placeholder="예: 삶의 쉼표가 되어준 소설 1권 (비공개 가능)"
                className="w-full border-2 border-stone-800 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-700 font-sans text-sm"
              />
            </div>

            {/* 운영진에게 남기는 메모 */}
            <div>
              <label htmlFor="rsvp-memo" className="block font-bold text-stone-800 mb-1">
                운영진에게 남기는 메모 / 건의사항 (선택)
              </label>
              <textarea
                id="rsvp-memo"
                rows={2}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="못 드시는 음식(알레르기)이나 준비위원회에 전하고 싶은 다정한 말을 적어주세요."
                className="w-full border-2 border-stone-800 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-700 font-sans text-xs"
              />
            </div>

            {/* 개인정보 수집 동의 및 보안 안내 */}
            <div className="p-2.5 bg-stone-100 border border-stone-300 rounded space-y-1.5 font-sans">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => {
                    setPrivacyAgreed(e.target.checked);
                    if (validationError) setValidationError(null);
                  }}
                  className="mt-0.5 rounded border-stone-600 text-stone-900 focus:ring-stone-600"
                />
                <span className="text-[11px] font-bold text-stone-800 leading-tight">
                  [필수] 행사 참석 확인 및 학생증 발급을 위한 최소 개인정보 수집·이용에 동의합니다.
                </span>
              </label>
              <p className="text-[10px] text-stone-500 pl-5 leading-normal">
                • 수집 항목: 성함, 연락처(화면 표시 시 중간 번호 마스킹 보호), 소속반, 참석 세션<br />
                • 보유 및 파기: 2026. 12. 19. 연말모임 종료 후 즉시 파기
              </p>
            </div>

            {/* 통신 오류 대응 시뮬레이션 토글 (검증 테스트용) */}
            <div className="flex items-center justify-end">
              <label className="inline-flex items-center space-x-1.5 text-[11px] font-sans text-stone-500 cursor-pointer hover:text-stone-800">
                <input
                  type="checkbox"
                  checked={simulateErrorMode}
                  onChange={(e) => setSimulateErrorMode(e.target.checked)}
                  className="rounded border-stone-400"
                />
                <span>⚡ 서버 통신 실패(오류 상태) 대응 테스트</span>
              </label>
            </div>

            {/* [상태 안내 1] 잘못된 입력 안내 (이유 + 할 일) */}
            {validationError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 bg-red-50 border-2 border-red-600 text-red-900 text-xs rounded space-y-1 font-sans"
              >
                <div className="font-bold flex items-center space-x-1.5 text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>[잘못된 입력 안내] 제출을 완료할 수 없습니다</span>
                </div>
                <p className="pl-5"><strong>• 이유:</strong> {validationError.reason}</p>
                <p className="pl-5"><strong>• 할 일:</strong> {validationError.action}</p>
              </div>
            )}

            {/* [상태 안내 2] 로딩 상태 (제출 처리 중) */}
            {submitStatus === 'loading' && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-amber-50 border-2 border-amber-600 text-amber-900 text-xs rounded flex items-center space-x-2.5 font-sans"
              >
                <Loader2 className="w-4 h-4 animate-spin text-amber-700 flex-shrink-0" />
                <div>
                  <div className="font-bold">[로딩 상태] 참가 신청서 접수 및 고유 학번 발급 중...</div>
                  <div className="text-[11px] text-amber-800">플래닛 독서학교 서버와 통신하고 있습니다. 잠시만 기다려 주세요.</div>
                </div>
              </div>
            )}

            {/* [상태 안내 3] 오류 상태 (통신 실패 시 이유 + 할 일 + 재시도 버튼) */}
            {submitStatus === 'error' && serverErrorInfo && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 bg-red-50 border-2 border-red-700 text-red-900 text-xs rounded space-y-2 font-sans"
              >
                <div className="font-bold flex items-center space-x-1.5 text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>⚠️ [오류 상태] 원격 구글 시트 전송에 실패했습니다</span>
                </div>
                <p><strong>• 실패 이유:</strong> {serverErrorInfo.reason}</p>
                <p><strong>• 해야 할 일:</strong> {serverErrorInfo.action}</p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      setSimulateErrorMode(false);
                      handleSubmit(e as any);
                    }}
                    className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded text-xs inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>오류 해제 후 다시 제출하기</span>
                  </button>
                </div>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 px-4 border-2 border-black shadow-md transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Scissors className="w-4 h-4" />
              <span>
                {submitStatus === 'loading'
                  ? '신청서 접수 중...'
                  : '✂️ 절취선 뜯어서 가정통신문 참가 신청서 제출하기'}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* [상태 안내 4] 정상 상태: 제출 완료 안내 카드 (개인정보 마스킹 적용) */}
      {submitStatus === 'success' && submittedData && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 bg-[#292524] text-stone-100 border-2 border-black p-4 sm:p-5 rounded-sm shadow-xl font-sans animate-fadeIn"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-700 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-bold text-sm sm:text-base text-emerald-400">
                [정상 완료] 가정통신문 참가 신청이 접수되었습니다!
              </span>
            </div>
            <span className="text-xs font-mono bg-stone-800 px-2.5 py-1 rounded border border-stone-600 text-amber-300">
              학번: {submittedData.studentNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono mb-4">
            <div className="space-y-1 text-stone-300">
              <div>• 접수 학우: <span className="text-white font-bold">{submittedData.name}</span> ({submittedData.team} / {submittedData.grade})</div>
              <div>• 보호 연락처: <span className="text-stone-200">{submittedData.maskedPhone || maskPhone(submittedData.phone)}</span></div>
              <div>• 선택 세션: <span className="text-white">{submittedData.session}</span></div>
              <div>• 아바타 코드: <span className="text-amber-400 font-bold">{submittedData.avatarCode}</span></div>
              <div>• 연필 레시피: <span className="text-stone-400">{submittedData.avatarRecipe}</span></div>
            </div>

            <div className="bg-stone-900/80 p-3 rounded border border-stone-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">입금 계좌:</span>
                <span className="text-amber-200 font-bold">{EVENT_CONFIG.account.bank} {EVENT_CONFIG.account.number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">예금주:</span>
                <span className="text-white">{EVENT_CONFIG.account.holder}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-stone-800">
                <span className="text-stone-400">입금 금액:</span>
                <span className="text-red-400 font-black text-sm">{submittedData.fee.toLocaleString()}원</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${EVENT_CONFIG.account.bank} ${EVENT_CONFIG.account.number}`);
                  setCopiedAccount(true);
                  setTimeout(() => setCopiedAccount(false), 2000);
                }}
                className="w-full py-1 text-center bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] border border-stone-600 transition flex items-center justify-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedAccount ? '계좌번호가 복사되었습니다!' : '계좌번호 복사하기'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 border-t border-stone-800 pt-2 flex flex-wrap items-center justify-between gap-1">
            <span>※ 위 [완성된 학생증/대출증 이미지 저장하기] 버튼으로 나만의 학생증을 다운로드해 보세요!</span>
            <span>2026. 12. 19. (토) 교실에서 만나요</span>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 4. 발급된 학생증 · 신청 내역 조회 (빈 결과 / 로딩 / 정상 상태 확인) */}
      {/* ======================================================= */}
      <div className="mt-7 bg-white/80 border-2 border-stone-800 p-4 sm:p-5 rounded-sm shadow-sm font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-300 pb-2.5 mb-3">
          <div>
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-stone-700" />
              <span>발급된 학생증 및 참가 신청 내역 조회</span>
            </h4>
            <p className="text-[11px] text-stone-600 mt-0.5">
              신청하신 성함 또는 학번으로 접수 상태와 발급된 학생증 레시피를 다시 불러올 수 있습니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="lookup-input" className="sr-only">조회할 성함 또는 학번 입력</label>
          <input
            id="lookup-input"
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="조회할 성함 또는 학번 입력 (예: 김플래닛, 미등록 이름 입력 시 빈 결과 안내)"
            className="flex-1 border-2 border-stone-800 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-stone-700"
          />
          <button
            type="submit"
            disabled={lookupStatus === 'loading'}
            className="bg-stone-800 hover:bg-black text-white font-bold px-4 py-2 text-xs sm:text-sm border-2 border-black transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>신청 내역 조회</span>
          </button>
        </form>

        {/* 조회 로딩 상태 */}
        {lookupStatus === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 p-3 bg-stone-100 border border-stone-400 rounded text-xs text-stone-800 flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
            <span>[로딩 상태] 입력하신 성함으로 발급된 학생증 기록을 조회하고 있습니다...</span>
          </div>
        )}

        {/* 조회 빈 결과 상태 (Empty State: 이유 + 할 일 안내) */}
        {lookupStatus === 'empty' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 p-3.5 bg-stone-100 border-2 border-dashed border-stone-400 rounded text-xs text-stone-800 space-y-1"
          >
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-stone-600" />
              <span>📭 [빈 결과 상태] 조회된 참가 신청(학생증) 내역이 없습니다</span>
            </div>
            <p className="pl-5 text-stone-700">
              <strong>• 이유:</strong> 검색어(<strong>&quot;{lookupQuery.trim() || '미입력'}&quot;</strong>)와 일치하는 참가 신청 기록을 찾을 수 없습니다.
            </p>
            <p className="pl-5 text-stone-700">
              <strong>• 할 일:</strong> 검색어 철자를 다시 확인하시거나, 아직 신청 전이라면 위 <strong>[참가 신청서]</strong> 양식을 작성해 먼저 제출해 주세요.
            </p>
          </div>
        )}

        {/* 조회 정상 결과 상태 */}
        {lookupStatus === 'success' && lookupResults.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 space-y-2"
          >
            <div className="text-xs font-bold text-emerald-800">
              ✅ [정상 상태] 총 {lookupResults.length}건의 학생증 발급 내역이 확인되었습니다.
            </div>
            {lookupResults.map((rec, i) => (
              <div
                key={i}
                className="p-3 bg-stone-50 border border-stone-400 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-stone-900">
                    {rec.name} <span className="text-stone-500 font-normal">({rec.team} / {rec.grade})</span>
                    <span className="ml-2 font-mono text-[11px] text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      {rec.studentNumber}
                    </span>
                  </div>
                  <div className="text-stone-600 text-[11px]">
                    연락처: {rec.maskedPhone || maskPhone(rec.phone || '')} · 세션: {rec.session} · 아바타 코드: <b>{rec.avatarCode}</b>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreRecord(rec)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-black text-white font-bold rounded text-[11px] whitespace-nowrap self-start sm:self-center"
                >
                  🪪 이 학생증 프리뷰로 불러오기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
