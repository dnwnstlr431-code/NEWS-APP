const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ALL_KEYS = [
  'sec:palantir', 'sec:iren', 'sec:ionq', 'sec:biomarin',
  'news:palantir', 'news:iren', 'news:ionq', 'news:biomarin',
  'earnings:palantir', 'earnings:iren', 'earnings:ionq', 'earnings:biomarin',
  'stock-price:all', 'stock-info:all',
];

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const type = req.query.type || 'sec';

  let keys = [];
  if (type === 'sec')      keys = ALL_KEYS.filter(k => k.startsWith('sec:'));
  else if (type === 'news')     keys = ALL_KEYS.filter(k => k.startsWith('news:'));
  else if (type === 'earnings') keys = ALL_KEYS.filter(k => k.startsWith('earnings:'));
  else if (type === 'price')    keys = ['stock-price:all', 'stock-info:all'];
  else if (type === 'all')      keys = ALL_KEYS;
  else return res.status(400).json({ success: false, error: '알 수 없는 type. sec / news / earnings / price / all 중 선택' });

  try {
    await Promise.all(keys.map(k => redis.del(k)));
    return res.status(200).json({ success: true, cleared: keys });
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
};
