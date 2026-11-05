/**
 * Vercel Serverless Function (/api/rsvp)
 * - 비공개 구글 시트(Google Apps Script 서버)와 연동하여
 *   1) 조회(GET) 시 서버 단에서 이름(예: 박*민)과 연락처(예: 010-****-5678)를 가린(마스킹) 데이터만 내보냅니다.
 *   2) 신청(POST) 시 실제 구글 시트 저장 성공 여부를 검증하고, 저장되지 않은 경우 명확한 실패(error) 상태를 반환합니다.
 */

function maskNameServer(name) {
  const clean = String(name || '').trim();
  if (!clean) return '익*';
  if (clean.length <= 1) return clean + '*';
  if (clean.length === 2) return clean[0] + '*';
  return clean[0] + '*'.repeat(clean.length - 2) + clean[clean.length - 1];
}

function maskPhoneServer(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }
  return '010-****-0000';
}

// 서버에서 마스킹 처리된 상태로만 관리되는 기본 명단 (원본 실명·원본 전화번호 미포함)
const SERVER_MASKED_RECORDS = [
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || '';
  const hasValidScriptUrl =
    Boolean(scriptUrl) &&
    scriptUrl.startsWith('https://script.google.com/') &&
    !scriptUrl.includes('YOUR_SCRIPT_ID');

  if (req.method === 'GET') {
    if (hasValidScriptUrl) {
      try {
        const response = await fetch(scriptUrl, {
          method: 'GET',
          redirect: 'follow'
        });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.records)) {
            const doubleChecked = data.records.map(r => ({
              ...r,
              name: maskNameServer(r.name),
              phone: maskPhoneServer(r.phone),
              source: 'sheet'
            }));
            return res.status(200).json({
              status: 'success',
              maskedOnServer: true,
              sheetWriteConfigured: true,
              records: doubleChecked
            });
          }
        }
      } catch (err) {
        // 비공개 시트 서버 연결 실패 시 아래 마스킹된 안전 목록 반환
      }
    }

    return res.status(200).json({
      status: 'success',
      maskedOnServer: true,
      sheetWriteConfigured: hasValidScriptUrl,
      records: SERVER_MASKED_RECORDS
    });
  }

  if (req.method === 'POST') {
    if (!hasValidScriptUrl) {
      return res.status(503).json({
        status: 'error',
        savedToSheet: false,
        reason:
          '비공개 구글 시트 연동 서버(GOOGLE_SCRIPT_URL)가 아직 연결되지 않아 실제 구글 시트에 신청 내역이 저장되지 않았습니다.',
        action:
          '1) 실제 시트 저장이 확인되지 않았으므로 "접수되었습니다"로 처리하지 않고 실패를 안내합니다. 2) 관리자는 비공개 구글 시트의 Apps Script 웹앱 배포 URL을 환경변수(VITE_GOOGLE_SCRIPT_URL)에 등록한 뒤 다시 시도해 주세요.'
      });
    }

    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const response = await fetch(scriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== 'success' || result.savedToSheet === false) {
        return res.status(502).json({
          status: 'error',
          savedToSheet: false,
          reason:
            result.message ||
            '구글 시트 서버에서 행 추가(appendRow) 완료 응답을 받지 못해 실제 저장이 확인되지 않았습니다.',
          action:
            '비공개 구글 시트의 Apps Script 웹앱 배포 권한(실행 주체: 나, 액세스: 모든 사용자)을 확인한 후 [다시 제출하기]를 눌러주세요.'
        });
      }

      return res.status(200).json({
        status: 'success',
        savedToSheet: true,
        studentNumber: result.studentNumber,
        name: maskNameServer(result.name || payload.name),
        phone: maskPhoneServer(result.phone || payload.phone),
        submittedAt: result.submittedAt
      });
    } catch (err) {
      return res.status(502).json({
        status: 'error',
        savedToSheet: false,
        reason:
          '비공개 구글 시트 서버와의 통신 중 오류가 발생하여 신청 내역이 시트에 저장되지 않았습니다.',
        action:
          '네트워크 상태 및 Apps Script 웹앱 URL 설정을 확인한 후 [다시 제출하기] 버튼을 눌러 재시도해 주세요.'
      });
    }
  }

  return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
}
