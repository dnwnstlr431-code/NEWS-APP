const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stocks = ['palantir', 'iren', 'ionq', 'biomarin'];
const tickers = { 'palantir':'PLTR','iren':'IREN','ionq':'IONQ','biomarin':'BMNR' };
const stockNames = { 'palantir':'팔란티어','iren':'아이렌','ionq':'아이온큐','biomarin':'비트마인' };

function toKSTString(dateStr, includeTime = true) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kst.getUTCDate()).padStart(2, '0');
    if (!includeTime) return `${y}. ${mo}. ${day}.`;
    const h = kst.getUTCHours();
    const mi = String(kst.getUTCMinutes()).padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = String(h % 12 || 12).padStart(2, '0');
    return `${y}. ${mo}. ${day}. ${ampm} ${h12}:${mi}`;
  } catch (e) { return ''; }
}

// 뉴스 직접 가져와서 캐시 저장
async function fetchAndCacheNews(stock) {
  const ticker = tickers[stock];
  const stockName = stockNames[stock];
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  try {
    const rssRes = await fetch(`https://finance.yahoo.com/rss/headline?s=${ticker}`);
    const rssText = await rssRes.text();
    const items = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    const articles = items.slice(0, 5).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/) || [])[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      return { title: title.trim(), description: description.replace(/<[^>]*>/g, '').trim(), link: link.trim(), pubDate: pubDate.trim() };
    });

    const news = await Promise.all(articles.map(async (article) => {
      const originalText = article.description || article.title || '내용 없음';
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            messages: [{ role: 'user', content: `다음 뉴스를 분석해줘. 내용이 일부만 제공되더라도 주어진 정보만으로 반드시 분석을 완성해줘. 내용 부족을 언급하지 말고 바로 분석 결과만 답변해줘.\n\n제목: ${article.title}\n내용: ${originalText}\n\n아래 형식으로 한국어로 답변해줘:\n\n[한글 번역]\n(제목과 내용을 자연스러운 한국어로 번역)\n\n[AI 요약]\n(${stockName} 투자자 관점에서 2-3문장으로 핵심 요약)\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄` }]
          })
        });
        const cd = await claudeRes.json();
        return { title: article.title, originalContent: originalText, analysis: cd.content?.[0]?.text || null, source: 'Yahoo Finance', publishedAt: toKSTString(article.pubDate), url: article.link };
      } catch {
        return { title: article.title, originalContent: originalText, analysis: null, source: 'Yahoo Finance', publishedAt: toKSTString(article.pubDate), url: article.link };
      }
    }));

    await redis.set(`news:${stock}`, JSON.stringify({ news, updatedAt: new Date().toISOString() }), { ex: 7200 });
    return news;
  } catch (e) {
    console.error(`뉴스 캐시 실패 [${stock}]:`, e.message);
    return [];
  }
}

