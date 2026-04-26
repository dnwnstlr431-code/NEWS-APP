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

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stockParam = req.query.stock || 'palantir';
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;

  try {
    // 캐시 확인 (6시간)
    const cached = await redis.get(`earnings:${stockParam}`);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, earnings: data.earnings, updatedAt: data.updatedAt, fromCache: true });
    }

    const ticker = tickers[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    // 최근 1년 + 향후 1년 범위로 실적 조회
    const now = new Date();
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date(now);
    to.setFullYear(to.getFullYear() + 1);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker}&from=${fromStr}&to=${toStr}&token=${finnhubApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const earningsArr = data.earningsCalendar || [];
    if (earningsArr.length === 0) {
      return res.status(200).json({ success: false, earnings: [], error: '실적 데이터 없음' });
    }

    // 날짜순 정렬 후 가장 최근 과거 + 다음 미래 포함 최대 6개
    const today = now.toISOString().split('T')[0];
    const sorted = earningsArr.sort((a, b) => new Date(b.date) - new Date(a.date));
    const past = sorted.filter(e => e.date <= today).slice(0, 4);
    const future = sorted.filter(e => e.date > today).reverse().slice(0, 2);
    const combined = [...future, ...past];

    // Claude AI로 분석
    const earnings = await Promise.all(combined.map(async (item) => {
      const epsEstimate = item.epsEstimate;
      const epsActual = item.epsActual;
      const revenueEstimate = item.revenueEstimate;
      const revenueActual = item.revenueActual;
      const isFuture = item.date > today;

      let beatMiss = '';
      if (!isFuture && epsActual !== null && epsEstimate !== null) {
        if (epsActual > epsEstimate) beatMiss = 'BEAT';
        else if (epsActual < epsEstimate) beatMiss = 'MISS';
        else beatMiss = 'MEET';
      }

      try {
        const prompt = isFuture
          ? `${stockName}(${ticker})의 다음 실적 발표 예정입니다.
발표 예정일: ${item.date}
발표 시간: ${item.hour === 'bmo' ? '장 시작 전 (BMO)' : item.hour === 'amc' ? '장 마감 후 (AMC)' : '미정'}
예상 주당순이익(EPS): ${epsEstimate !== null ? '$' + epsEstimate : '미공개'}
예상 매출: ${revenueEstimate ? '$' + (revenueEstimate / 1e9).toFixed(2) + 'B' : '미공개'}

아래 형식으로 한국어로 답변해줘. 어려운 금융용어는 쉽게 풀어서 설명해줘:

[발표 예정 포인트]
이번 실적 발표에서 투자자들이 주목해야 할 점 2-3가지

[예상 주당순이익 설명]
주당순이익이 무엇인지 한 문장으로 쉽게 설명하고, 이번 예상치의 의미 설명

[주목할 특이사항]
${stockName}의 최근 사업 상황에서 이번 실적에 영향을 줄 수 있는 요소 1-2가지`
          : `${stockName}(${ticker})의 실적 발표 결과입니다.
발표일: ${item.date}
예상 주당순이익(EPS): ${epsEstimate !== null ? '$' + epsEstimate : '미공개'}
실제 주당순이익(EPS): ${epsActual !== null ? '$' + epsActual : '미공개'}
결과: ${beatMiss === 'BEAT' ? '예상치 초과 달성' : beatMiss === 'MISS' ? '예상치 미달' : '예상치 부합'}
예상 매출: ${revenueEstimate ? '$' + (revenueEstimate / 1e9).toFixed(2) + 'B' : '미공개'}
실제 매출: ${revenueActual ? '$' + (revenueActual / 1e9).toFixed(2) + 'B' : '미공개'}

아래 형식으로 한국어로 답변해줘. 어려운 금융용어는 쉽게 풀어서 설명해줘:

[실적 요약]
이번 실적의 핵심 내용을 2문장으로 쉽게 설명

[투자자 영향]
이 실적이 ${stockName} 투자자에게 미치는 의미 2문장

[다음 분기 전망]
이번 실적을 바탕으로 다음 분기에 주목해야 할 점

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

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
        const analysis = claudeData.content?.[0]?.text || null;

        return {
          date: item.date,
          hour: item.hour,
          hourKo: item.hour === 'bmo' ? '장 시작 전' : item.hour === 'amc' ? '장 마감 후' : '미정',
          epsEstimate: epsEstimate,
          epsActual: epsActual,
          revenueEstimate: revenueEstimate,
          revenueActual: revenueActual,
          beatMiss: beatMiss,
          isFuture: isFuture,
          analysis: analysis
        };
      } catch {
        return {
          date: item.date,
          hour: item.hour,
          hourKo: item.hour === 'bmo' ? '장 시작 전' : item.hour === 'amc' ? '장 마감 후' : '미정',
          epsEstimate, epsActual, revenueEstimate, revenueActual,
          beatMiss, isFuture, analysis: null
        };
      }
    }));

    const updatedAt = new Date().toISOString();
    await redis.set(`earnings:${stockParam}`, JSON.stringify({ earnings, updatedAt }), { ex: 21600 });

    return res.status(200).json({ success: true, earnings, updatedAt, fromCache: false });

  } catch (error) {
    return res.status(200).json({ success: false, earnings: [], error: error.message });
  }
};
