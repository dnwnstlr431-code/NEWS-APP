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

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const cached = await redis.get('stock-price:all');
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, prices: data.prices, fromCache: true });
    }

    const token = process.env.FINNHUB_API_KEY;
    const results = await Promise.all(
      Object.entries(stocks).map(([key, ticker]) =>
        fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${token}`)
          .then(r => r.json())
          .then(d => [key, { price: d.c, change: d.d, changePercent: d.dp }])
          .catch(() => [key, null])
      )
    );

    const prices = Object.fromEntries(results);
    await redis.set('stock-price:all', JSON.stringify({ prices }), { ex: 300 });

    return res.status(200).json({ success: true, prices, fromCache: false });
  } catch (error) {
    return res.status(200).json({ success: false, prices: {}, error: error.message });
  }
};
