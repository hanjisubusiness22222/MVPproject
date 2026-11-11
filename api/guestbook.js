import { createClient } from '@supabase/supabase-js';
import { validateGuestbookInput } from '../lib/guestbookValidation.js';

function getSupabaseReadConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return null;
  }
  return { url, publishableKey };
}

function getSupabaseWriteConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    return null;
  }
  return { url, secretKey };
}

function createServerClient(url, key) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    const cfg = getSupabaseReadConfig();
    if (!cfg) {
      return res.status(500).json({
        status: 'error',
        reason: '서버 환경변수(SUPABASE_URL 또는 SUPABASE_PUBLISHABLE_KEY)가 설정되지 않았습니다.',
        action: 'Vercel 프로젝트 설정의 Environment Variables에서 Supabase 환경변수를 확인해 주세요.'
      });
    }

    try {
      const supabase = createServerClient(cfg.url, cfg.publishableKey);
      const { data, error } = await supabase
        .from('guestbook')
        .select('id, name, content, created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(20);

      if (error) {
        return res.status(502).json({
          status: 'error',
          reason: '방명록 목록을 조회하는 중 데이터베이스 오류가 발생했습니다.',
          action: '잠시 후 다시 불러오기 버튼을 눌러 재시도해 주세요.'
        });
      }

      return res.status(200).json({
        status: 'success',
        entries: Array.isArray(data) ? data : []
      });
    } catch {
      return res.status(502).json({
        status: 'error',
        reason: 'Supabase 서버와 통신하는 중 일시적인 오류가 발생했습니다.',
        action: '네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.'
      });
    }
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          status: 'error',
          field: 'body',
          reason: '요청 JSON 본문을 해석할 수 없습니다.',
          action: '올바른 JSON 형식으로 이름과 내용을 다시 전송해 주세요.'
        });
      }
    }

    const validation = validateGuestbookInput(body);
    if (!validation.ok) {
      return res.status(400).json({
        status: 'error',
        field: validation.error.field,
        reason: validation.error.reason,
        action: validation.error.action
      });
    }

    const cfg = getSupabaseWriteConfig();
    if (!cfg) {
      return res.status(500).json({
        status: 'error',
        reason: '서버 환경변수(SUPABASE_URL 또는 SUPABASE_SECRET_KEY)가 설정되지 않았습니다.',
        action: 'Vercel 프로젝트 설정의 Environment Variables에서 Supabase 환경변수를 확인해 주세요.'
      });
    }

    try {
      const supabase = createServerClient(cfg.url, cfg.secretKey);
      const { data, error } = await supabase
        .from('guestbook')
        .insert([
          {
            name: validation.data.name,
            content: validation.data.content
          }
        ])
        .select('id, name, content, created_at')
        .single();

      if (error || !data) {
        return res.status(502).json({
          status: 'error',
          reason: '방명록을 데이터베이스에 저장하지 못했습니다.',
          action: '잠시 후 다시 등록하기 버튼을 눌러 시도해 주세요.'
        });
      }

      return res.status(201).json({
        status: 'success',
        entry: data
      });
    } catch {
      return res.status(502).json({
        status: 'error',
        reason: '방명록 저장 요청 중 서버 통신 오류가 발생했습니다.',
        action: '네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.'
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({
    status: 'error',
    reason: '허용되지 않은 HTTP 메서드입니다.',
    action: 'GET 또는 POST 요청을 사용해 주세요.'
  });
}
