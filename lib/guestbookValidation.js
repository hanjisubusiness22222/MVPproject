/**
 * 한 줄 방명록 입력 검사 유틸리티 (서버 API와 단위 테스트에서 공용 사용)
 * - 이름: 앞뒤 공백 제거 후 1~20자 (유니코드 문자 수 기준)
 * - 내용: 앞뒤 공백 제거 후 1~200자 (유니코드 문자 수 기준)
 */

export const NAME_MIN_LENGTH = 1;
export const NAME_MAX_LENGTH = 20;
export const CONTENT_MIN_LENGTH = 1;
export const CONTENT_MAX_LENGTH = 200;

function countChars(value) {
  return Array.from(value).length;
}

export function validateGuestbookInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      error: {
        field: 'body',
        reason: '요청 본문 형식이 올바르지 않습니다.',
        action: '이름(name)과 내용(content)을 JSON 객체 형태로 전달해 주세요.'
      }
    };
  }

  if (typeof input.name !== 'string') {
    return {
      ok: false,
      error: {
        field: 'name',
        reason: '이름은 문자열로 입력해야 합니다.',
        action: '이름 입력란에 1~20자의 문자를 입력해 주세요.'
      }
    };
  }

  const trimmedName = input.name.trim();
  const nameLen = countChars(trimmedName);

  if (nameLen < NAME_MIN_LENGTH) {
    return {
      ok: false,
      error: {
        field: 'name',
        reason: '이름이 비어 있거나 공백만 입력되었습니다.',
        action: '공백을 제외한 이름을 최소 1자 이상 입력해 주세요.'
      }
    };
  }

  if (nameLen > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: {
        field: 'name',
        reason: `이름이 최대 길이(${NAME_MAX_LENGTH}자)를 초과했습니다 (현재 ${nameLen}자).`,
        action: `이름을 ${NAME_MAX_LENGTH}자 이하로 줄여서 다시 입력해 주세요.`
      }
    };
  }

  if (typeof input.content !== 'string') {
    return {
      ok: false,
      error: {
        field: 'content',
        reason: '방명록 내용은 문자열로 입력해야 합니다.',
        action: '한 줄 방명록 내용 입력란에 1~200자의 문자를 입력해 주세요.'
      }
    };
  }

  const trimmedContent = input.content.trim();
  const contentLen = countChars(trimmedContent);

  if (contentLen < CONTENT_MIN_LENGTH) {
    return {
      ok: false,
      error: {
        field: 'content',
        reason: '방명록 내용이 비어 있거나 공백만 입력되었습니다.',
        action: '응원이나 인사말을 최소 1자 이상 입력해 주세요.'
      }
    };
  }

  if (contentLen > CONTENT_MAX_LENGTH) {
    return {
      ok: false,
      error: {
        field: 'content',
        reason: `방명록 내용이 최대 길이(${CONTENT_MAX_LENGTH}자)를 초과했습니다 (현재 ${contentLen}자).`,
        action: `내용을 ${CONTENT_MAX_LENGTH}자 이하로 줄여서 다시 입력해 주세요.`
      }
    };
  }

  return {
    ok: true,
    data: {
      name: trimmedName,
      content: trimmedContent
    }
  };
}
