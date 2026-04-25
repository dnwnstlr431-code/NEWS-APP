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
              content: `다음 뉴스를 분석해줘. 내용이 일부만 제공되더라도 주어진 정보만으로 반드시 분석을 완성해줘. 내용 부족을 언급하지 말고 바로 분석 결과만 답변해줘.\n\n제목: ${article.title}\n내용: ${originalText}\n\n아래 형식으로 한국어로 답변해줘:\n\n[한글 번역]\n(제목과 내용을 자연스러운 한국어로 번역)\n\n[AI 요약]\n(${stockName} 투자자 관점에서 2-3문장으로 핵심 요약)\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`
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


// ── 실적 캐시 ───────────────────────────────
async function fetchAndCacheEarnings(stockParam) {
  const ticker = tickers[stockParam];
  const stockName = stockNames[stockParam];
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;

  try {
    const now = new Date();
    const from = new Date(now); from.setFullYear(from.getFullYear() - 1);
    const to = new Date(now); to.setFullYear(to.getFullYear() + 1);
    const today = now.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker}&from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}&token=${finnhubApiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    const earningsArr = data.earningsCalendar || [];

    if (earningsArr.length === 0) {
      console.log(`⚠️ [실적] ${stockName} 데이터 없음`);
      return false;
    }

    const sorted = earningsArr.sort((a, b) => new Date(b.date) - new Date(a.date));
    const past = sorted.filter(e => e.date <= today).slice(0, 4);
    const future = sorted.filter(e => e.date > today).reverse().slice(0, 2);
    const combined = [...future, ...past];

    const earnings = await Promise.all(combined.map(async (item) => {
      const isFuture = item.date > today;
      let beatMiss = '';
      if (!isFuture && item.epsActual !== null && item.epsEstimate !== null) {
        if (item.epsActual > item.epsEstimate) beatMiss = 'BEAT';
        else if (item.epsActual < item.epsEstimate) beatMiss = 'MISS';
        else beatMiss = 'MEET';
      }
      try {
        const prompt = isFuture
          ? `${stockName}(${ticker}) 다음 실적 발표 예정일: ${item.date}, 발표시간: ${item.hour === 'bmo' ? '장 시작 전' : item.hour === 'amc' ? '장 마감 후' : '미정'}, 예상 주당순이익: ${item.epsEstimate !== null ? '$'+item.epsEstimate : '미공개'}\n\n아래 형식으로 한국어로 쉽게 답변해줘:\n\n[발표 예정 포인트]\n투자자들이 주목해야 할 점 2-3가지\n\n[예상 주당순이익 설명]\n주당순이익이 무엇인지 쉽게 설명하고 이번 예상치 의미\n\n[주목할 특이사항]\n이번 실적에 영향을 줄 수 있는 요소 1-2가지`
          : `${stockName}(${ticker}) 실적 결과 - 날짜: ${item.date}, 예상EPS: ${item.epsEstimate}, 실제EPS: ${item.epsActual}, 결과: ${beatMiss}\n\n아래 형식으로 한국어로 쉽게 답변해줘:\n\n[실적 요약]\n핵심 내용 2문장\n\n[투자자 영향]\n투자자에게 미치는 의미 2문장\n\n[다음 분기 전망]\n주목해야 할 점\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
        });
        const cd = await claudeRes.json();
        return { date: item.date, hour: item.hour, hourKo: item.hour === 'bmo' ? '장 시작 전' : item.hour === 'amc' ? '장 마감 후' : '미정', epsEstimate: item.epsEstimate, epsActual: item.epsActual, revenueEstimate: item.revenueEstimate, revenueActual: item.revenueActual, beatMiss, isFuture, analysis: cd.content?.[0]?.text || null };
      } catch {
        return { date: item.date, hour: item.hour, hourKo: item.hour === 'bmo' ? '장 시작 전' : item.hour === 'amc' ? '장 마감 후' : '미정', epsEstimate: item.epsEstimate, epsActual: item.epsActual, revenueEstimate: item.revenueEstimate, revenueActual: item.revenueActual, beatMiss, isFuture, analysis: null };
      }
    }));

    await redis.set(`earnings:${stockParam}`, JSON.stringify({ earnings, updatedAt: new Date().toISOString() }), { ex: 21600 });
    console.log(`✅ [실적] ${stockName} 캐시 완료`);
    return true;
  } catch (error) {
    console.error(`❌ [실적] ${stockName} 실패:`, error);
    return false;
  }
}

// ── 메인 ───────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const stocks = ['palantir', 'iren', 'ionq', 'biomarin'];

  // 즉시 응답 (타임아웃 방지)
  res.status(200).json({
    success: true,
    message: '캐시 갱신 시작 (백그라운드 처리 중)',
    updatedAt: new Date().toISOString()
  });

  // 응답 후 백그라운드에서 순차 처리
  (async () => {
    for (const stock of stocks) {
      await fetchAndCacheNews(stock);
      await new Promise(r => setTimeout(r, 500));
      await fetchAndCacheSec(stock);
      await new Promise(r => setTimeout(r, 500));
      await fetchAndCacheEarnings(stock);
      await new Promise(r => setTimeout(r, 500));
    }
    console.log('✅ 전 종목 캐시 갱신 완료:', new Date().toISOString());
  })();
};
