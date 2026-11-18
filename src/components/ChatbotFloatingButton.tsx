import React from 'react';
import { MessageSquareText } from 'lucide-react';

interface ChatbotFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatbotFloatingButton: React.FC<ChatbotFloatingButtonProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="플래닛 교무실 챗봇 상담 열기"
      className="fixed bottom-14 sm:bottom-16 right-3 sm:right-4 z-40 flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-[#872033] hover:bg-[#6e1929] text-white rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-[#f7f5ed]/40 group"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
      </span>
      <MessageSquareText className="w-4 h-4 text-[#f7f5ed]" />
      <span className="text-xs font-bold font-serif whitespace-nowrap">챗봇 상담</span>
    </button>
  );
};
