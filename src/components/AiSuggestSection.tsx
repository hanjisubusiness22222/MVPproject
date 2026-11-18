import React, { useState } from 'react';
import { Sparkles, Calendar, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getKoreanHolidays } from '../utils/holidays';

type SuggestStatus = 'idle' | 'loading' | 'success' | 'error';

interface HolidayItem {
  date: string;
  name: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  year?: number;
  month?: number;
  holidays?: HolidayItem[];
  suggestions?: string[];
  message?: string;
  errorType?: string;
}

export const AiSuggestSection: React.FC = () => {
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(12);
  const [status, setStatus] = useState<SuggestStatus>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>(() => getKoreanHolidays(2026, 12));
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<string>('');

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    setHolidays(getKoreanHolidays(year, newMonth));
    if (status === 'success' || status === 'error') {
      setStatus('idle');
      setSuggestions([]);
      setErrorMessage('');
    }
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    setHolidays(getKoreanHolidays(newYear, month));
    if (status === 'success' || status === 'error') {
      setStatus('idle');
      setSuggestions([]);
      setErrorMessage('');
    }
  };

  const fetchAiSuggestions = async () => {
    setStatus('loading');
    setErrorMessage('');
    setErrorType('');

    try {
      const res = await fetch(`/api/suggest?year=${year}&month=${month}`);
      const data: ApiResponse = await res.json();

      if (!res.ok || data.status !== 'success') {
        setStatus('error');
        setErrorType(data.errorType || 'ERROR');
        setErrorMessage(
          data.message ||
            (res.status === 429
              ? '오픈하사 AI 요청 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.'
              : res.status === 504
              ? '오픈하사 AI 응답 대기 시간(20초)이 초과되었습니다. 다시 시도해 주세요.'
              : '추천을 불러오는 중 오류가 발생했습니다.')
        );
        return;
      }

      setSuggestions(data.suggestions || []);
      if (data.holidays) {
        setHolidays(data.holidays);
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorType('NETWORK_ERROR');
      setErrorMessage('네트워크 연결 또는 서버 응답에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <section
      id="ai-suggest-section"
      aria-label="오픈하사 AI 이 달의 추천"
      className="mt-8 p-5 sm:p-6 bg-[#f7f5ef] border-2 border-[#dcd6c8] rounded-xl shadow-xs text-[#222] font-sans"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-[#b82828]" />
        <h3 className="text-base sm:text-lg font-bold text-[#1f1b18] font-serif">
          오픈하사(Open HASA) AI 이 달의 추천
        </h3>
        <span className="ml-auto text-[11px] bg-[#2e5238] text-white px-2 py-0.5 rounded-full font-mono">
          gemma-4-31b
        </span>
      </div>

      <p className="text-xs text-[#555] mb-4 leading-relaxed">
        선택하신 연도와 월의 대한민국 공휴일을 조회하고, 오픈하사 AI 모델이
        <strong> &lsquo;이 달에 해 볼 만한 일&rsquo;</strong> 3가지를 한 줄씩 추천해 드립니다.
      </p>

      {/* 연·월 선택 영역 */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-[#e5dfd2] rounded-lg mb-3">
        <div className="flex items-center gap-1.5 text-xs text-[#444]">
          <Calendar className="w-4 h-4 text-[#888]" />
          <span className="font-semibold">대상 연·월:</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            id="ai-suggest-year"
            aria-label="연도 선택"
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="border border-[#ccc] rounded px-2 py-1 text-xs bg-[#faf9f6] focus:outline-none focus:ring-1 focus:ring-[#b82828]"
          >
            <option value={2025}>2025년</option>
            <option value={2026}>2026년</option>
            <option value={2027}>2027년</option>
          </select>
          <select
            id="ai-suggest-month"
            aria-label="월 선택"
            value={month}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="border border-[#ccc] rounded px-2 py-1 text-xs bg-[#faf9f6] focus:outline-none focus:ring-1 focus:ring-[#b82828]"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 조회 결과 영역 */}
      <div
        id="holiday-result-box"
        className="p-3 bg-[#fdfcf9] border border-[#e6e0d3] rounded-lg text-xs mb-3 space-y-1"
      >
        <div className="font-bold text-[#333] flex items-center justify-between">
          <span>📅 {year}년 {month}월 공휴일 조회 결과</span>
          <span className="text-[11px] font-normal text-[#666]">
            {holidays.length > 0 ? `총 ${holidays.length}일` : '공휴일 없음'}
          </span>
        </div>
        <div className="text-[#555] text-[11px] pl-1">
          {holidays.length > 0 ? (
            <ul className="list-disc list-inside space-y-0.5">
              {holidays.map((h, idx) => (
                <li key={idx}>
                  <strong className="text-[#2e5238]">{h.date}</strong>: {h.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#888] italic">해당 월에는 지정된 법정 공휴일이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 결과 아래: 'AI 추천 받기' 버튼 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          id="btn-ai-suggest"
          onClick={fetchAiSuggestions}
          disabled={status === 'loading'}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-xs ${
            status === 'loading'
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
              : 'bg-[#b82828] hover:bg-[#961f1f] text-white active:scale-95'
          }`}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>추천 생성 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 추천 받기</span>
            </>
          )}
        </button>

        {status === 'success' && (
          <button
            type="button"
            onClick={fetchAiSuggestions}
            className="flex items-center gap-1 px-3 py-2 border border-[#ccc] bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs"
            title="다시 추천받기"
          >
            <RefreshCw className="w-3 h-3" />
            <span>새로고침</span>
          </button>
        )}
      </div>

      {/* 상태 안내 영역: 불러오는 중 / 결과 / 오류 안내 */}
      <div id="ai-status-container" aria-live="polite">
        {/* 상태 1: 불러오는 중 */}
        {status === 'loading' && (
          <div
            id="ai-state-loading"
            role="status"
            className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5 animate-pulse"
          >
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">✨ 오픈하사 AI가 추천을 불러오는 중입니다...</p>
              <p className="text-[11px] text-amber-700">
                {year}년 {month}월의 공휴일과 계절감을 바탕으로 이 달에 해 볼 만한 일 3가지를 고민하고 있습니다. (최대 20초 소요)
              </p>
            </div>
          </div>
        )}

        {/* 상태 2: 결과 */}
        {status === 'success' && suggestions.length > 0 && (
          <div
            id="ai-state-result"
            role="region"
            aria-label="AI 추천 결과"
            className="p-4 bg-[#f0f7f2] border border-[#c2ded0] rounded-lg text-xs text-[#1f3d27] space-y-2.5"
          >
            <div className="font-bold flex items-center gap-1.5 text-sm text-[#1b4324]">
              <CheckCircle2 className="w-4 h-4 text-[#2e5238]" />
              <span>🌿 {year}년 {month}월, 이 달에 해 볼 만한 일 3가지</span>
            </div>
            <ol className="space-y-2 pl-1">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 bg-white border border-[#d6ebd9] rounded-md shadow-2xs font-medium text-[#222] leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ol>
            <p className="text-[10px] text-[#4d7256] pt-1 text-right">
              Powered by Open HASA (gemma-4-31b)
            </p>
          </div>
        )}

        {/* 상태 3: 오류 안내 */}
        {status === 'error' && (
          <div
            id="ai-state-error"
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-2"
          >
            <div className="font-bold flex items-center gap-1.5 text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {errorType === 'RATE_LIMIT'
                  ? '⚠️ [한도 초과 안내]'
                  : errorType === 'TIMEOUT'
                  ? '⏱️ [시간 초과 안내]'
                  : '❌ [오류 안내]'}
              </span>
            </div>
            <p className="pl-5 text-red-700 leading-relaxed">{errorMessage}</p>
            <div className="pl-5 pt-1">
              <button
                type="button"
                onClick={fetchAiSuggestions}
                className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white font-bold rounded text-[11px] transition-all"
              >
                다시 시도하기
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
