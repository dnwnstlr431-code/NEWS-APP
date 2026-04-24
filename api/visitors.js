const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyKey = `visitors:daily:${today}`;
    const totalKey = 'visitors:total';

    if (req.method === 'POST') {
      // 방문자 카운트 증가
      const [daily, total] = await Promise.all([
        redis.incr(dailyKey),
        redis.incr(totalKey)
      ]);
      // 일별 키는 2일 후 자동 만료
      await redis.expire(dailyKey, 172800);

      return res.status(200).json({
        success: true,
        today: Number(daily) || 0,
        total: Number(total) || 0
      });
    }

    // GET - 현재 카운트 조회
    const [daily, total] = await Promise.all([
      redis.get(dailyKey),
      redis.get(totalKey)
    ]);

    return res.status(200).json({
      success: true,
      today: Number(daily) || 0,
      total: Number(total) || 0
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      today: 0,
      total: 0,
      error: error.message
    });
  }
};
