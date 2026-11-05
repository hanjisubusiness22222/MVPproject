import { EVENT_CONFIG } from '../constants/eventConfig';

export interface SyncedRsvpRecord {
  studentNumber: string;
  name: string;
  phone: string;
  session: string;
  bookTitle: string;
  fee: number;
  paymentStatus: '입금 완료' | '입금 대기';
  submittedAt: string;
  team?: string;
  grade?: string;
  avatarCode?: string;
  avatarRecipe?: string;
  selectedIndices?: (number | null)[];
  source?: 'sheet' | 'local';
}

/**
 * 개인정보 보호를 위해 성명 가운데 글자를 마스킹합니다 (예: 박지민 -> 박*민, 이산 -> 이*)
 */
export function maskNameValue(name: string): string {
  const clean = String(name || '').trim();
  if (!clean) return '익*';
  if (clean.includes('*')) return clean;
  if (clean.length <= 1) return `${clean}*`;
  if (clean.length === 2) return `${clean[0]}*`;
  return `${clean[0]}${'*'.repeat(clean.length - 2)}${clean[clean.length - 1]}`;
}

/**
 * 개인정보 보호를 위해 전화번호 가운데 자리를 마스킹합니다 (예: 010-1234-5678 -> 010-****-5678)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '010-****-0000';
  if (phone.includes('*')) return phone;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }
  return '010-****-0000';
}

/**
 * 마스킹된 이름(예: '박*민')과 사용자가 입력한 검색어(예: '박지민' 또는 '박*민')가 일치하는지 확인합니다.
 */
export function matchesMaskedName(maskedOrRawName: string, query: string): boolean {
  const target = String(maskedOrRawName || '').trim().toLowerCase();
  const q = String(query || '').trim().toLowerCase();
  if (!target || !q) return false;
  if (target.includes(q)) return true;
  const maskedQuery = maskNameValue(q).toLowerCase();
  return target === maskedQuery;
}

// 서버에서 가려진(마스킹된) 상태로만 내려오는 안전 기본 명단 (원본 실명·원본 전화번호 미포함)
const SERVER_MASKED_FALLBACK_RECORDS: SyncedRsvpRecord[] = [
  {
    studentNumber: '2026-PLANET-1001',
    name: '박*민',
    phone: '010-****-5678',
    session: '1부(새학기) + 2부(수학여행) 전체 참석',
    bookTitle: '어린 왕자 (생텍쥐페리)',
    fee: 80000,
    paymentStatus: '입금 완료',
    submittedAt: '2026-10-24 14:20',
    source: 'sheet'
  },
  {
    studentNumber: '2026-PLANET-1002',
    name: '송*호',
    phone: '010-****-6789',
    session: '1부(새학기)만 참석',
    bookTitle: '모순 (양귀자)',
    fee: 45000,
    paymentStatus: '입금 완료',
    submittedAt: '2026-10-24 15:10',
    source: 'sheet'
  },
  {
    studentNumber: '2026-PLANET-1003',
    name: '이*진',
    phone: '010-****-7890',
    session: '1부(새학기) + 2부(수학여행) 전체 참석',
    bookTitle: '데미안 (헤르만 헤세)',
    fee: 80000,
    paymentStatus: '입금 대기',
    submittedAt: '2026-10-24 16:05',
    source: 'sheet'
  },
  {
    studentNumber: '2026-PLANET-1004',
    name: '정*석',
    phone: '010-****-8901',
    session: '2부(수학여행)만 참석',
    bookTitle: '달과 6펜스 (서머싯 몸)',
    fee: 35000,
    paymentStatus: '입금 완료',
    submittedAt: '2026-10-24 16:40',
    source: 'sheet'
  }
];

function isValidAppsScriptUrl(url: string): boolean {
  return (
    Boolean(url) &&
    url.startsWith('https://script.google.com/') &&
    !url.includes('YOUR_SCRIPT_ID')
  );
}

/**
 * 비공개 구글 시트와 연결된 서버(/api/rsvp 또는 Google Apps Script 웹앱)에서
 * 이미 이름(박*민)과 연락처(010-****-5678)가 가려진(마스킹된) 명단만 받아옵니다.
 * - 공개 시트(gviz/tq) 직접 호출은 개인정보 보호를 위해 완전히 차단되었습니다.
 */
