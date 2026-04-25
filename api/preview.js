const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stocks = ['palantir', 'iren', 'ionq', 'biomarin'];
const tickers = { 'palantir':'PLTR','iren':'IREN','ionq':'IONQ','biomarin':'BMNR' };

// 캐시가 없는 종목을 백그라운드에서 자동 생성
async function triggerCacheIfMissing(missingStocks, baseUrl) {
  for (const stock of missingStocks) {
    try {
      await fetch(`${baseUrl}/api/news?stock=${stock}`);
      await fetch(`${baseUrl}/api/sec?stock=${stock}`);
      await fetch(`${baseUrl}/api/earnings?stock=${stock}`);
    } catch (e) {
      console.log(`캐시 자동생성 실패: ${stock}`, e.message);
    }
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const allNews = [];
    const allSec = [];
    const allEarnings = [];
    const missingStocks = [];
    const today = new Date().toISOString().split('T')[0];

    await Promise.all(stocks.map(async (stock) => {
      try {
        const [newsCache, secCache, earningsCache] = await Promise.all([
          redis.get(`news:${stock}`),
          redis.get(`sec:${stock}`),
          redis.get(`earnings:${stock}`)
        ]);

        // 캐시 없는 종목 추적
        if (!newsCache && !secCache) missingStocks.push(stock);

        if (newsCache) {
          const data = typeof newsCache === 'string' ? JSON.parse(newsCache) : newsCache;
          (data.news || []).slice(0, 5).forEach(item => {
            allNews.push({
              stock, ticker: tickers[stock],
              title: item.title,
              publishedAt: item.publishedAt,
              _sortDate: new Date(item.publishedAt || 0).getTime() || 0
            });
          });
        }

        if (secCache) {
          const data = typeof secCache === 'string' ? JSON.parse(secCache) : secCache;
          (data.sec || []).slice(0, 4).forEach(item => {
            allSec.push({
              stock, ticker: tickers[stock],
              form: item.form, formDesc: item.formDesc,
              filingDate: item.filingDate,
              _sortDate: new Date(item.filingDate || 0).getTime() || 0
            });
          });
        }

        if (earningsCache) {
          const data = typeof earningsCache === 'string' ? JSON.parse(earningsCache) : earningsCache;
          (data.earnings || []).slice(0, 3).forEach(item => {
            allEarnings.push({
              stock, ticker: tickers[stock],
              date: item.date, hourKo: item.hourKo,
              epsEstimate: item.epsEstimate, epsActual: item.epsActual,
              beatMiss: item.beatMiss, isFuture: item.isFuture,
              _sortDate: new Date(item.date || 0).getTime() || 0
            });
          });
        }
      } catch {
        missingStocks.push(stock);
      }
    }));

    // 캐시 없는 종목 있으면 백그라운드에서 자동 생성
    if (missingStocks.length > 0) {
      const host = req.headers.host || 'news-app-v2-jet.vercel.app';
      const baseUrl = `https://${host}`;
      triggerCacheIfMissing([...new Set(missingStocks)], baseUrl);
    }

    // 날짜순 정렬
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
      earnings: allEarnings.slice(0, 8),
      autoRefresh: missingStocks.length > 0
    });

  } catch (error) {
    return res.status(200).json({ success: false, news: [], sec: [], earnings: [], error: error.message });
  }
};
