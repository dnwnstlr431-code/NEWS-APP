const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stocks = {
  palantir:      'PLTR',
  alphabet:      'GOOGL',
  nvidia:        'NVDA',
  amazon:        'AMZN',
  iren:          'IREN',
  newscalepower: 'NWP',
  rocketlab:     'RKLB',
  ionq:          'IONQ',
  biomarin:      'BMNR',
  emergenttech:  'EMG',
  planetlabs:    'PL',
  apple:         'AAPL',
  microsoft:     'MSFT',
  broadcom:      'AVGO',
  tesla:         'TSLA',
  meta:          'META',
  exxonmobil:    'XOM',
  amd:           'AMD',
};

const descriptions = {
  palantir:      'AI 빅데이터 분석 플랫폼 · 미 정부/기업 고객',
  alphabet:      '구글 모회사 · 검색·AI·클라우드·광고',
  nvidia:        '그래픽·AI 칩 설계 · 데이터센터 AI 가속기',
  amazon:        '전자상거래 + AWS 클라우드 · AI·로봇·물류',
  iren:          '비트코인 채굴 + AI 데이터센터 · 재생에너지 기반',
  newscalepower: '소형모듈원자로(SMR) 개발 · 차세대 원자력',
  rocketlab:     '소형위성 발사체 Electron · 우주 인프라',
  ionq:          '이온트랩 양자컴퓨터 개발 · 클라우드 양자컴퓨팅',
  biomarin:      '비트코인 채굴 특화 장비 · 마이닝 인프라 운영',
  emergenttech:  '비트코인 채굴 · 몰입형 냉각 데이터센터',
  planetlabs:    '지구 관측 위성 · 위성 영상 분석 서비스',
  apple:         '아이폰·맥·서비스 · AI(애플인텔리전스) 통합',
  microsoft:     '윈도우·Azure 클라우드 · OpenAI 전략 파트너',
  broadcom:      '반도체·네트워킹 칩 · AI 맞춤형 ASIC',
  tesla:         '전기차·에너지저장·자율주행(FSD)·AI',
  meta:          '페이스북·인스타그램·WhatsApp · AR/VR·AI',
  exxonmobil:    '미국 최대 석유·가스 메이저 · 에너지 전환 투자',
  amd:           '고성능 CPU·GPU 설계 · AI 데이터센터 칩',
};

// NASDAQ 공식 API: 공매도 주수 + days-to-cover (키 불필요)
async function fetchNasdaqShortInterest(ticker) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(
      `https://api.nasdaq.com/api/quote/${ticker}/short-interest?numberToFetch=1&type=SHORT_INTEREST`,
      { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );
    clearTimeout(timer);
    if (!r.ok) return null;
    const json = await r.json();
    const row = json?.data?.shortInterestTable?.rows?.[0];
    if (!row) return null;
    const shares = parseInt((row.interest || '').replace(/,/g, ''), 10) || null;
    const daysToCover = parseFloat(row.daysToCover) || null;
    return { shares, daysToCover };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// FMP stable API: 목표주가 + float주수 (FMP_API_KEY 필요)
async function fetchFMPData(ticker, apiKey) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const base = 'https://financialmodelingprep.com/stable';
    const [targetText, floatData] = await Promise.all([
      fetch(`${base}/price-target-summary?symbol=${ticker}&apikey=${apiKey}`, { signal: ctrl.signal })
        .then(r => r.ok ? r.text() : '').catch(() => ''),
      fetch(`${base}/shares-float?symbol=${ticker}&apikey=${apiKey}`, { signal: ctrl.signal })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    clearTimeout(timer);

    let targetMean = null;
    if (targetText) {
      try {
        const parsed = JSON.parse(targetText);
        if (Array.isArray(parsed) && parsed[0]) {
          targetMean = parsed[0].lastMonthAvgPriceTarget ?? parsed[0].lastQuarterAvgPriceTarget ?? null;
        }
      } catch {}
    }

    const floatShares = Array.isArray(floatData) && floatData[0] ? (floatData[0].floatShares ?? null) : null;
    return { targetMean, floatShares };
  } catch {
    clearTimeout(timer);
    return { targetMean: null, floatShares: null };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const cached = await redis.get('stock-info:all');
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, info: data.info, fromCache: true });
    }

    const finnhubKey = process.env.FINNHUB_API_KEY;
    const fmpKey     = process.env.FMP_API_KEY;
    const today = new Date().toISOString().split('T')[0];
    const info = {};

    await Promise.all(
      Object.entries(stocks).map(async ([key, ticker]) => {
        try {
          const [metricsRes, earningsRaw, nasdaqShort, fmpData] = await Promise.all([
            fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${finnhubKey}`)
              .then(r => r.json()).catch(() => ({})),
            redis.get(`earnings:${key}`),
            fetchNasdaqShortInterest(ticker),
            fmpKey
              ? fetchFMPData(ticker, fmpKey)
              : Promise.resolve({ targetMean: null, floatShares: null }),
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

          // 공매도: float% 우선 (NASDAQ주수 ÷ FMP float주수), 없으면 days-to-cover
          const shortPercent = (nasdaqShort?.shares && fmpData?.floatShares)
            ? (nasdaqShort.shares / fmpData.floatShares * 100)
            : null;
          const shortRatio = shortPercent == null ? (nasdaqShort?.daysToCover ?? null) : null;

          info[key] = {
            description:   descriptions[key],
            week52High:    m['52WeekHigh'] ?? null,
            week52Low:     m['52WeekLow']  ?? null,
            targetMean:    fmpData?.targetMean  ?? null,
            shortPercent,
            shortRatio,
            institutionalOwnership: null,
            dDay,
          };
        } catch {
          info[key] = {
            description: descriptions[key],
            week52High: null, week52Low: null,
            targetMean: null, shortPercent: null, shortRatio: null,
            institutionalOwnership: null, dDay: null,
          };
        }
      })
    );

    // D-Day가 하나도 없으면 earnings 캐시 미스 가능성 → 1시간 후 재시도
    const anyDDay = Object.values(info).some(v => v.dDay !== null);
    await redis.set('stock-info:all', JSON.stringify({ info }), { ex: anyDDay ? 21600 : 3600 });
    return res.status(200).json({ success: true, info, fromCache: false });
  } catch (error) {
    return res.status(200).json({ success: false, info: {}, error: error.message });
  }
};
