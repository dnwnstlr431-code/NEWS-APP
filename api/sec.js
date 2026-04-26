const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const USER_AGENT = 'InvestmentNewsApp/1.0 dnwnstlr431@gmail.com';
const EDGAR_TIMEOUT_MS = 4000;
const MAX_CONTENT_CHARS = 2500;

// EDGAR 요청용 fetch (타임아웃 포함)
async function fetchEdgar(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// 상대 URL → 절대 URL 변환
function resolveUrl(href, baseUrl) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return 'https://www.sec.gov' + href;
  const base = baseUrl.replace(/\/[^\/]+$/, '/');
  return base + href;
}

// HTML → 순수 텍스트 변환
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

// 8-K 인덱스에서 Exhibit 99.1 URL 탐색
function findExhibit99(indexHtml, baseUrl) {
  const rows = indexHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    if (/ex-99\.1|EX-99\.1|press.?release|earnings/i.test(row)) {
      const m = row.match(/href="([^"]+\.htm[l]?)"/i);
      if (m) return resolveUrl(m[1], baseUrl);
    }
  }
  // 폴백: 인덱스에서 첫 번째 .htm 문서
  const fallback = indexHtml.match(/href="([^"]+\.htm[l]?)"/i);
  return fallback ? resolveUrl(fallback[1], baseUrl) : null;
}

// 폼 타입별 핵심 섹션 추출 (3단계 폴백)
function extractKeySection(text, formType) {
  const ft = (formType || '').toUpperCase();

  // 10-K → Item 7 (MD&A)
  if (ft === '10-K' || ft === '20-F') {
    const patterns = [
      /ITEM\s+7[\s.—–-]+MANAGEMENT[''S\s]+DISCUSSION/i,
      /ITEM\s+7[\s.—–-]+/i,
      /Item\s+7\./i,
    ];
    for (const pat of patterns) {
      const idx = text.search(pat);
      if (idx !== -1) {
        const chunk = text.slice(idx, idx + 7000);
        const end = chunk.search(/ITEM\s+7A|ITEM\s+8/i);
        return (end > 300 ? chunk.slice(0, end) : chunk).slice(0, MAX_CONTENT_CHARS);
      }
    }
  }

  // 10-Q → Part I Item 2 (MD&A)
  if (ft === '10-Q' || ft === '6-K') {
    const patterns = [
      /ITEM\s+2[\s.—–-]+MANAGEMENT[''S\s]+DISCUSSION/i,
      /ITEM\s+2[\s.—–-]+/i,
    ];
    for (const pat of patterns) {
      const idx = text.search(pat);
      if (idx !== -1) {
        const chunk = text.slice(idx, idx + 7000);
        const end = chunk.search(/ITEM\s+3/i);
        return (end > 300 ? chunk.slice(0, end) : chunk).slice(0, MAX_CONTENT_CHARS);
      }
    }
  }

  // 8-K → Item 2.02 (실적) 우선, 없으면 전체
  if (ft === '8-K') {
    const idx = text.search(/ITEM\s+2\.0*2/i);
    if (idx !== -1) return text.slice(idx, idx + MAX_CONTENT_CHARS);
    return text.slice(0, MAX_CONTENT_CHARS);
  }

  // ARS → MD&A 또는 Financial Highlights
  if (ft === 'ARS') {
    const idx = text.search(/management[''s\s]+discussion|financial highlights|MD&A/i);
    if (idx !== -1) return text.slice(idx, idx + MAX_CONTENT_CHARS);
  }

  // 기타 (DEF 14A, SC 13G 등): 앞부분 반환
  return text.slice(0, MAX_CONTENT_CHARS);
}

// EDGAR 본문 fetch 메인 함수 (에러 시 항상 null 반환)
async function fetchEdgarContent(filing, formType) {
  // Form 4, 3, SC13G, 144 는 짧거나 이미 Finnhub 데이터로 충분 → 스킵
  const skipForms = ['4', '3', '144', 'SC 13G', 'SC 13G/A', 'SC 13D'];
  if (skipForms.includes(formType)) return null;

  const rawUrl = filing.reportUrl || filing.fileUrl;
  if (!rawUrl) return null;

  try {
    // PDF 여부 확인 (HEAD 요청, 2초 제한)
    try {
      const head = await fetchEdgar(rawUrl, 2000);
      const ct = (head.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('pdf')) return null;
    } catch (_) { /* HEAD 실패해도 계속 */ }

    const isIndexPage = /index\.htm/i.test(rawUrl) || /browse-edgar/i.test(rawUrl);
    let docUrl = rawUrl;

    if (isIndexPage || formType === '8-K') {
      // 인덱스 페이지 파싱해서 실제 문서 URL 찾기
      const idxRes = await fetchEdgar(rawUrl, EDGAR_TIMEOUT_MS);
      if (!idxRes.ok) return null;
      const idxHtml = await idxRes.text();

      if (formType === '8-K') {
        docUrl = findExhibit99(idxHtml, rawUrl) || rawUrl;
      } else {
        // 메인 문서 (.htm) 링크 탐색
        const m = idxHtml.match(/href="([^"]+\.htm[l]?)"/i);
        if (m) docUrl = resolveUrl(m[1], rawUrl);
      }
    }

    const docRes = await fetchEdgar(docUrl, EDGAR_TIMEOUT_MS);
    if (!docRes.ok) return null;

    const ct2 = (docRes.headers.get('content-type') || '').toLowerCase();
    if (ct2.includes('pdf')) return null;

    const html = await docRes.text();
    if (!html || html.length < 200) return null;

    const text = htmlToText(html);
    const section = extractKeySection(text, formType);
    return section && section.length > 100 ? section : null;

  } catch (_) {
    return null; // 모든 예외 → null (폴백)
  }
}

