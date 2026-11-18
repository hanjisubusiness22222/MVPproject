import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { validateYearMonth, parseSuggestions, OPEN_HASA_API_URL } from '../api/suggest.js';
import { getKoreanHolidays } from '../lib/holidays.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('대한민국 공휴일 조회 헬퍼(lib/holidays.js)가 정상 동작한다', () => {
  // 2026년 12월: 성탄절
  const dec2026 = getKoreanHolidays(2026, 12);
  assert.ok(dec2026.length >= 1);
  assert.ok(dec2026.some((h) => h.date === '2026-12-25' && h.name.includes('성탄절')));

  // 2026년 5월: 어린이날, 부처님오신날 등
  const may2026 = getKoreanHolidays(2026, 5);
  assert.ok(may2026.some((h) => h.name.includes('어린이날')));

  // 잘못된 월은 빈 배열 반환
  assert.deepEqual(getKoreanHolidays(2026, 13), []);
  assert.deepEqual(getKoreanHolidays(2026, 0), []);
});

test('연·월 유효성 검사 validateYearMonth 동작 검증', () => {
  assert.equal(validateYearMonth(2026, 12).isValid, true);
  assert.equal(validateYearMonth('2026', '5').isValid, true);
  assert.equal(validateYearMonth(2026, 0).isValid, false);
  assert.equal(validateYearMonth(2026, 13).isValid, false);
  assert.equal(validateYearMonth(1800, 5).isValid, false);
  assert.equal(validateYearMonth(2200, 5).isValid, false);
  assert.equal(validateYearMonth('abc', 5).isValid, false);
});

test('parseSuggestions 파싱 유틸리티가 3가지 한 줄 추천을 잘 추출한다', () => {
  const raw = `
1. 크리스마스 트리 장식하고 가족과 따뜻한 시간 보내기
2. 한 해를 돌아보는 회고록 작성하기
3. 겨울 밤 따뜻한 뱅쇼 만들기
  `;
  const result = parseSuggestions(raw);
  assert.equal(result.length, 3);
  assert.ok(result[0].startsWith('1. '));
  assert.ok(result[1].startsWith('2. '));
  assert.ok(result[2].startsWith('3. '));
});

test('시험 케이스 1 [정상]: 오픈하사를 가짜로 대체하여 정상 응답(200) 및 3가지 추천 확인', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.HASA_API_KEY;

  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    globalThis.fetch = async (url, options) => {
      assert.equal(url, OPEN_HASA_API_URL);
      assert.equal(options.method, 'POST');
      assert.ok(options.headers['Authorization'].startsWith('Bearer '));

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            choices: [
              {
                message: {
                  content: '1. 눈 내리는 겨울 독서 모임 참여하기\n2. 성탄절 카드 손편지로 써서 전하기\n3. 연말 정산 및 새해 목표 3가지 적기'
                }
              }
            ]
          };
        }
      };
    };

    const req = {
      query: { year: '2026', month: '12' }
    };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'success');
    assert.equal(res.body.year, 2026);
    assert.equal(res.body.month, 12);
    assert.equal(res.body.suggestions.length, 3);
    assert.ok(res.body.suggestions[0].includes('겨울 독서 모임'));
    assert.ok(res.body.holidays.some((h) => h.name.includes('성탄절')));
  } finally {
    globalThis.fetch = originalFetch;
    process.env.HASA_API_KEY = originalKey;
  }
});

test('시험 케이스 2 [400]: 잘못된 연·월 입력 시 400 응답 반환', async () => {
  const originalKey = process.env.HASA_API_KEY;
  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    // 13월 테스트
    const reqInvalidMonth = { query: { year: '2026', month: '13' } };
    const res1 = createMockRes();
    await handler(reqInvalidMonth, res1);
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.body.status, 'error');
    assert.ok(res1.body.message.includes('잘못된 연·월'));

    // 연도 누락 테스트
    const reqMissingYear = { query: { month: '5' } };
    const res2 = createMockRes();
    await handler(reqMissingYear, res2);
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.body.status, 'error');
  } finally {
    process.env.HASA_API_KEY = originalKey;
  }
});

test('시험 케이스 3 [키 없음 500]: HASA_API_KEY 환경변수 부재 시 500 응답 반환', async () => {
  const originalKey = process.env.HASA_API_KEY;
  try {
    delete process.env.HASA_API_KEY;

    const req = { query: { year: '2026', month: '12' } };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.status, 'error');
    assert.ok(res.body.message.includes('HASA_API_KEY'));
  } finally {
    process.env.HASA_API_KEY = originalKey;
  }
});

test('시험 케이스 4 [429 한도 초과]: 오픈하사 API 429 응답 시 안내 문구 반환', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.HASA_API_KEY;

  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 429,
        async json() {
          return { error: 'Rate limit exceeded' };
        }
      };
    };

    const req = { query: { year: '2026', month: '12' } };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.body.status, 'error');
    assert.equal(res.body.errorType, 'RATE_LIMIT');
    assert.ok(res.body.message.includes('한도가 초과'));
  } finally {
    globalThis.fetch = originalFetch;
    process.env.HASA_API_KEY = originalKey;
  }
});

test('시험 케이스 5 [시간 초과]: 20초 타임아웃 발생 시 중단 및 안내 문구 반환', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.HASA_API_KEY;

  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    globalThis.fetch = async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    };

    const req = { query: { year: '2026', month: '12' } };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 504);
    assert.equal(res.body.status, 'error');
    assert.equal(res.body.errorType, 'TIMEOUT');
    assert.ok(res.body.message.includes('시간(20초)이 초과'));
  } finally {
    globalThis.fetch = originalFetch;
    process.env.HASA_API_KEY = originalKey;
  }
});
