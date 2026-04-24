const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stocks = ['palantir', 'iren', 'ionq', 'biomarin'];

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const preview = {};

    await Promise.all(stocks.map(async (stock) => {
      try {
        const [newsCache, secCache] = await Promise.all([
          redis.get(`news:${stock}`),
          redis.get(`sec:${stock}`)
        ]);

        // 뉴스 최신 2개
        let latestNews = [];
        if (newsCache) {
          const data = typeof newsCache === 'string' ? JSON.parse(newsCache) : newsCache;
          latestNews = (data.news || []).slice(0, 2).map(item => ({
            title: item.title,
            publishedAt: item.publishedAt
          }));
        }

        // SEC 최신 2개
        let latestSec = [];
        if (secCache) {
          const data = typeof secCache === 'string' ? JSON.parse(secCache) : secCache;
          latestSec = (data.sec || []).slice(0, 2).map(item => ({
            form: item.form,
            formDesc: item.formDesc,
            filingDate: item.filingDate
          }));
        }

        preview[stock] = { news: latestNews, sec: latestSec };

      } catch {
        preview[stock] = { news: [], sec: [] };
      }
    }));

    return res.status(200).json({ success: true, preview });

  } catch (error) {
    return res.status(200).json({ success: false, preview: {}, error: error.message });
  }
};