// SEC 직접 가져와서 캐시 저장
async function fetchAndCacheSec(stock) {
  const ticker = tickers[stock];
  const stockName = stockNames[stock];
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;
  const formDescriptions = {
    '8-K':'중요사항 보고서','10-Q':'분기 실적 보고서','10-K':'연간 실적 보고서',
    '4':'임원 주식 매매','3':'임원 최초 주식 보유 보고','144':'내부자 주식 매도 예고',
    'S-1':'신규 상장 관련','DEF 14A':'주주총회 위임장','SC 13G':'대량 주식 보유 보고',
    'SC 13G/A':'대량 주식 보유 정정','SC 13D':'대량 주식 보유 변경',
    '424B4':'증권 발행 설명서','6-K':'해외기업 수시 보고서','20-F':'해외기업 연간 보고서'
  };
  try {
    const [filingsRes, insiderRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${finnhubApiKey}`)
    ]);
    const filingsData = await filingsRes.json();
    const insiderTransactions = (await insiderRes.json())?.data || [];
    if (!filingsData || filingsData.length === 0) return [];

    const seen = new Set();
    const deduped = filingsData.filter(f => { const k=`${f.form}-${f.filedDate}`; if(seen.has(k))return false; seen.add(k); return true; });
    const usedTxIndices = new Set();

    const sec = await Promise.all(deduped.slice(0, 8).map(async (filing) => {
      const formType = filing.form || '기타';
      const formDesc = formDescriptions[formType] || '기타 공시';
      const filingDate = filing.filedDate || filing.acceptedDate || '';
      const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10&search_text=`;
      let detailInfo = '';
      if (formType === '4' || formType === '3') {
        const matchIdx = insiderTransactions.findIndex((tx, idx) => {
          if (usedTxIndices.has(idx)) return false;
          return (tx.transactionDate || tx.filingDate || '').substring(0, 10) === filingDate.substring(0, 10);
        });
        if (matchIdx !== -1) {
          usedTxIndices.add(matchIdx);
          const tx = insiderTransactions[matchIdx];
          const change = tx.change || 0;
          detailInfo = `거래자: ${tx.name||'알 수 없음'}\n거래유형: ${change>0?'매수':change<0?'매도':'변동없음'}\n거래수량: ${Math.abs(change).toLocaleString()}주`;
        }
      }
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}${detailInfo?`\n\n거래 상세:\n${detailInfo}`:''}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n${formType} 공시가 무엇인지 1문장 설명\n\n[주요 내용]\n이 공시의 핵심 내용 설명\n\n[투자자 주목 포인트]\n${stockName} 투자자에게 의미하는 바 2문장\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄` }] })
        });
        const cd = await claudeRes.json();
        return { form: formType, formDesc, filingDate: filingDate ? toKSTString(filingDate, false) : '날짜 없음', analysis: cd.content?.[0]?.text || null, url };
      } catch {
        return { form: formType, formDesc, filingDate: filingDate ? toKSTString(filingDate, false) : '날짜 없음', analysis: null, url };
      }
    }));

    await redis.set(`sec:${stock}`, JSON.stringify({ sec, updatedAt: new Date().toISOString() }), { ex: 21600 });
    return sec;
  } catch (e) {
    console.error(`SEC 캐시 실패 [${stock}]:`, e.message);
    return [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const allNews = [];
    const allSec = [];
    const allEarnings = [];
    const today = new Date().toISOString().split('T')[0];

    await Promise.all(stocks.map(async (stock) => {
      try {
        let [newsCache, secCache, earningsCache] = await Promise.all([
          redis.get(`news:${stock}`),
          redis.get(`sec:${stock}`),
          redis.get(`earnings:${stock}`)
        ]);

        // 캐시 없으면 직접 생성
        if (!newsCache) {
          const news = await fetchAndCacheNews(stock);
          if (news.length > 0) {
            news.slice(0, 5).forEach(item => {
              allNews.push({ stock, ticker: tickers[stock], title: item.title, publishedAt: item.publishedAt, _sortDate: new Date(item.publishedAt || 0).getTime() || 0 });
            });
          }
        } else {
          const data = typeof newsCache === 'string' ? JSON.parse(newsCache) : newsCache;
          (data.news || []).slice(0, 5).forEach(item => {
            allNews.push({ stock, ticker: tickers[stock], title: item.title, publishedAt: item.publishedAt, _sortDate: new Date(item.publishedAt || 0).getTime() || 0 });
          });
        }

        if (!secCache) {
          const sec = await fetchAndCacheSec(stock);
          if (sec.length > 0) {
            sec.slice(0, 4).forEach(item => {
              allSec.push({ stock, ticker: tickers[stock], form: item.form, formDesc: item.formDesc, filingDate: item.filingDate, _sortDate: new Date(item.filingDate || 0).getTime() || 0 });
            });
          }
        } else {
          const data = typeof secCache === 'string' ? JSON.parse(secCache) : secCache;
          (data.sec || []).slice(0, 4).forEach(item => {
            allSec.push({ stock, ticker: tickers[stock], form: item.form, formDesc: item.formDesc, filingDate: item.filingDate, _sortDate: new Date(item.filingDate || 0).getTime() || 0 });
          });
        }

        if (earningsCache) {
          const data = typeof earningsCache === 'string' ? JSON.parse(earningsCache) : earningsCache;
          (data.earnings || []).slice(0, 3).forEach(item => {
            allEarnings.push({ stock, ticker: tickers[stock], date: item.date, hourKo: item.hourKo, epsEstimate: item.epsEstimate, epsActual: item.epsActual, beatMiss: item.beatMiss, isFuture: item.isFuture, _sortDate: new Date(item.date || 0).getTime() || 0 });
          });
        }
      } catch (e) {
        console.error(`종목 처리 실패 [${stock}]:`, e.message);
      }
    }));

    allNews.sort((a, b) => b._sortDate - a._sortDate);
    allSec.sort((a, b) => b._sortDate - a._sortDate);
    allEarnings.sort((a, b) => {
      if (a.isFuture && !b.isFuture) return -1;
      if (!a.isFuture && b.isFuture) return 1;
      return a.isFuture ? a._sortDate - b._sortDate : b._sortDate - a._sortDate;
    });

    return res.status(200).json({
      success: true,
      news: allNews.slice(0, 8),
      sec: allSec.slice(0, 8),
      earnings: allEarnings.slice(0, 8)
    });

  } catch (error) {
    return res.status(200).json({ success: false, news: [], sec: [], earnings: [], error: error.message });
  }
};
