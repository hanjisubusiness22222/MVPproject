/**
 * ==============================================================================
 * 2026 플래닛 독서학교 연말모임 - 비공개 구글 시트 보안 연동 서버 (Google Apps Script)
 * ==============================================================================
 * [보안 원칙]
 * 1. 구글 시트 원본은 '제한됨(비공개 - 소유자만 열람 가능)' 상태로 공유를 완전히 끕니다.
 * 2. 외부 클라이언트(브라우저)는 시트에 직접 접근할 수 없으며, 오직 이 Apps Script 서버를 통해서만 통신합니다.
 * 3. doGet(조회) 시 서버에서 이름(예: 김*늘)과 연락처(예: 010-****-5678)를 가린(마스킹) 후 내보내므로,
 *    네트워크 응답 패킷에서도 원본 이름과 전화번호 전체가 절대 노출되지 않습니다.
 * 4. doPost(신청) 시 실제로 시트에 행이 저장(appendRow + flush)된 것을 확인한 후에만
 *    status: 'success' 응답을 반환합니다.
 * ==============================================================================
 */

var SPREADSHEET_ID = '1S-arS3Udnh_UsZE3SexQ6G5spTusgA5Lv7gxhZkEQVU';
var TARGET_GID = 1206999111;

function getTargetSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === TARGET_GID) {
      return sheets[i];
    }
  }
  return ss.getActiveSheet();
}

/**
 * 서버 측 이름 마스킹 (예: "김하늘" -> "김*늘", "이산" -> "이*", "남궁민수" -> "남**수")
 */
function maskNameOnServer(name) {
  var clean = String(name || '').trim();
  if (!clean) return '익*';
  if (clean.length <= 1) return clean + '*';
  if (clean.length === 2) return clean.charAt(0) + '*';
  var middleStars = '';
  for (var i = 0; i < clean.length - 2; i++) {
    middleStars += '*';
  }
  return clean.charAt(0) + middleStars + clean.charAt(clean.length - 1);
}

/**
 * 서버 측 전화번호 마스킹 (예: "010-1234-5678" -> "010-****-5678")
 */
function maskPhoneOnServer(phone) {
  var digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length === 11) {
    return digits.substring(0, 3) + '-****-' + digits.substring(7);
  }
  if (digits.length === 10) {
    return digits.substring(0, 3) + '-***-' + digits.substring(6);
  }
  return '010-****-0000';
}

/**
 * [GET] 비공개 시트에서 데이터를 읽어 서버에서 개인정보(이름·전화번호)를 가린 뒤 반환합니다.
 */
function doGet(e) {
  try {
    var sheet = getTargetSheet();
    var values = sheet.getDataRange().getValues();
    var maskedRecords = [];

    // 1행이 헤더인 경우를 고려하여 전체 행 순회
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var studentNumber = String(row[0] || '').trim();
      var rawName = String(row[1] || '').trim();
      var rawPhone = String(row[2] || '').trim();
      var session = String(row[3] || '').trim();
      var bookTitle = String(row[4] || '(선물 책 준비 중)').trim();
      var rawFee = row[5];
      var fee = typeof rawFee === 'number' ? rawFee : (Number(String(rawFee).replace(/[^0-9]/g, '')) || 80000);
      var rawStatus = String(row[6] || '입금 대기').trim();
      var paymentStatus = rawStatus === '입금 완료' ? '입금 완료' : '입금 대기';
      var submittedAt = row[7] instanceof Date
        ? Utilities.formatDate(row[7], 'Asia/Seoul', 'yyyy-MM-dd HH:mm')
        : String(row[7] || '').trim();

      if (!rawName || rawName === '성명' || studentNumber === '학번') {
        continue;
      }

      // 서버에서 이름과 연락처를 마스킹한 데이터만 외부로 내보냄
      maskedRecords.push({
        studentNumber: studentNumber || ('2026-PLANET-' + (1000 + i)),
        name: maskNameOnServer(rawName),
        phone: maskPhoneOnServer(rawPhone),
        session: session || '1부(새학기) + 2부(수학여행) 전체 참석',
        bookTitle: bookTitle || '(선물 책 준비 중)',
        fee: fee,
        paymentStatus: paymentStatus,
        submittedAt: submittedAt || '2026-10-24'
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      count: maskedRecords.length,
      records: maskedRecords
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * [POST] 신규 참가 신청을 비공개 구글 시트에 실제로 저장하고, 저장 성공 여부를 반환합니다.
 */
function doPost(e) {
  try {
    var sheet = getTargetSheet();
    var data = {};

    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    var studentNumber = data.studentNumber || ('2026-PLANET-' + Math.floor(1000 + Math.random() * 9000));
    var name = String(data.name || data.cleanName || '').trim();
    var phone = String(data.phone || '').trim();
    var session = String(data.session || data.sessionLabel || '').trim();
    var bookTitle = String(data.bookTitle || data.bookHint || '(선물 책 준비 중)').trim();
    var fee = Number(data.fee || data.totalFee || 80000);
    var paymentStatus = data.paymentStatus || '입금 대기';
    var now = new Date();
    var formattedDate = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

    if (!name || name.length < 2 || !phone) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        savedToSheet: false,
        message: '성명(2자 이상)과 연락처는 필수 입력 항목입니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var beforeRowCount = sheet.getLastRow();

    // [A:학번, B:성명, C:연락처, D:참석세션, E:도서제목, F:회비(원), G:회비납부여부, H:신청일시]
    sheet.appendRow([
      studentNumber,
      name,
      phone,
      session,
      bookTitle,
      fee,
      paymentStatus,
      formattedDate
    ]);

    // 실제 시트 반영 강제 확정 및 행 증가 검증
    SpreadsheetApp.flush();
    var afterRowCount = sheet.getLastRow();

    if (afterRowCount <= beforeRowCount) {
      throw new Error('시트 행 추가(appendRow)가 정상 반영되지 않았습니다.');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      savedToSheet: true,
      rowNumber: afterRowCount,
      studentNumber: studentNumber,
      name: maskNameOnServer(name),
      phone: maskPhoneOnServer(phone),
      submittedAt: formattedDate,
      message: '비공개 구글 시트에 실제 저장이 완료되었습니다.'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      savedToSheet: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
