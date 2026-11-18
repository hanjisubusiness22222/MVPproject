import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Loader2, Sparkles, AlertCircle, RefreshCw, 
  HelpCircle, Calendar, Glasses, BookOpen, CreditCard, Receipt
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface SchoolChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_FAQS = [
  {
    icon: Calendar,
    label: '1부 & 2부 일정과 장소',
    query: '1부와 2부 행사 일시와 장소, 회비가 어떻게 되나요?'
  },
  {
    icon: Glasses,
    label: '드레스코드 (용의복장)',
    query: '연말모임 드레스코드(용의복장) 기준과 추천 의상을 알려주세요.'
  },
  {
    icon: BookOpen,
    label: '선물할 책 1권 준비 기준',
    query: '동료 학우에게 선물할 책 1권과 엽서는 어떻게 준비해야 하나요?'
  },
  {
    icon: CreditCard,
    label: '모바일 학생증 발급 방법',
    query: '플래닛 독서학교 공식 모바일 학생증은 어떻게 발급받고 조회하나요?'
  },
  {
    icon: Receipt,
    label: '학생회비 투명 정산 보고서',
    query: '참가 회비는 어디에 쓰이고 실비 영수증 정산은 어디서 확인하나요?'
  }
];

export const SchoolChatbotModal: React.FC<SchoolChatbotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '반갑습니다, 학우님! 🎒 2026 플래닛 독서학교 연말모임 「플래닛의 새학기 & 수학여행」 AI 교무실 상담 조교입니다.\n\n행사 일정, 장소, 드레스코드, 선물할 책, 모바일 학생증 발급 등 궁금한 점이 있으시다면 아래 추천 질문을 누르시거나 자유롭게 질문해 주세요!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMessage('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 대화 히스토리 (최근 4개)
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history
        })
      });

      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        const errorMsg =
          data.message ||
          (res.status === 429
            ? '상담 요청이 많아 일시적으로 한도를 초과했습니다. 잠시 후 다시 질문해 주세요.'
            : res.status === 504
            ? '상담 답변 대기 시간(20초)이 초과되었습니다. 다시 시도해 주세요.'
            : '상담 답변을 불러오지 못했습니다. 다시 시도해 주세요.');

        setErrorMessage(errorMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${errorMsg}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isError: true
          }
        ]);
        return;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '답변이 도착하지 않았습니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const networkErrMsg = '네트워크 연결 또는 서버 응답에 실패했습니다. 잠시 후 다시 질문해 주세요.';
      setErrorMessage(networkErrMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${networkErrMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="플래닛 독서학교 교무실 챗봇 상담소"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      {/* 바깥 배경 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 모달 본체 */}
      <div className="relative w-full sm:max-w-md h-[90vh] sm:h-[620px] max-h-[92vh] bg-[#fbf9f5] border border-[#d8d1c5] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1f1b18] font-sans">
        
        {/* 상단 헤더: 레트로 교무실 테마 */}
        <header className="px-4 py-3 bg-[#16231b] text-[#f7f5ed] border-b border-[#2d4233] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏫</span>
            <div>
              <h2 className="text-sm font-bold font-serif flex items-center gap-1.5">
                <span>플래닛 교무실 챗봇 상담소</span>
                <span className="text-[10px] bg-[#b82828] text-white px-1.5 py-0.2 rounded font-mono font-normal">
                  AI 조교
                </span>
              </h2>
              <p className="text-[10px] text-[#bbb]">
                2026 연말모임 「새학기 & 수학여행」 실시간 안내
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1 rounded-full text-[#bbb] hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* 빠른 FAQ 추천 칩 목록 (가로 스크롤) */}
        <div className="p-2.5 bg-[#f0ecdf] border-b border-[#dfd8ca] shrink-0">
          <div className="text-[11px] font-bold text-[#5c5448] mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#b82828]" />
            <span>자주 묻는 질문 빠른 선택:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {QUICK_FAQS.map((faq, i) => {
              const Icon = faq.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(faq.query)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#fff9f0] border border-[#d1c7b5] hover:border-[#b82828] rounded-full text-[11px] text-[#333] whitespace-nowrap transition-all shadow-2xs disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-[#777]" />
                  <span>{faq.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 대화 영역 (메시지 목록) */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#fbf9f5]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-[#872033] text-white rounded-br-xs'
                    : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-xs'
                    : 'bg-white border border-[#e2dbce] text-[#222] rounded-bl-xs'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[9px] text-[#999] mt-0.5 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* 답변 생성 중 (타이핑 인디케이터) */}
          {isLoading && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="max-w-[85%] rounded-xl rounded-bl-xs p-3 text-xs bg-white border border-[#e2dbce] text-[#666] flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 text-[#b82828] animate-spin" />
                <span>플래닛 상담 조교가 답변을 작성하고 있습니다...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 에러 재시도 알림 배너 */}
        {errorMessage && (
          <div className="px-3 py-1.5 bg-red-100 text-red-900 text-[11px] flex items-center justify-between border-t border-red-200 shrink-0">
            <span className="truncate">{errorMessage}</span>
            <button
              type="button"
              onClick={() => sendMessage(messages[messages.length - 2]?.content)}
              className="ml-2 font-bold underline flex items-center gap-0.5 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>재시도</span>
            </button>
          </div>
        )}

        {/* 입력창 */}
        <footer className="p-2.5 bg-white border-t border-[#dfd8ca] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="행사에 대해 궁금한 점을 적어주세요..."
              className="flex-1 bg-[#faf8f4] border border-[#d5cdbf] focus:border-[#872033] rounded-lg px-3 py-2 text-xs text-[#222] placeholder:text-[#999] outline-none transition-all disabled:bg-stone-100"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-[#872033] hover:bg-[#6e1929] disabled:bg-stone-300 text-white rounded-lg transition-all shadow-xs flex items-center justify-center shrink-0"
              title="질문 전송"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="mt-1 flex items-center justify-between text-[10px] text-[#888] px-1 font-serif">
            <span>Powered by Open HASA AI</span>
            <span>급한 문의: 운영진 오픈채팅</span>
          </div>
        </footer>

      </div>
    </div>
  );
};