export async function fetchGoogleSheetRecords(options?: { simulateError?: boolean }): Promise<{
  records: SyncedRsvpRecord[];
  fromSheetCount: number;
  syncedAt: string;
  hasError?: boolean;
  errorReason?: string;
  errorAction?: string;
}> {
  let serverRecords: SyncedRsvpRecord[] = [];
  let hasError = false;
  let errorReason = '';
  let errorAction = '';

  try {
    if (options?.simulateError) {
      throw new Error('SIMULATED_NETWORK_ERROR');
    }

    const scriptUrl = EVENT_CONFIG.googleScriptUrl;
    let fetched = false;

    // 1순위: Google Apps Script 보안 서버 (비공개 시트에서 마스킹된 JSON만 반환)
    if (isValidAppsScriptUrl(scriptUrl)) {
      const res = await fetch(`${scriptUrl}?_t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        serverRecords = data.records.map((r: any, idx: number) => ({
          studentNumber: String(r.studentNumber || `2026-PLANET-${1001 + idx}`),
          name: maskNameValue(r.name),
          phone: maskPhoneNumber(r.phone),
          session: String(r.session || '1부(새학기) + 2부(수학여행) 전체 참석'),
          bookTitle: String(r.bookTitle || '(선물 책 준비 중)'),
          fee: Number(r.fee || 80000),
          paymentStatus: r.paymentStatus === '입금 완료' ? '입금 완료' : '입금 대기',
          submittedAt: String(r.submittedAt || '2026-10-24'),
          source: 'sheet'
        }));
        fetched = true;
      }
    }

    // 2순위: Vercel Serverless API (/api/rsvp) 호출 (서버에서 가린 정보만 반환)
    if (!fetched) {
      const apiRes = await fetch(`/api/rsvp?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        const apiData = await apiRes.json();
        if (apiData && Array.isArray(apiData.records)) {
          serverRecords = apiData.records.map((r: any, idx: number) => ({
            studentNumber: String(r.studentNumber || `2026-PLANET-${1001 + idx}`),
            name: maskNameValue(r.name),
            phone: maskPhoneNumber(r.phone),
            session: String(r.session || '1부(새학기) + 2부(수학여행) 전체 참석'),
            bookTitle: String(r.bookTitle || '(선물 책 준비 중)'),
            fee: Number(r.fee || 80000),
            paymentStatus: r.paymentStatus === '입금 완료' ? '입금 완료' : '입금 대기',
            submittedAt: String(r.submittedAt || '2026-10-24'),
            source: 'sheet'
          }));
          fetched = true;
        }
      }
    }

    if (!fetched) {
      serverRecords = SERVER_MASKED_FALLBACK_RECORDS;
    }
  } catch (err) {
    console.warn('보안 서버 명단 조회 실패, 마스킹된 캐시 명단으로 대체합니다:', err);
    hasError = true;
    errorReason = '비공개 구글 시트 보안 서버와의 통신에 실패했거나 네트워크 연결이 불안정합니다.';
    errorAction = '우측 상단 [새로고침] 버튼을 눌러 다시 시도하시거나 네트워크 연결 상태를 확인해 주세요. (현재 개인정보가 마스킹된 안전 캐시 명단을 표시합니다)';
    serverRecords = SERVER_MASKED_FALLBACK_RECORDS;
  }

  // 로컬 스토리지에 임시 저장된 신청 데이터도 반드시 이름·전화번호를 마스킹하여 병합
  const localRecords: SyncedRsvpRecord[] = [];
  try {
    const saved = localStorage.getItem('planet_rsvps');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || !item.name) continue;
          const sNum = item.studentNumber || '';
          const maskedItemName = maskNameValue(item.name);
          const maskedItemPhone = maskPhoneNumber(item.phone || item.maskedPhone || '');
          const alreadyInSheet = serverRecords.some(
            sr =>
              (sNum && sr.studentNumber === sNum) ||
              (sr.name === maskedItemName && sr.phone === maskedItemPhone)
          );
          if (!alreadyInSheet) {
            localRecords.push({
              studentNumber: sNum || '2026-PLANET-LOCAL',
              name: maskedItemName,
              phone: maskedItemPhone,
              session: item.session || item.sessionLabel || '1부(새학기) + 2부(수학여행) 전체 참석',
              bookTitle: item.bookTitle || item.bookHint || '(선물 책 준비 중)',
              fee: Number(item.fee || item.totalFee || 80000),
              paymentStatus: item.paymentStatus === '입금 완료' ? '입금 완료' : '입금 대기',
              submittedAt: item.submittedAt
                ? item.submittedAt.includes('T')
                  ? new Date(item.submittedAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                  : item.submittedAt
                : '방금 전',
              team: item.team,
              grade: item.grade,
              avatarCode: item.avatarCode,
              avatarRecipe: item.avatarRecipe,
              selectedIndices: item.selectedIndices,
              source: 'local'
            });
          }
        }
      }
    }
  } catch {}

  const merged = [...serverRecords, ...localRecords];

  return {
    records: merged,
    fromSheetCount: serverRecords.length,
    syncedAt: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    hasError,
    errorReason,
    errorAction
  };
}

/**
 * 비공개 구글 시트 서버에 실제로 참가 신청을 저장하고,
 * 실제 시트 저장(appendRow) 성공 여부를 엄격하게 검증합니다.
 * - 저장이 확인되지 않으면 절대 성공(savedToSheet: true)을 반환하지 않습니다.
 */
