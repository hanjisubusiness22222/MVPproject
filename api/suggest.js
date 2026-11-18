import { getKoreanHolidays } from '../lib/holidays.js';

export const OPEN_HASA_API_URL = 'https://open.hasa.re.kr/v1/chat/completions';
export const OPEN_HASA_MODEL = 'gemma-4-31b';
export const TIMEOUT_MS = 20000;

export function validateYearMonth(year, month) {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (
    !Number.isInteger(parsedYear) ||
    !Number.isInteger(parsedMonth) ||
    parsedYear < 1900 ||
    parsedYear > 2100 ||
    parsedMonth < 1 ||
    parsedMonth > 12
  ) {
    return {
      isValid: false,
      error: '잘못된 연·월입니다. 연도는 1900~2100 사이, 월은 1~12 사이의 정수여야 합니다.'
    };
  }

  return {
    isValid: true,
    year: parsedYear,
    month: parsedMonth
  };
}

export function parseSuggestions(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return [];
  }

  const lines = rawContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // 번호 목록 또는 불릿으로 시작하는 줄 우선 필터링
  const numbered = lines.filter((line) => /^(\d+[\.\)]|[-*•])\s*/.test(line));
  const chosen = numbered.length >= 3 ? numbered.slice(0, 3) : lines.slice(0, 3);

  // 번호 포맷 정리 (1. 2. 3.)
  return chosen.map((item, idx) => {
    const cleaned = item.replace(/^(\d+[\.\)]|[-*•])\s*/, '').trim();
    return `${idx + 1}. ${cleaned}`;
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 1. 요청 파라미터(연·월) 추출
  let rawYear = req.query?.year;
  let rawMonth = req.query?.month;

  if ((!rawYear || !rawMonth) && req.body) {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    rawYear = rawYear || body?.year;
    rawMonth = rawMonth || body?.month;
  }

  // 2. 연·월 유효성 검사 (잘못된 연·월은 400)
  const validation = validateYearMonth(rawYear, rawMonth);
  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      message: validation.error
    });
  }

  const { year, month } = validation;

  // 3. API 키 검사 (키 없음은 500, 키 값은 절대 노출/출력하지 않음)
  const apiKey = process.env.HASA_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return res.status(500).json({
      status: 'error',
      message: '오픈하사 API 키(HASA_API_KEY)가 설정되어 있지 않습니다.'
    });
  }

  // 4. 해당 월 공휴일 조회
  const holidays = getKoreanHolidays(year, month);
  const holidaySummary = holidays.length > 0
    ? holidays.map((h) => `${h.date}: ${h.name}`).join(', ')
    : '공휴일 없음';

  // 5. 오픈하사 모델 호출 (20초 타임아웃 제한)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPEN_HASA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: OPEN_HASA_MODEL,
        messages: [
          {
            role: 'system',
            content: '당신은 한국의 계절, 일상, 공휴일을 깊이 이해하고 실천하기 좋은 활동을 제안하는 문화 도우미입니다. 사용자가 요청하는 연·월과 공휴일 정보를 참고하여 "이 달에 해 볼 만한 일" 딱 세 가지를 한 줄씩 간결하고 명확하게 추천해 주세요. 서두나 결론 없이 번호(1., 2., 3.)를 붙여 3줄로만 작성하세요.'
          },
          {
            role: 'user',
            content: `${year}년 ${month}월입니다. 이 달의 공휴일 현황: [${holidaySummary}]. 이 달에 해 볼 만한 일 3가지를 각각 한 줄씩 추천해 주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    // 6-1. 한도 초과 (429) 안내 문구 처리
    if (response.status === 429) {
      return res.status(429).json({
        status: 'error',
        errorType: 'RATE_LIMIT',
        message: '오픈하사 AI 요청 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.'
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        message: `오픈하사 AI 서비스 응답 오류 (HTTP ${response.status})`
      });
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';
    const suggestions = parseSuggestions(rawContent);

    return res.status(200).json({
      status: 'success',
      year,
      month,
      holidays,
      suggestions
    });
  } catch (err) {
    clearTimeout(timer);

    // 6-2. 시간 초과 (20초) 안내 문구 처리
    if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.code === 'ABORT_ERR') {
      return res.status(504).json({
        status: 'error',
        errorType: 'TIMEOUT',
        message: '오픈하사 AI 응답 대기 시간(20초)이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: '오픈하사 AI 호출 처리 중 예기치 않은 오류가 발생했습니다.'
    });
  }
}
