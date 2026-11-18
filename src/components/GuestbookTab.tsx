import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, RefreshCw, Loader2, 
  AlertCircle, CheckCircle2, Inbox, User, Clock, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface GuestbookEntry {
  id: number | string;
  name: string;
  content: string;
  created_at: string;
}

export const GuestbookTab: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<{ reason: string; action: string } | null>(null);

  // 작성 폼 상태
  const [name, setName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 방명록 목록 불러오기
  const fetchEntries = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/guestbook');
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        setFetchError({
          reason: data.reason || '방명록 목록을 불러오지 못했습니다.',
          action: data.action || '잠시 후 다시 불러오기 버튼을 눌러주세요.'
        });
        setEntries([]);
        return;
      }

      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setFetchError({
        reason: '서버와 통신하는 중 일시적인 네트워크 오류가 발생했습니다.',
        action: '인터넷 연결 상태를 확인한 후 다시 시도해 주세요.'
      });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // 방명록 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    // 클라이언트 유효성 검사
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 20) {
      setFormFeedback({
        type: 'error',
        message: '이름은 1자 이상 20자 이하로 입력해 주세요.'
      });
      return;
    }

    if (!trimmedContent || trimmedContent.length < 1 || trimmedContent.length > 200) {
      setFormFeedback({
        type: 'error',
        message: '내용은 1자 이상 200자 이하로 입력해 주세요.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: trimmedName,
          content: trimmedContent
        })
      });

      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        setFormFeedback({
          type: 'error',
          message: data.reason || '방명록 저장에 실패했습니다. 다시 시도해 주세요.'
        });
        return;
      }

      // 성공 처리
      setName('');
      setContent('');
      setFormFeedback({
        type: 'success',
        message: '🎉 한 줄 방명록이 성공적으로 등록되었습니다!'
      });

      // 축하 컨페티 효과
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // 컨페티 실패 무시
      }

      // 목록 새로고침
      await fetchEntries();
    } catch {
      setFormFeedback({
        type: 'error',
        message: '네트워크 연결 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans text-[#1f1b18]">
      
      {/* 1. 상단 안내 헤더 카드 */}
      <section className="bg-white border-2 border-[#d8d1c5] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📝</span>
          <h2 className="text-lg sm:text-xl font-bold font-serif text-[#16231b]">
            플래닛 독서학교 한 줄 방명록
          </h2>
          <span className="ml-auto text-[11px] bg-[#2e5238] text-white px-2 py-0.5 rounded-full font-serif">
            Supabase 연동
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
          2026 연말모임 「플래닛의 새학기 & 수학여행」을 함께하는 동료 학우들에게 따뜻한 한 줄 인사나 기대평을 남겨주세요.
        </p>

        {/* 작성 폼 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="gb-name" className="font-bold text-[#333]">
                이름 (1~20자) <span className="text-[#b82828]">*</span>
              </label>
              <span className={`text-[11px] font-mono ${name.length > 20 ? 'text-red-600 font-bold' : 'text-[#888]'}`}>
                {name.length} / 20
              </span>
            </div>
            <input
              id="gb-name"
              type="text"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김플래닛 또는 닉네임"
              disabled={isSubmitting}
              className="w-full bg-[#fdfcf9] border border-[#d1c9bd] focus:border-[#2e5238] focus:ring-1 focus:ring-[#2e5238] rounded-lg px-3 py-2 text-xs sm:text-sm outline-none transition-all placeholder:text-[#aaa]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="gb-content" className="font-bold text-[#333]">
                한 줄 내용 (1~200자) <span className="text-[#b82828]">*</span>
              </label>
              <span className={`text-[11px] font-mono ${content.length > 200 ? 'text-red-600 font-bold' : 'text-[#888]'}`}>
                {content.length} / 200
              </span>
            </div>
            <textarea
              id="gb-content"
              rows={3}
              maxLength={200}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 2026년도 플래닛 독서학교 학우들과 좋은 책 이야기로 마무리할 수 있어서 너무 기대돼요!"
              disabled={isSubmitting}
              className="w-full bg-[#fdfcf9] border border-[#d1c9bd] focus:border-[#2e5238] focus:ring-1 focus:ring-[#2e5238] rounded-lg px-3 py-2 text-xs sm:text-sm outline-none transition-all placeholder:text-[#aaa] resize-none"
            />
          </div>

          {/* 폼 피드백 메시지 */}
          {formFeedback && (
            <div
              role="alert"
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                formFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              {formFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{formFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-[#777] leading-tight">
              🔒 방명록은 서버 유효성 검증 후 안전하게 저장되며, 최근 20건이 공개됩니다.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !content.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2e5238] hover:bg-[#23402c] disabled:bg-stone-300 text-white font-bold rounded-lg text-xs sm:text-sm transition-all shadow-xs active:scale-95 shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>등록 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>방명록 남기기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 2. 최근 방명록 목록 카드 */}
      <section className="bg-white border border-[#d8d1c5] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#eee8dc] mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold font-serif text-sm sm:text-base text-[#1f1b18]">
              최근 한 줄 방명록
            </h3>
            {!isLoading && (
              <span className="text-xs bg-[#f4efe5] text-[#555] px-2 py-0.5 rounded-full font-mono">
                {entries.length}건
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={fetchEntries}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-[#d5cdbf] bg-[#fbf9f5] hover:bg-[#f0ece1] text-[#444] rounded-lg transition-all"
            title="목록 새로고침"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>

        {/* 상태 1: 로딩 중 */}
        {isLoading && (
          <div
            role="status"
            className="p-8 text-center bg-[#fdfcf9] border border-dashed border-[#dcd6c8] rounded-lg space-y-2 text-[#777]"
          >
            <Loader2 className="w-6 h-6 animate-spin text-[#2e5238] mx-auto" />
            <p className="text-xs font-bold text-[#333]">방명록을 불러오는 중입니다...</p>
            <p className="text-[11px] text-[#888]">
              Supabase 데이터베이스에서 최근 20개의 한 줄 방명록을 가져오고 있습니다.
            </p>
          </div>
        )}

        {/* 상태 2: 조회 오류 */}
        {!isLoading && fetchError && (
          <div
            role="alert"
            className="p-5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-2"
          >
            <div className="font-bold flex items-center gap-1.5 text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>⚠️ [오류 상태] 방명록을 불러오지 못했습니다</span>
            </div>
            <p className="pl-5 text-red-700 leading-relaxed">• 이유: {fetchError.reason}</p>
            <p className="pl-5 text-red-700 leading-relaxed">• 조치: {fetchError.action}</p>
            <div className="pl-5 pt-1">
              <button
                type="button"
                onClick={fetchEntries}
                className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white font-bold rounded text-xs transition-all"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        )}

        {/* 상태 3: 빈 목록 (Empty State) */}
        {!isLoading && !fetchError && entries.length === 0 && (
          <div
            role="status"
            className="p-8 text-center bg-[#fdfcf9] border border-dashed border-[#dcd6c8] rounded-lg space-y-2 text-[#777]"
          >
            <Inbox className="w-7 h-7 text-[#aaa] mx-auto" />
            <p className="text-xs font-bold text-[#444]">📭 아직 등록된 한 줄 방명록이 없습니다</p>
            <p className="text-[11px] text-[#888]">
              위 양식에서 첫 번째 방명록을 작성해 동료 학우들에게 첫 인사를 건네 보세요!
            </p>
          </div>
        )}

        {/* 상태 4: 정상 목록 */}
        {!isLoading && !fetchError && entries.length > 0 && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#2e5238] bg-[#f0f7f2] border border-[#d6ebd9] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>최신 20개의 한 줄 방명록이 최신순으로 표시됩니다.</span>
            </div>

            <ul className="divide-y divide-[#eee8dc]">
              {entries.map((entry, idx) => (
                <li key={entry.id || idx} className="py-3 px-1 space-y-1 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1f1b18]">
                      <span className="w-5 h-5 rounded-full bg-[#f4efe5] text-[#2e5238] flex items-center justify-center text-[10px] font-mono">
                        {entries.length - idx}
                      </span>
                      <User className="w-3 h-3 text-[#777]" />
                      <span>{entry.name}</span>
                    </div>
                    {entry.created_at && (
                      <div className="flex items-center gap-1 text-[10px] text-[#888] font-mono">
                        <Clock className="w-3 h-3 text-[#aaa]" />
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#333] pl-6 leading-relaxed whitespace-pre-wrap break-words">
                    {entry.content}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

    </div>
  );
};
