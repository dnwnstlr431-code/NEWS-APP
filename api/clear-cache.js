const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const STOCKS = [
  'palantir', 'alphabet', 'nvidia', 'amazon', 'iren', 'newscalepower',
  'rocketlab', 'ionq', 'biomarin', 'planetlabs',
  'apple', 'microsoft', 'broadcom', 'tesla', 'meta', 'exxonmobil', 'amd',
];

const ALL_KEYS = [
  ...STOCKS.map(s => `news:${s}`),
  ...STOCKS.map(s => `sec:${s}`),
  ...STOCKS.map(s => `earnings:${s}`),
  'stock-price:all',
  'stock-info:v2',
];

const COOLDOWN_KEY = 'clear-cache:cooldown';
const COOLDOWN_SEC = 600; // 10분

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const type = req.query.type || 'sec';

  let keys = [];
  if (type === 'sec')           keys = ALL_KEYS.filter(k => k.startsWith('sec:'));
  else if (type === 'news')     keys = ALL_KEYS.filter(k => k.startsWith('news:'));
  else if (type === 'earnings') keys = ALL_KEYS.filter(k => k.startsWith('earnings:'));
  else if (type === 'price')    keys = ['stock-price:all', 'stock-info:v2'];
  else if (type === 'all')      keys = ALL_KEYS;
  else return res.status(400).json({ success: false, error: '알 수 없는 type. sec / news / earnings / price / all 중 선택' });

  try {
    if (type === 'all') {
      const onCooldown = await redis.get(COOLDOWN_KEY);
      if (onCooldown) {
        return res.status(429).json({ success: false, error: '전체 캐시 초기화는 10분에 한 번만 가능합니다.' });
      }
      await redis.set(COOLDOWN_KEY, '1', { ex: COOLDOWN_SEC });
    }

    await Promise.all(keys.map(k => redis.del(k)));
    return res.status(200).json({ success: true, cleared: keys });
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
};