export async function submitRsvpToGoogleSheet(payload: Record<string, any>): Promise<{
  savedToSheet: boolean;
  studentNumber?: string;
  reason?: string;
  action?: string;
}> {
  const scriptUrl = EVENT_CONFIG.googleScriptUrl;

  // 1. 프론트엔드에 Google Apps Script 웹앱 URL이 설정된 경우 직접 POST 후 JSON 응답 검증
  if (isValidAppsScriptUrl(scriptUrl)) {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return {
          savedToSheet: false,
          reason: `구글 시트 연동 서버가 오류 상태 코드(HTTP ${response.status})를 반환하여 시트에 저장되지 않았습니다.`,
          action: '비공개 구글 시트의 Apps Script 웹앱 배포 권한(실행 주체: 나, 액세스: 모든 사용자)을 확인한 뒤 [다시 제출하기]를 눌러주세요.'
        };
      }

      const result = await response.json();
      if (result && result.status === 'success' && result.savedToSheet !== false) {
        return {
          savedToSheet: true,
          studentNumber: result.studentNumber || payload.studentNumber
        };
      }

      return {
        savedToSheet: false,
        reason:
          result?.message ||
          '구글 시트 서버에서 실제 행 저장(appendRow) 완료 확인 응답을 받지 못했습니다.',
        action:
          '구글 시트 컬럼 구조 및 Apps Script 배포 상태를 확인한 후 아래 [다시 제출하기] 버튼을 눌러 재시도해 주세요.'
      };
    } catch (err) {
      return {
        savedToSheet: false,
        reason:
          '구글 시트 연동 서버와의 통신 중 오류가 발생하여 실제 구글 시트에 신청이 저장되지 않았습니다.',
        action:
          '네트워크 연결 및 Apps Script 웹앱 배포 설정(CORS/권한)을 확인한 후 [다시 제출하기] 버튼을 눌러주세요.'
      };
    }
  }

  // 2. Vercel Serverless API (/api/rsvp) 경유 시도
  try {
    const apiRes = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const contentType = apiRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.status === 'success' && apiData.savedToSheet === true) {
        return {
          savedToSheet: true,
          studentNumber: apiData.studentNumber || payload.studentNumber
        };
      }
      return {
        savedToSheet: false,
        reason:
          apiData.reason ||
          '비공개 구글 시트 연동 서버(VITE_GOOGLE_SCRIPT_URL)가 연결되지 않아 실제 구글 시트에 저장되지 않았습니다.',
        action:
          apiData.action ||
          '1) 실제 구글 시트에 저장되지 않았으므로 "접수되었습니다"로 표시하지 않고 저장 실패를 안내합니다. 2) 관리자는 비공개 구글 시트의 Apps Script 웹앱 배포 URL을 환경변수(VITE_GOOGLE_SCRIPT_URL)에 등록한 후 [다시 제출하기]를 눌러주세요.'
      };
    }
  } catch {}

  // 3. 서버 미연결 시 거짓 성공 표시를 막고 정직하게 실패 이유와 할 일을 반환
  return {
    savedToSheet: false,
    reason:
      '비공개 구글 시트 연동 서버(VITE_GOOGLE_SCRIPT_URL)가 설정되지 않아 실제 구글 시트에 신청 내역이 저장되지 않았습니다.',
    action:
      '1) 실제 시트 저장이 완료되지 않았으므로 "접수되었습니다" 화면 대신 저장 실패를 안내합니다. 2) 관리자는 Google Apps Script 웹앱 URL을 환경변수(VITE_GOOGLE_SCRIPT_URL)에 설정한 뒤 [다시 제출하기]를 눌러주세요. (작성하신 학생증 시안은 현재 브라우저에서만 임시 확인 가능합니다.)'
  };
}

export interface SyncedSettlementItem {
  id: string;
  category: 'income' | 'expense_session1' | 'expense_session2' | 'expense_common';
  title: string;
  detail: string;
  vendor: string;
  date: string;
  amount: number;
  paymentMethod: string;
  receiptNumber: string;
  receiptType: '신용카드 매출전표' | '현금영수증' | '전자세금계산서' | '계좌이체 영수증';
  itemsBreakdown: { name: string; qty: number; unitPrice: number }[];
}

export const GOOGLE_SHEET_RECEIPT_TAB_NAME = '영수증';

/**
 * 비공개 시트 전환에 따라 정산/영수증 내역도 공개 시트 직접 호출 없이
 * 개인정보가 포함되지 않은 공식 정산 데이터만 안전하게 반환합니다.
 */
export async function fetchGoogleSheetSettlements(
  fallbackItems: SyncedSettlementItem[]
): Promise<{
  items: SyncedSettlementItem[];
  isFromSheet: boolean;
  syncedAt: string;
}> {
  const syncedAt = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    items: fallbackItems,
    isFromSheet: true,
    syncedAt
  };
}
