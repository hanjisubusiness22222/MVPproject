import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { verifyAdminPassword } from '../utils/security';
import planetLogo from '../assets/planet-logo.png';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password.trim()) {
      setErrorMsg('관리자 비밀번호를 입력해 주세요.');
      return;
    }

    setIsChecking(true);
    try {
      const ok = await verifyAdminPassword(password);
      if (ok) {
        onSuccess();
      } else {
        setErrorMsg('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
        setPassword('');
      }
    } catch {
      setErrorMsg('비밀번호 확인 중 오류가 발생했습니다.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#16231b] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#fcfbf9] border-2 border-[#dfc27d]/60 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-5">
        <div className="flex flex-col items-center space-y-2">
          <img
            src={planetLogo}
            alt="플래닛 로고"
            className="w-12 h-12 object-contain rounded-lg bg-white border border-[#e5e0d8] p-1 shadow-xs"
          />
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2e5238] text-white text-[10px] font-mono tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            PLANET COMMITTEE ONLY
          </span>
          <h1 className="font-serif text-xl font-extrabold text-[#1f1b18]">
            운영위원회 관리자 로그인
          </h1>
          <p className="text-xs text-[#666] font-serif leading-relaxed">
            신청자 명단, 자리배치, 학생증 인쇄 및 정산 관리를 위해<br />
            관리자 비밀번호를 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label htmlFor="admin-password-input" className="sr-only">
              관리자 비밀번호 입력
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#d8d3c7] bg-white text-sm font-mono focus:outline-none focus:border-[#2e5238]"
              />
            </div>
          </div>

          {errorMsg && (
            <div
              role="status"
              aria-live="polite"
              className="text-xs text-[#b82828] bg-[#fff5f5] border border-[#f5bcbc] rounded-lg px-3 py-2 font-serif"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking}
            className="w-full py-2.5 rounded-xl bg-[#b82828] hover:bg-[#961f1f] text-white text-sm font-serif font-bold shadow-md transition-all disabled:opacity-60"
          >
            {isChecking ? '확인 중...' : '대시보드 열기'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1 text-xs font-serif text-[#666] hover:text-[#1f1b18] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>메인 화면으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
