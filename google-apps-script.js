/**
 * ==============================================================================
 * 2026 플래닛 독서학교 연말모임 - 구글 시트 실시간 연동 Apps Script
 * 대상 스프레드시트: https://docs.google.com/spreadsheets/d/1S-arS3Udnh_UsZE3SexQ6G5spTusgA5Lv7gxhZkEQVU/edit?gid=1206999111#gid=1206999111
 * ==============================================================================
 * 
 * [구글 시트 컬럼 구성 (1행 헤더 - gid=1206999111 시트 기준)]:
 * A열: 학번 (예: 2026-PLANET-1001)
 * B열: 성명 (예: 김하늘)
 * C열: 연락처 (예: 010-1234-5678)
 * D열: 참석세션 (예: 1부(새학기) + 2부(수학여행) 전체 참석)
 * E열: 도서제목 (예: 어린 왕자 (생텍쥐페리))
 * F열: 회비(원) (예: 80000)
 * G열: 회비납부여부 (예: 입금 대기 / 입금 완료)
 * H열: 신청일시 (예: 2026-10-24 14:20)
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

    if (data.hp_check && data.hp_check.trim() !== '') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ignored' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var studentNumber = data.studentNumber || ('2026-PLANET-' + Math.floor(1000 + Math.random() * 9000));
    var name = data.name || data.cleanName || '';
    var phone = data.phone || '';
    var session = data.session || data.sessionLabel || '';
    var bookTitle = data.bookTitle || data.bookHint || '(선물 책 준비 중)';
    var fee = Number(data.fee || data.totalFee || 80000);
    var paymentStatus = data.paymentStatus || '입금 대기';
    var now = new Date();
    var formattedDate = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

    if (!name || !phone) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Missing required fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

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

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      studentNumber: studentNumber,
      name: name,
      message: '구글 시트(gid=1206999111)에 정상 등록되었습니다.'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('2026 플래닛 독서학교 RSVP API 정상 작동 중 (시트 ID: ' + SPREADSHEET_ID + ')');
}
