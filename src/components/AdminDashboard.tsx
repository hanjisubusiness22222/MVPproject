import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShieldCheck, Download, Search, CheckCircle2, 
  Clock, Users, DollarSign, BookOpen, Lock, Unlock, 
  RefreshCw, Plus, Trash2, Check, X, Receipt, ExternalLink
} from 'lucide-react';
import { EVENT_CONFIG } from '../constants/eventConfig';
import { fetchGoogleSheetRecords, GOOGLE_SHEET_VIEW_URL } from '../utils/googleSheetSync';
import planetLogo from '../assets/planet-logo.png';

interface RsvpRecord {
  studentNumber?: string;
  name: string;
  phone: string;
  session: string;
  bookTitle?: string;
  bookHint?: string;
  fee: number;
  paymentStatus: '입금 완료' | '입금 대기';
  submittedAt?: string;
  source?: 'sheet' | 'local';
}

// 초기 샘플 RSVP 명단 (구글 시트 응답 전 초기 표시용)
const INITIAL_RECORDS: RsvpRecord[] = [
  { studentNumber: '2026-PLANET-1001', name: '김하늘', phone: '010-1234-5678', session: '1부(새학기) + 2부(수학여행) 전체 참석', bookTitle: '어린 왕자 (생텍쥐페리)', fee: 80000, paymentStatus: '입금 완료', submittedAt: '2026-10-24 14:20', source: 'sheet' },
  { studentNumber: '2026-PLANET-1002', name: '이준호', phone: '010-2345-6789', session: '1부(새학기)만 참석', bookTitle: '모순 (양귀자)', fee: 45000, paymentStatus: '입금 완료', submittedAt: '2026-10-24 15:10', source: 'sheet' },
  { studentNumber: '2026-PLANET-1003', name: '박서연', phone: '010-3456-7890', session: '1부(새학기) + 2부(수학여행) 전체 참석', bookTitle: '데미안 (헤르만 헤세)', fee: 80000, paymentStatus: '입금 대기', submittedAt: '2026-10-24 16:05', source: 'sheet' },
  { studentNumber: '2026-PLANET-1004', name: '정민우', phone: '010-4567-8901', session: '2부(수학여행)만 참석', bookTitle: '달과 6펜스 (서머싯 몸)', fee: 35000, paymentStatus: '입금 완료', submittedAt: '2026-10-24 16:40', source: 'sheet' },
  { studentNumber: '2026-PLANET-1005', name: '최지우', phone: '010-5678-9012', session: '1부(새학기) + 2부(수학여행) 전체 참석', bookTitle: '물고기는 존재하지 않는다', fee: 80000, paymentStatus: '입금 대기', submittedAt: '2026-10-24 17:15', source: 'sheet' }
];

