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

export const GOOGLE_SHEET_ID = '1S-arS3Udnh_UsZE3SexQ6G5spTusgA5Lv7gxhZkEQVU';
export const GOOGLE_SHEET_GID = '1206999111';
export const GOOGLE_SHEET_VIEW_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?gid=${GOOGLE_SHEET_GID}#gid=${GOOGLE_SHEET_GID}`;
export const GOOGLE_SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&gid=${GOOGLE_SHEET_GID}`;

/**
 * 구글 스프레드시트(gid=1206999111)에서 실시간으로 신청자 명단을 불러오고
 * 브라우저 로컬 신청 데이터와 병합하여 반환합니다.
 */
export async function fetchGoogleSheetRecords(): Promise<{
  records: SyncedRsvpRecord[];
  fromSheetCount: number;
  syncedAt: string;
}> {
  const sheetRecords: SyncedRsvpRecord[] = [];

  try {
    const response = await fetch(`${GOOGLE_SHEET_GVIZ_URL}&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      const rows = json?.table?.rows || [];
      for (const row of rows) {
        const c = row?.c || [];
        const studentNumber = String(c[0]?.v ?? c[0]?.f ?? '').trim();
        const name = String(c[1]?.v ?? c[1]?.f ?? '').trim();
        const phone = String(c[2]?.v ?? c[2]?.f ?? '').trim();
        const session = String(c[3]?.v ?? c[3]?.f ?? '').trim();
        const bookTitle = String(c[4]?.v ?? c[4]?.f ?? '(선물 책 준비 중)').trim();
        const rawFee = c[5]?.v ?? c[5]?.f ?? 80000;
        const fee = typeof rawFee === 'number' ? rawFee : Number(String(rawFee).replace(/[^0-9]/g, '')) || 80000;
        const rawStatus = String(c[6]?.v ?? c[6]?.f ?? '입금 대기').trim();
        const paymentStatus: '입금 완료' | '입금 대기' =
          rawStatus === '입금 완료' ? '입금 완료' : '입금 대기';
        const submittedAt = String(c[7]?.f ?? c[7]?.v ?? '').trim();

        // 헤더 행이 데이터로 들어온 경우 스킵
        if (!name || name === '성명' || studentNumber === '학번') continue;

        sheetRecords.push({
          studentNumber: studentNumber || `2026-PLANET-0000`,
          name,
          phone,
          session: session || '1부(새학기) + 2부(수학여행) 전체 참석',
          bookTitle: bookTitle || '(선물 책 준비 중)',
          fee,
          paymentStatus,
          submittedAt: submittedAt || '2026-10-24',
          source: 'sheet'
        });
      }
    }
  } catch (err) {
    console.warn('구글 시트 실시간 조회 실패, 로컬 캐시로 대체합니다:', err);
  }

  // 로컬 스토리지에 저장된 신규 신청 데이터 병합 (중복 학번 제외)
  const localRecords: SyncedRsvpRecord[] = [];
  try {
    const saved = localStorage.getItem('planet_rsvps');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || !item.name) continue;
          const sNum = item.studentNumber || '';
          const alreadyInSheet = sheetRecords.some(
            sr =>
              (sNum && sr.studentNumber === sNum) ||
              (sr.name === item.name && sr.phone === item.phone)
          );
          if (!alreadyInSheet) {
            localRecords.push({
              studentNumber: sNum || `2026-PLANET-LOCAL`,
              name: item.name,
              phone: item.phone || '',
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

  const merged = [...sheetRecords, ...localRecords];

  return {
    records: merged,
    fromSheetCount: sheetRecords.length,
    syncedAt: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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
export const GOOGLE_SHEET_RECEIPT_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(GOOGLE_SHEET_RECEIPT_TAB_NAME)}`;

/**
 * 구글 스프레드시트의 '영수증' 시트 탭에서 실시간으로 정산/영수증 내역을 불러옵니다.
 * - 시트 컬럼 순서: [구분, 항목명, 세부내용, 거래처, 결제일자, 금액(원), 결제수단, 영수증종류, 증빙번호, 품목상세]
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

  try {
    const response = await fetch(`${GOOGLE_SHEET_RECEIPT_GVIZ_URL}&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return { items: fallbackItems, isFromSheet: false, syncedAt };
    }

    const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
    const cols = json?.table?.cols || [];
    const rows = json?.table?.rows || [];

    // 만약 '영수증' 탭이 아직 없어서 기본 첫 번째 탭(학번, 성명...)이 반환된 경우 fallback 반환
    const firstColLabel = String(cols[0]?.label ?? '').trim();
    if (firstColLabel === '학번') {
      return { items: fallbackItems, isFromSheet: false, syncedAt };
    }

    const parsedItems: SyncedSettlementItem[] = [];

    rows.forEach((row: any, idx: number) => {
      const c = row?.c || [];
      const rawCat = String(c[0]?.v ?? c[0]?.f ?? '').trim();
      const title = String(c[1]?.v ?? c[1]?.f ?? '').trim();
      if (!title || title === '항목명' || rawCat === '구분') return;

      let category: SyncedSettlementItem['category'] = 'expense_common';
      if (rawCat.includes('수입') || rawCat === 'income') category = 'income';
      else if (rawCat.includes('1부') || rawCat === 'expense_session1') category = 'expense_session1';
      else if (rawCat.includes('2부') || rawCat === 'expense_session2') category = 'expense_session2';
      else category = 'expense_common';

      const detail = String(c[2]?.v ?? c[2]?.f ?? '').trim();
      const vendor = String(c[3]?.v ?? c[3]?.f ?? '플래닛 지정 거래처').trim();
      const date = String(c[4]?.f ?? c[4]?.v ?? '2026-12-19').trim();
      const rawAmount = c[5]?.v ?? c[5]?.f ?? 0;
      const amount =
        typeof rawAmount === 'number'
          ? rawAmount
          : Number(String(rawAmount).replace(/[^0-9]/g, '')) || 0;
      const paymentMethod = String(c[6]?.v ?? c[6]?.f ?? '신용카드 (일시불)').trim();
      const rawReceiptType = String(c[7]?.v ?? c[7]?.f ?? '신용카드 매출전표').trim();
      const receiptType: SyncedSettlementItem['receiptType'] =
        rawReceiptType === '현금영수증' ||
        rawReceiptType === '전자세금계산서' ||
        rawReceiptType === '계좌이체 영수증'
          ? rawReceiptType
          : '신용카드 매출전표';
      const receiptNumber = String(c[8]?.v ?? c[8]?.f ?? `REC-2026-${100 + idx}`).trim();
      const rawBreakdown = String(c[9]?.v ?? c[9]?.f ?? '').trim();

      let itemsBreakdown: { name: string; qty: number; unitPrice: number }[] = [];
      if (rawBreakdown) {
        itemsBreakdown = rawBreakdown
          .split('|')
          .map(part => {
            const segs = part.split(':').map(s => s.trim());
            if (segs.length >= 3) {
              const qty = Number(segs[1].replace(/[^0-9]/g, '')) || 1;
              const unitPrice = Number(segs[2].replace(/[^0-9]/g, '')) || amount;
              return { name: segs[0], qty, unitPrice };
            }
            return { name: segs[0] || title, qty: 1, unitPrice: amount };
          })
          .filter(b => b.name);
      }
      if (itemsBreakdown.length === 0) {
        itemsBreakdown = [{ name: title, qty: 1, unitPrice: amount }];
      }

      parsedItems.push({
        id: `SHEET-${idx + 1}`,
        category,
        title,
        detail,
        vendor,
        date,
        amount,
        paymentMethod,
        receiptNumber,
        receiptType,
        itemsBreakdown
      });
    });

    if (parsedItems.length === 0) {
      return { items: fallbackItems, isFromSheet: false, syncedAt };
    }

    return {
      items: parsedItems,
      isFromSheet: true,
      syncedAt
    };
  } catch (err) {
    console.warn('구글 시트 영수증 탭 조회 전 기본 샘플 데이터 표시:', err);
    return { items: fallbackItems, isFromSheet: false, syncedAt };
  }
}

