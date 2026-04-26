const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stocks = {
  palantir: 'PLTR',
  iren: 'IREN',
  ionq: 'IONQ',
  biomarin: 'BMNR',
};

const descriptions = {
  palantir: 'AI 빅데이터 분석 플랫폼 · 미 정부/기업 고객',
  iren: '비트코인 채굴 + AI 데이터센터 · 재생에너지 기반',
  ionq: '이온트랩 양자컴퓨터 개발 · 클라우드 양자컴퓨팅',
  biomarin: '비트코인 채굴 특화 장비 · 마이닝 인프라 운영',
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const cached = await redis.get('stock-info:all');
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, info: data.info, fromCache: true });
    }

    const token = process.env.FINNHUB_API_KEY;
    const today = new Date().toISOString().split('T')[0];
    const info = {};

    await Promise.all(
      Object.entries(stocks).map(async ([key, ticker]) => {
        try {
          const [metricsRes, targetRes, earningsRaw] = await Promise.all([
            fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${token}`)
              .then(r => r.json()).catch(() => ({})),
            fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${ticker}&token=${token}`)
              .then(r => r.json()).catch(() => ({})),
            redis.get(`earnings:${key}`),
          ]);

          const m = metricsRes.metric || {};

          let dDay = null;
          if (earningsRaw) {
            const ed = typeof earningsRaw === 'string' ? JSON.parse(earningsRaw) : earningsRaw;
            const future = (ed.earnings || [])
              .filter(e => e.isFuture && e.date > today)
              .sort((a, b) => a.date.localeCompare(b.date));
            if (future.length > 0) {
              dDay = Math.ceil((new Date(future[0].date) - new Date(today)) / 86400000);
            }
          }

          // institutionalOwnershipPercentage may or may not be present in free tier
          let instOwn = m['institutionalOwnershipPercentage'] ?? null;
          if (instOwn !== null && instOwn < 1) instOwn = instOwn * 100;

          info[key] = {
            description: descriptions[key],
            week52High: m['52WeekHigh'] ?? null,
            week52Low: m['52WeekLow'] ?? null,
            targetMean: targetRes.targetMean ?? null,
            shortRatio: m['shortRatio'] ?? null,
            institutionalOwnership: instOwn,
            dDay,
          };
        } catch {
          info[key] = {
            description: descriptions[key],
            week52High: null, week52Low: null,
            targetMean: null, shortRatio: null,
            institutionalOwnership: null, dDay: null,
          };
        }
      })
    );

    await redis.set('stock-info:all', JSON.stringify({ info }), { ex: 21600 });
    return res.status(200).json({ success: true, info, fromCache: false });
  } catch (error) {
    return res.status(200).json({ success: false, info: {}, error: error.message });
  }
};
