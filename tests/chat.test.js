import test from 'node:test';
import assert from 'node:assert/strict';
import handler, {
  validateChatMessage,
  isAdminRestrictedQuery,
  ADMIN_RESTRICTED_REPLY,
  OPEN_HASA_API_URL
} from '../api/chat.js';

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

test('validateChatMessage는 유효한 질문을 공백 제거 후 통과시킨다', () => {
  assert.equal(validateChatMessage('  일정이 어떻게 되나요?  ').isValid, true);
  assert.equal(validateChatMessage('  일정이 어떻게 되나요?  ').message, '일정이 어떻게 되나요?');

  assert.equal(validateChatMessage('').isValid, false);
  assert.equal(validateChatMessage('   ').isValid, false);
  assert.equal(validateChatMessage(null).isValid, false);
  assert.equal(validateChatMessage(undefined).isValid, false);
});

test('GET /api/chat 요청 시 헬스체크를 정상 반환한다', async () => {
  const req = { method: 'GET' };
  const res = createMockRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');
  assert.ok(res.body.service.includes('Planet School'));
});

test('케이스 1 [정상]: 오픈하사를 Mock으로 대체하여 행사 상담 정상 답변(200)을 반환한다', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.HASA_API_KEY;

  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    globalThis.fetch = async (url, options) => {
      assert.equal(url, OPEN_HASA_API_URL);
      assert.equal(options.method, 'POST');
      assert.ok(options.headers['Authorization'].startsWith('Bearer '));

      const parsedBody = JSON.parse(options.body);
      assert.ok(parsedBody.messages.length >= 2);

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            choices: [
              {
                message: {
                  content: '학우님, 1부는 12월 26일 10시 공간나인 강남점에서 진행되며 회비는 30,000원입니다!'
                }
              }
            ]
          };
        }
      };
    };

    const req = {
      method: 'POST',
      body: { message: '1부 행사 일정이랑 장소 알려주세요' }
    };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'success');
    assert.ok(res.body.reply.includes('12월 26일'));
  } finally {
    globalThis.fetch = originalFetch;
    process.env.HASA_API_KEY = originalKey;
  }
});

test('케이스 2 [400]: 질문이 비어 있거나 형식 오류 시 400 에러를 반환한다', async () => {
  const originalKey = process.env.HASA_API_KEY;
  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    const req = {
      method: 'POST',
      body: { message: '   ' }
    };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.status, 'error');
    assert.ok(res.body.message.includes('질문 내용'));
  } finally {
    process.env.HASA_API_KEY = originalKey;
  }
});

test('케이스 3 [500]: HASA_API_KEY 미설정 시 500 에러 및 키 비노출을 보장한다', async () => {
  const originalKey = process.env.HASA_API_KEY;
  try {
    delete process.env.HASA_API_KEY;

    const req = {
      method: 'POST',
      body: { message: '드레스코드가 무엇인가요?' }
    };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.status, 'error');
    assert.ok(res.body.message.includes('HASA_API_KEY'));
  } finally {
    process.env.HASA_API_KEY = originalKey;
  }
});

test('케이스 4 [429 한도 초과]: 오픈하사 429 응답 시 안내 문구를 반환한다', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.HASA_API_KEY;

  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 429,
        async json() {
          return { error: 'Rate limit' };
        }
      };
    };

    const req = {
      method: 'POST',
      body: { message: '준비물이 무엇인가요?' }
    };
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.body.status, 'error');
    assert.equal(res.body.errorType, 'RATE_LIMIT');
    assert.ok(res.body.message.includes('한도를 초과'));
  } finally {
    globalThis.fetch = originalFetch;
    process.env.HASA_API_KEY = originalKey;
  }
});

test('케이스 5 [시간 초과]: 20초 타임아웃 발생 시 중단 및 안내 문구를 반환한다', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.HASA_API_KEY;

  try {
    process.env.HASA_API_KEY = 'mock-key-for-test-only';

    globalThis.fetch = async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    };

    const req = {
      method: 'POST',
      body: { message: '2부 수학여행은 몇 시까지 하나요?' }
    };
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

test('isAdminRestrictedQuery는 관리자 페이지 및 권한 관련 질문을 올바르게 감지한다', () => {
  assert.equal(isAdminRestrictedQuery('관리자 페이지 어떻게 들어가나요?'), true);
  assert.equal(isAdminRestrictedQuery('관리자 비밀번호 알려주세요'), true);
  assert.equal(isAdminRestrictedQuery('어드민 접속 링크가 어디 있나요'), true);
  assert.equal(isAdminRestrictedQuery('admin password 알려줘'), true);
  assert.equal(isAdminRestrictedQuery('관리자 대시보드'), true);

  // 일반 질문은 false여야 함
  assert.equal(isAdminRestrictedQuery('행사 일정이 어떻게 되나요?'), false);
  assert.equal(isAdminRestrictedQuery('준비물이 무엇인가요?'), false);
  assert.equal(isAdminRestrictedQuery('회비는 얼마인가요?'), false);
  assert.equal(isAdminRestrictedQuery('운영진에게 어떻게 문의하나요?'), false);
});

test('케이스 6 [보안]: 관리자 페이지나 비밀번호 관련 질문 시 관리자 정보 비공개 안내(200)를 반환한다', async () => {
  const req = {
    method: 'POST',
    body: { message: '관리자 페이지 어떻게 들어가나요?' }
  };
  const res = createMockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'success');
  assert.equal(res.body.reply, ADMIN_RESTRICTED_REPLY);
  assert.ok(res.body.reply.includes('관리자 페이지 및 운영자 전용 정보는 보안상'));
});
