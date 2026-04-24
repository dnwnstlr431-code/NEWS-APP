const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stockNames = {
  'palantir': '팔란티어',
  'iren': '아이렌',
  'ionq': '아이온큐',
  'biomarin': '비트마인'
};

const tickers = {
  'palantir': 'PLTR',
  'iren': 'IREN',
  'ionq': 'IONQ',
  'biomarin': 'BMNR'
};

const formDescriptions = {
  '8-K': '중요사항 보고서',
  '10-Q': '분기 실적 보고서',
  '10-K': '연간 실적 보고서',
  '4': '임원 주식 매매',
  '3': '임원 최초 주식 보유 보고',
  '144': '내부자 주식 매도 예고',
  'S-1': '신규 상장 관련',
  'DEF 14A': '주주총회 위임장',
  'SC 13G': '대량 주식 보유 보고',
  'SC 13G/A': '대량 주식 보유 정정',
  'SC 13D': '대량 주식 보유 변경',
  '424B4': '증권 발행 설명서',
  '6-K': '해외기업 수시 보고서',
  '20-F': '해외기업 연간 보고서'
};

// ── 뉴스 캐시 ──────────────────────────────
async function fetchAndCacheNews(stockParam) {
  const ticker = tickers[stockParam];
  const stockName = stockNames[stockParam];
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  try {
    const rssUrl = `https://finance.yahoo.com/rss/headline?s=${ticker}`;
    const rssRes = await fetch(rssUrl);
    const rssText = await rssRes.text();
    const items = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];

    const articles = items.slice(0, 5).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     item.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                           item.match(/<description>(.*?)<\/description>/) || [])[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      return {
        title: title.trim(),
        description: description.replace(/<[^>]*>/g, '').trim(),
        link: link.trim(),
        pubDate: pubDate.trim()
      };
    });

    const news = await Promise.all(articles.map(async (article) => {
      const originalText = article.description || article.title || '내용 없음';
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `다음 뉴스를 분석해줘.\n\n제목: ${article.title}\n내용: ${originalText}\n\n아래 형식으로 한국어로 답변해줘:\n\n[한글 번역]\n(뉴스 내용을 자연스러운 한국어로 번역)\n\n[AI 요약]\n(${stockName} 투자자 관점에서 2-3문장으로 핵심 요약)\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`
            }]
          })
        });
        const claudeData = await claudeRes.json();
        return {
          title: article.title,
          originalContent: originalText,
          analysis: claudeData.content?.[0]?.text || null,
          source: 'Yahoo Finance',
          publishedAt: new Date(article.pubDate).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }),
          url: article.link
        };
      } catch {
        return {
          title: article.title,
          originalContent: originalText,
          analysis: null,
          source: 'Yahoo Finance',
          publishedAt: new Date(article.pubDate).toLocaleDateString('ko-KR'),
          url: article.link
        };
      }
    }));

    await redis.set(`news:${stockParam}`, JSON.stringify({ news, updatedAt: new Date().toISOString() }), { ex: 7200 });
    console.log(`✅ [뉴스] ${stockName} 캐시 완료`);
    return true;
  } catch (error) {
    console.error(`❌ [뉴스] ${stockName} 실패:`, error);
    return false;
  }
}

// ── SEC 캐시 ───────────────────────────────
async function fetchAndCacheSec(stockParam) {
  const ticker = tickers[stockParam];
  const stockName = stockNames[stockParam];
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;

  try {
    const [filingsRes, insiderRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${finnhubApiKey}`)
    ]);
    const filingsData = await filingsRes.json();
    const insiderData = await insiderRes.json();
    const insiderTransactions = insiderData?.data || [];

    if (!filingsData || filingsData.length === 0) {
      console.log(`⚠️ [SEC] ${stockName} 공시 없음`);
      return false;
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
        let prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}${detailInfo ? `\n\n거래 상세:\n${detailInfo}` : ''}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n${formType} 공시가 무엇인지 1문장 설명\n\n[주요 내용]\n이 공시의 핵심 내용 설명\n\n[투자자 주목 포인트]\n${stockName} 투자자에게 의미하는 바 2문장\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const claudeData = await claudeRes.json();

        return {
          form: formType,
          formDesc,
          filingDate: filingDate ? new Date(filingDate).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          }) : '날짜 없음',
          analysis: claudeData.content?.[0]?.text || null,
          url
        };
      } catch {
        return { form: formType, formDesc, filingDate, analysis: null, url };
      }
    }));

    await redis.set(`sec:${stockParam}`, JSON.stringify({ sec: secFilings, updatedAt: new Date().toISOString() }), { ex: 21600 });
    console.log(`✅ [SEC] ${stockName} 캐시 완료`);
    return true;
  } catch (error) {
    console.error(`❌ [SEC] ${stockName} 실패:`, error);
    return false;
  }
}

// ── 메인 ───────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const stocks = ['palantir', 'iren', 'ionq', 'biomarin'];
  const results = { news: {}, sec: {} };

  for (const stock of stocks) {
    // 뉴스 갱신
    results.news[stock] = await fetchAndCacheNews(stock);
    await new Promise(r => setTimeout(r, 800));

    // SEC 갱신
    results.sec[stock] = await fetchAndCacheSec(stock);
    await new Promise(r => setTimeout(r, 800));
  }

  return res.status(200).json({
    success: true,
    message: '뉴스 + SEC 전 종목 캐시 완료',
    results,
    updatedAt: new Date().toISOString()
  });
};