interface AdminDashboardProps {
  onBack: () => void;
  onGoToSeat: () => void;
  onGoToSettlement?: () => void;
  onGoToAvatarStudio?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBack, 
  onGoToSeat, 
  onGoToSettlement,
  onGoToAvatarStudio 
}) => {
  const [records, setRecords] = useState<RsvpRecord[]>(INITIAL_RECORDS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [sheetRowCount, setSheetRowCount] = useState<number>(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'both' | 's1' | 's2'>('all');

  // 구글 시트(gid=1206999111) 실시간 동기화 함수
  const handleSyncFromGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const { records: synced, fromSheetCount, syncedAt } = await fetchGoogleSheetRecords();
      if (synced.length > 0) {
        setRecords(synced);
        setSheetRowCount(fromSheetCount);
        setLastSyncedAt(syncedAt);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncFromGoogleSheet();
  }, []);

  // 저장 함수
  const saveRecords = (updated: RsvpRecord[]) => {
    setRecords(updated);
    localStorage.setItem('planet_rsvps', JSON.stringify(updated));
  };

  // 입금 상태 토글
  const togglePaymentStatus = (idx: number) => {
    const updated = [...records];
    updated[idx].paymentStatus = updated[idx].paymentStatus === '입금 완료' ? '입금 대기' : '입금 완료';
    saveRecords(updated);
  };

  // 신청 기록 삭제
  const handleDeleteRecord = (idx: number) => {
    if (window.confirm(`${records[idx].name} 님의 신청 기록을 삭제하시겠습니까?`)) {
      const updated = records.filter((_, i) => i !== idx);
      saveRecords(updated);
    }
  };

  // CSV 엑셀 다운로드 (한글 깨짐 방지 UTF-8 BOM)
  const handleExportCsv = () => {
    const headers = ['학번', '성명', '연락처', '참석세션', '도서제목', '회비(원)', '회비납부여부', '신청일시'];
    const rows = records.map(r => [
      r.studentNumber || '',
      r.name,
      r.phone,
      r.session,
      `"${(r.bookTitle || '').replace(/"/g, '""')}"`,
      r.fee,
      r.paymentStatus,
      r.submittedAt || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2026_플래닛연말모임_신청자명단_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 필터링된 기록
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.phone.includes(searchTerm) ||
                          (r.bookTitle && r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'completed' 
        ? r.paymentStatus === '입금 완료' 
        : r.paymentStatus === '입금 대기';

    const matchesSession = sessionFilter === 'all'
      ? true
      : sessionFilter === 'both'
        ? r.session.includes('전체') || r.session.includes('+')
        : sessionFilter === 's1'
          ? r.session.includes('1부만')
          : r.session.includes('2부만');

    return matchesSearch && matchesStatus && matchesSession;
  });

  // 통계 계산
  const totalCount = records.length;
  const completedCount = records.filter(r => r.paymentStatus === '입금 완료').length;
  const pendingCount = totalCount - completedCount;
  const totalExpectedFee = records.reduce((sum, r) => sum + r.fee, 0);
  const totalPaidFee = records.filter(r => r.paymentStatus === '입금 완료').reduce((sum, r) => sum + r.fee, 0);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1f1b18] font-sans pb-16">
      
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-3 sm:px-6 py-2.5 sm:py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <button
              onClick={onBack}
              className="p-1 sm:p-1.5 rounded-lg border border-[#d8d3c7] bg-[#f8f6f0] hover:bg-[#ede8dc] text-[#1f1b18] text-xs font-serif flex items-center space-x-1 shadow-sm flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>메인으로</span>
            </button>

            <div className="flex items-center space-x-2 min-w-0">
              <img src={planetLogo} alt="플래닛" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded bg-white border border-[#e5e0d8] p-0.5 shadow-sm flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-serif font-bold text-[#1f1b18] flex items-center space-x-1.5">
                  <span className="truncate">행정 대시보드</span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2e5238] text-white whitespace-nowrap">관리자</span>
                </h1>
                <p className="text-[9px] sm:text-[10px] text-[#666] font-serif truncate">2026 플래닛 독서학교 연말모임 통합 행정 시스템</p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 justify-end">
            {onGoToAvatarStudio && (
              <button
                onClick={onGoToAvatarStudio}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-[11px] sm:text-xs font-serif border border-[#2563EB] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe] flex items-center space-x-1 shadow-sm transition-all"
              >
                <span>🪪 학생증 공작소</span>
              </button>
            )}

            {onGoToSettlement && (
              <button
                onClick={onGoToSettlement}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-[11px] sm:text-xs font-serif border border-[#c29b38] bg-[#fbf7ee] text-[#8c6b1b] hover:bg-[#f3ecdb] flex items-center space-x-1 shadow-sm transition-all"
              >
                <span>🧾 결산 보고서</span>
              </button>
            )}

            <button
              onClick={onGoToSeat}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-[11px] sm:text-xs font-serif border border-[#1f1b18] bg-[#1f1b18] text-white hover:bg-[#333] flex items-center space-x-1 shadow-sm transition-all"
            >
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>자리 배치</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-[11px] sm:text-xs font-serif border border-[#2e5238] bg-[#2e5238] text-white hover:bg-[#23402c] flex items-center space-x-1 shadow-sm transition-all"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>명단 CSV</span>
            </button>
          </div>

        </div>
      </header>

      {/* 메인 통계 & 리스트 */}
      <main className="max-w-6xl mx-auto px-2.5 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-16 space-y-5 sm:space-y-6">

        {/* 구글 스프레드시트 실시간 연동 상태 바 */}
        <div className="bg-[#f0f7f2] border border-[#b8d8be] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-serif font-bold text-[#1f3d27]">
              <CheckCircle2 className="w-4 h-4 text-[#2e5238] flex-shrink-0" />
              <span>구글 스프레드시트 실시간 연동 중 (시트 GID: 1206999111)</span>
            </div>
            <p className="text-[11px] text-[#3c6347] font-sans">
              시트 원본 데이터 {sheetRowCount}건 동기화 완료 {lastSyncedAt ? `(최근 갱신: ${lastSyncedAt})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSyncFromGoogleSheet}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#e6f2e9] border border-[#2e5238] text-[#2e5238] text-xs font-serif font-bold flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '시트 동기화 중...' : '시트 새로고침'}</span>
            </button>

            <a
              href={GOOGLE_SHEET_VIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#2e5238] hover:bg-[#23402c] text-white text-xs font-serif font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <span>연결된 구글 시트 열기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        
        {/* 통계 요약 카드 4종 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white border border-[#e2ddd3] rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[#888] text-xs font-serif">
              <span>총 신청자</span>
              <Users className="w-4 h-4 text-[#b82828]" />
            </div>
            <div className="text-2xl font-bold font-serif text-[#111]">
              {totalCount}<span className="text-xs font-normal text-[#666] ml-1">명</span>
            </div>
            <div className="text-[10px] text-[#777]">1·2부 세션 누적 접수 인원</div>
          </div>

          <div className="bg-white border border-[#e2ddd3] rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[#888] text-xs font-serif">
              <span>입금 완료</span>
              <CheckCircle2 className="w-4 h-4 text-[#2e5238]" />
            </div>
            <div className="text-2xl font-bold font-serif text-[#2e5238]">
              {completedCount}<span className="text-xs font-normal text-[#666] ml-1">명</span>
            </div>
            <div className="text-[10px] text-[#777]">입금 확인 완료 비율 {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</div>
          </div>

          <div className="bg-white border border-[#e2ddd3] rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[#888] text-xs font-serif">
              <span>입금 대기</span>
              <Clock className="w-4 h-4 text-[#dfc27d]" />
            </div>
            <div className="text-2xl font-bold font-serif text-[#b82828]">
              {pendingCount}<span className="text-xs font-normal text-[#666] ml-1">명</span>
            </div>
            <div className="text-[10px] text-[#777]">미입금자 공지 안내 필요</div>
          </div>

          <div className="bg-white border border-[#e2ddd3] rounded-xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[#888] text-xs font-serif">
              <span>회비 수납 현황</span>
              <DollarSign className="w-4 h-4 text-[#2e5238]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#111]">
              {totalPaidFee.toLocaleString()}<span className="text-xs font-normal text-[#666] ml-1">원</span>
            </div>
            <div className="text-[10px] text-[#777]">총 예상액: {totalExpectedFee.toLocaleString()}원</div>
          </div>

        </div>

        {/* 관리자 주요 업무 메뉴: 자리배치 & 결산보고서 & 아바타 학생증 공작소 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div 
            onClick={onGoToSeat}
            className="cursor-pointer bg-white hover:bg-[#fbf9f4] border-2 border-[#1f1b18]/20 hover:border-[#1f1b18] rounded-xl p-4 shadow-sm hover:shadow transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#2e5238]/10 text-[#2e5238] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1f1b18] flex items-center space-x-1.5">
                  <span>추억의 교실 자리배치</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2e5238] text-white">현장용</span>
                </div>
                <p className="text-[11px] text-[#666] font-serif mt-0.5">
                  1·2·3분단 좌석 배정 및 빔프로젝터 셔플
                </p>
              </div>
            </div>
            <span className="text-xs text-[#2e5238] font-serif font-bold group-hover:translate-x-1 transition-transform">이동 →</span>
          </div>

          <div 
            onClick={onGoToSettlement}
            className="cursor-pointer bg-white hover:bg-[#fbf9f4] border-2 border-[#c29b38]/30 hover:border-[#c29b38] rounded-xl p-4 shadow-sm hover:shadow transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#c29b38]/10 text-[#8c6b1b] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1f1b18] flex items-center space-x-1.5">
                  <span>학생회비 투명 정산</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c29b38] text-white">결산</span>
                </div>
                <p className="text-[11px] text-[#666] font-serif mt-0.5">
                  회비 수입/실비 지출 내역 및 실물 영수증 확인
                </p>
              </div>
            </div>
            <span className="text-xs text-[#8c6b1b] font-serif font-bold group-hover:translate-x-1 transition-transform">이동 →</span>
          </div>

          {onGoToAvatarStudio && (
            <div 
              onClick={onGoToAvatarStudio}
              className="cursor-pointer bg-white hover:bg-[#eff6ff] border-2 border-[#2563EB]/30 hover:border-[#2563EB] rounded-xl p-4 shadow-sm hover:shadow transition-all flex items-center justify-between group sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-xl">🪪</span>
                </div>
                <div>
                  <div className="font-serif font-bold text-sm text-[#1f1b18] flex items-center space-x-1.5">
                    <span>아바타 학생증 공작소</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2563EB] text-white">신규</span>
                  </div>
                  <p className="text-[11px] text-[#666] font-serif mt-0.5">
                    공책 '볼펜 멈춰!' 아바타 뽑기 & 네임택 인쇄
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#2563EB] font-serif font-bold group-hover:translate-x-1 transition-transform">이동 →</span>
            </div>
          )}
        </div>

        {/* 필터 및 검색 바 */}
        <div className="bg-white border border-[#e2ddd3] rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#888]" />
            <input 
              type="text" 
              placeholder="이름, 전화번호, 도서 제목 검색..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs font-serif border border-[#ccc] rounded px-3 py-1.5 focus:outline-none focus:border-[#b82828]"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-serif">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)}
              className="border border-[#ccc] rounded px-2.5 py-1.5 bg-white text-[#333]"
            >
              <option value="all">입금 상태: 전체</option>
              <option value="completed">입금 완료만</option>
              <option value="pending">입금 대기만</option>
            </select>

            <select 
              value={sessionFilter} 
              onChange={e => setSessionFilter(e.target.value as any)}
              className="border border-[#ccc] rounded px-2.5 py-1.5 bg-white text-[#333]"
            >
              <option value="all">세션: 전체</option>
              <option value="both">1부+2부 전체</option>
              <option value="s1">1부(새학기)만</option>
              <option value="s2">2부(수학여행)만</option>
            </select>
          </div>

        </div>

        {/* 신청자 명단 테이블 */}
        <div className="bg-white border-2 border-[#1f1b18] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] sm:min-w-full text-left text-xs font-serif border-collapse">
              <thead>
                <tr className="bg-[#1f1b18] text-white">
                  <th className="p-3 font-bold">학번</th>
                  <th className="p-3 font-bold">성명</th>
                  <th className="p-3 font-bold">연락처</th>
                  <th className="p-3 font-bold">참석 세션</th>
                  <th className="p-3 font-bold">선물 도서 제목</th>
                  <th className="p-3 font-bold">회비</th>
                  <th className="p-3 font-bold text-center">입금 여부 (토글)</th>
                  <th className="p-3 font-bold text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e4dc]">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#fbf9f4] transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#666]">{r.studentNumber}</td>
                      <td className="p-3 font-bold text-sm text-[#111]">{r.name}</td>
                      <td className="p-3 font-mono">{r.phone}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#f0ece1] text-[#333] border border-[#d8d3c7]">
                          {r.session}
                        </span>
                      </td>
                      <td className="p-3 text-[#555] max-w-xs truncate" title={r.bookTitle}>
                        {r.bookTitle || '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#b82828]">
                        {r.fee.toLocaleString()}원
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => togglePaymentStatus(idx)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                            r.paymentStatus === '입금 완료'
                              ? 'bg-[#2e5238] text-white hover:bg-[#23402c]'
                              : 'bg-[#fceded] text-[#b82828] border border-[#b82828] hover:bg-[#f8dede]'
                          }`}
                        >
                          {r.paymentStatus === '입금 완료' ? '✓ 입금 완료' : '⌛ 입금 대기'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteRecord(idx)}
                          className="p-1 text-[#aaa] hover:text-[#b82828] transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#888] font-serif">
                      검색 조건에 일치하는 신청자 명단이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

    </div>
  );
};