// ── 날짜 KST 변환 ──
function toKSTString(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kst.getUTCDate()).padStart(2, '0');
    return `${y}. ${mo}. ${day}.`;
  } catch (e) { return ''; }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stockParam = req.query.stock || 'palantir';
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;

  const tickers   = { palantir:'PLTR', iren:'IREN', ionq:'IONQ', biomarin:'BMNR' };
  const stockNames = { palantir:'팔란티어', iren:'아이렌', ionq:'아이온큐', biomarin:'비트마인' };
  const formDescriptions = {
    '8-K':'중요사항 보고서', '10-Q':'분기 실적 보고서', '10-K':'연간 실적 보고서',
    '4':'임원 주식 매매', '3':'임원 최초 주식 보유 보고', '144':'내부자 주식 매도 예고',
    'S-1':'신규 상장 관련', 'DEF 14A':'주주총회 위임장', 'SC 13G':'대량 주식 보유 보고',
    'SC 13G/A':'대량 주식 보유 정정', 'SC 13D':'대량 주식 보유 변경',
    '424B4':'증권 발행 설명서', '6-K':'해외기업 수시 보고서', '20-F':'해외기업 연간 보고서',
    'ARS':'연간 주주보고서',
  };

  try {
    const cached = await redis.get(`sec:${stockParam}`);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, sec: data.sec, updatedAt: data.updatedAt, fromCache: true });
    }

    const ticker    = tickers[stockParam]    || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    const [filingsRes, insiderRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${finnhubApiKey}`),
    ]);
    const filingsData    = await filingsRes.json();
    const insiderData    = await insiderRes.json();
    const insiderTxs     = insiderData?.data || [];

    if (!filingsData || filingsData.length === 0) {
      return res.status(200).json({ success: false, sec: [], error: '공시 없음' });
    }

    const seen = new Set();
    const deduped = filingsData.filter(f => {
      const key = `${f.form}-${f.filedDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const recentFilings  = deduped.slice(0, 6); // 타임아웃 여유를 위해 6개로 제한
    const usedTxIndices  = new Set();

    const secFilings = await Promise.all(recentFilings.map(async (filing) => {
      const formType   = filing.form || '기타';
      const formDesc   = formDescriptions[formType] || '기타 공시';
      const filingDate = filing.filedDate || filing.acceptedDate || '';
      // 실제 공시 URL (Finnhub 제공값 우선, 없으면 검색 URL)
      const publicUrl  = filing.reportUrl
        || `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10`;

      // Form 4/3: 내부자 거래 상세 정보
      let detailInfo = '';
      if (formType === '4' || formType === '3') {
        const dateStr = filingDate ? filingDate.substring(0, 10) : '';
        const idx = insiderTxs.findIndex((tx, i) => {
          if (usedTxIndices.has(i)) return false;
          return (tx.transactionDate || tx.filingDate || '').substring(0, 10) === dateStr;
        });
        if (idx !== -1) {
          usedTxIndices.add(idx);
          const tx  = insiderTxs[idx];
          const dir = (tx.change || 0) > 0 ? '매수' : (tx.change || 0) < 0 ? '매도' : '변동없음';
          detailInfo = `거래자: ${tx.name || '알 수 없음'}\n거래유형: ${dir}\n거래수량: ${Math.abs(tx.change || 0).toLocaleString()}주${tx.transactionPrice ? `\n거래가: $${tx.transactionPrice.toFixed(2)}` : ''}`;
        }
      }

      // EDGAR 본문 fetch (Form 4/3/SC13G 등은 내부에서 스킵됨)
      const edgarContent = await fetchEdgarContent(filing, formType);

      try {
        const contentSection = edgarContent
          ? `\n\n공시 본문 핵심 내용:\n${edgarContent}`
          : '';

        const prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}${detailInfo ? `\n\n거래 상세:\n${detailInfo}` : ''}${contentSection}

아래 형식으로 한국어로 답변해줘. 어려운 금융용어는 쉽게 풀어서 설명해줘:

[공시 설명]
${formType} 공시가 무엇인지 1문장 설명

[주요 내용]
${edgarContent ? '위 본문을 바탕으로 이 공시의 핵심 내용을 구체적으로 2~3문장 설명' : '이 공시의 일반적인 핵심 내용 설명'}

[투자자 주목 포인트]
${stockName} 투자자에게 의미하는 바 2문장

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
        });
        const claudeData = await claudeRes.json();

        return {
          form: formType, formDesc,
          filingDate: filingDate ? toKSTString(filingDate) : '날짜 없음',
          analysis: claudeData.content?.[0]?.text || null,
          url: publicUrl,
          hasContent: !!edgarContent, // 본문 기반 분석 여부 (디버깅용)
        };
      } catch (_) {
        return { form: formType, formDesc, filingDate: filingDate ? toKSTString(filingDate) : '날짜 없음', analysis: null, url: publicUrl };
      }
    }));

    const updatedAt = new Date().toISOString();
    await redis.set(`sec:${stockParam}`, JSON.stringify({ sec: secFilings, updatedAt }), { ex: 21600 });

    return res.status(200).json({ success: true, sec: secFilings, updatedAt, fromCache: false });
  } catch (error) {
    return res.status(200).json({ success: false, sec: [], error: error.message });
  }
};
