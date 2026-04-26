const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

  const tickers = { 'palantir':'PLTR','iren':'IREN','ionq':'IONQ','biomarin':'BMNR' };
  const stockNames = { 'palantir':'팔란티어','iren':'아이렌','ionq':'아이온큐','biomarin':'비트마인' };
  const formDescriptions = {
    '8-K':'중요사항 보고서','10-Q':'분기 실적 보고서','10-K':'연간 실적 보고서',
    '4':'임원 주식 매매','3':'임원 최초 주식 보유 보고','144':'내부자 주식 매도 예고',
    'S-1':'신규 상장 관련','DEF 14A':'주주총회 위임장','SC 13G':'대량 주식 보유 보고',
    'SC 13G/A':'대량 주식 보유 정정','SC 13D':'대량 주식 보유 변경',
    '424B4':'증권 발행 설명서','6-K':'해외기업 수시 보고서','20-F':'해외기업 연간 보고서'
  };

  try {
    const cached = await redis.get(`sec:${stockParam}`);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, sec: data.sec, updatedAt: data.updatedAt, fromCache: true });
    }

    const ticker = tickers[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    const [filingsRes, insiderRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${finnhubApiKey}`)
    ]);
    const filingsData = await filingsRes.json();
    const insiderData = await insiderRes.json();
    const insiderTransactions = insiderData?.data || [];

    if (!filingsData || filingsData.length === 0) {
      return res.status(200).json({ success: false, sec: [], error: '공시 없음' });
    }

    const seen = new Set();
    const deduped = filingsData.filter(filing => {
      const key = `${filing.form}-${filing.filedDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const recentFilings = deduped.slice(0, 8);
    const usedTxIndices = new Set();

    const secFilings = await Promise.all(recentFilings.map(async (filing) => {
      const formType = filing.form || '기타';
      const formDesc = formDescriptions[formType] || '기타 공시';
      const filingDate = filing.filedDate || filing.acceptedDate || '';
      const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10&search_text=`;

      let detailInfo = '';
      if (formType === '4' || formType === '3') {
        const filingDateStr = filingDate ? filingDate.substring(0, 10) : '';
        const matchIdx = insiderTransactions.findIndex((tx, idx) => {
          if (usedTxIndices.has(idx)) return false;
          return (tx.transactionDate || tx.filingDate || '').substring(0, 10) === filingDateStr;
        });
        if (matchIdx !== -1) {
          usedTxIndices.add(matchIdx);
          const tx = insiderTransactions[matchIdx];
          const change = tx.change || 0;
          const txType = change > 0 ? '매수' : change < 0 ? '매도' : '변동없음';
          detailInfo = `거래자: ${tx.name || '알 수 없음'}\n거래유형: ${txType}\n거래수량: ${Math.abs(change).toLocaleString()}주${tx.transactionPrice ? `\n거래가: $${tx.transactionPrice.toFixed(2)}` : ''}`;
        }
      }

      try {
        const prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}${detailInfo ? `\n\n거래 상세:\n${detailInfo}` : ''}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n${formType} 공시가 무엇인지 1문장 설명\n\n[주요 내용]\n이 공시의 핵심 내용 설명\n\n[투자자 주목 포인트]\n${stockName} 투자자에게 의미하는 바 2문장\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
        });
        const claudeData = await claudeRes.json();

        return {
          form: formType, formDesc,
          filingDate: filingDate ? toKSTString(filingDate) : '날짜 없음',
          analysis: claudeData.content?.[0]?.text || null, url
        };
      } catch (err) {
        return { form: formType, formDesc, filingDate: filingDate ? toKSTString(filingDate) : '날짜 없음', analysis: null, url };
      }
    }));

    const updatedAt = new Date().toISOString();
    await redis.set(`sec:${stockParam}`, JSON.stringify({ sec: secFilings, updatedAt }), { ex: 21600 });

    return res.status(200).json({ success: true, sec: secFilings, updatedAt, fromCache: false });
  } catch (error) {
    return res.status(200).json({ success: false, sec: [], error: error.message });
  }
};
