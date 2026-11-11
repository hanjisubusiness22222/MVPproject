import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGuestbookInput } from '../lib/guestbookValidation.js';
import guestbookHandler, { normalizeSupabaseUrl } from '../api/guestbook.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
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

test('정상 입력은 앞뒤 공백을 제거하고 통과한다', () => {
  const result = validateGuestbookInput({
    name: '  김플래닛  ',
    content: '  연말모임에서 책 이야기 나눠서 즐거웠어요!  '
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    name: '김플래닛',
    content: '연말모임에서 책 이야기 나눠서 즐거웠어요!'
  });
});

test('경계값: 이름 1자, 내용 1자 및 이름 20자, 내용 200자는 통과한다', () => {
  const minResult = validateGuestbookInput({
    name: '김',
    content: '굿'
  });
  assert.equal(minResult.ok, true);

  const maxResult = validateGuestbookInput({
    name: '가'.repeat(20),
    content: '나'.repeat(200)
  });
  assert.equal(maxResult.ok, true);
});

test('빈 이름 또는 공백만 있는 이름은 거절된다', () => {
  const emptyName = validateGuestbookInput({ name: '', content: '반갑습니다' });
  assert.equal(emptyName.ok, false);
  assert.equal(emptyName.error.field, 'name');

  const blankName = validateGuestbookInput({ name: '   ', content: '반갑습니다' });
  assert.equal(blankName.ok, false);
  assert.equal(blankName.error.field, 'name');
});

test('이름이 21자 이상이면 거절된다', () => {
  const longName = validateGuestbookInput({
    name: '가'.repeat(21),
    content: '반갑습니다'
  });

  assert.equal(longName.ok, false);
  assert.equal(longName.error.field, 'name');
});

test('빈 내용 또는 공백만 있는 내용은 거절된다', () => {
  const emptyContent = validateGuestbookInput({ name: '김플래닛', content: '' });
  assert.equal(emptyContent.ok, false);
  assert.equal(emptyContent.error.field, 'content');

  const blankContent = validateGuestbookInput({ name: '김플래닛', content: '   \n\t  ' });
  assert.equal(blankContent.ok, false);
  assert.equal(blankContent.error.field, 'content');
});

test('내용이 201자 이상이면 거절된다', () => {
  const longContent = validateGuestbookInput({
    name: '김플래닛',
    content: '가'.repeat(201)
  });

  assert.equal(longContent.ok, false);
  assert.equal(longContent.error.field, 'content');
});

test('잘못된 타입 입력(문자열 아님 또는 null 본문)은 거절된다', () => {
  const invalidBody = validateGuestbookInput(null);
  assert.equal(invalidBody.ok, false);
  assert.equal(invalidBody.error.field, 'body');

  const nonStringName = validateGuestbookInput({ name: 123, content: '안녕' });
  assert.equal(nonStringName.ok, false);
  assert.equal(nonStringName.error.field, 'name');

  const nonStringContent = validateGuestbookInput({ name: '김플래닛', content: null });
  assert.equal(nonStringContent.ok, false);
  assert.equal(nonStringContent.error.field, 'content');
});

test('API POST는 잘못된 입력에 대해 DB 호출 전에 400을 반환한다', async () => {
  const req = {
    method: 'POST',
    body: { name: ' ', content: '안녕하세요' }
  };
  const res = createMockRes();

  await guestbookHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'error');
  assert.equal(res.body.field, 'name');
});

test('API는 GET/POST 외의 메서드에 405를 반환한다', async () => {
  const req = { method: 'DELETE' };
  const res = createMockRes();

  await guestbookHandler(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET, POST');
});

test('SUPABASE_URL 끝에 /rest/v1이나 슬래시가 붙어 있어도 프로젝트 기본 URL로 정규화한다', () => {
  assert.equal(
    normalizeSupabaseUrl('https://example.supabase.co/rest/v1/'),
    'https://example.supabase.co'
  );
  assert.equal(
    normalizeSupabaseUrl('https://example.supabase.co/rest/v1'),
    'https://example.supabase.co'
  );
  assert.equal(
    normalizeSupabaseUrl(' https://example.supabase.co/ '),
    'https://example.supabase.co'
  );
});
