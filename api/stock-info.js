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
  planetlabs:    '지구 관측 위성 · 위성 영상 분석 서비스',
  apple:         '아이폰·맥·서비스 · AI(애플인텔리전스) 통합',
  microsoft:     '윈도우·Azure 클라우드 · OpenAI 전략 파트너',
  broadcom:      '반도체·네트워킹 칩 · AI 맞춤형 ASIC',
  tesla:         '전기차·에너지저장·자율주행(FSD)·AI',
  meta:          '페이스북·인스타그램·WhatsApp · AR/VR·AI',
  exxonmobil:    '미국 최대 석유·가스 메이저 · 에너지 전환 투자',
  amd:           '고성능 CPU·GPU 설계 · AI 데이터센터 칩',
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const cached = await redis.get('stock-info:v2');
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({ success: true, info: data.info, fromCache: true });
    }

    const finnhubKey = process.env.FINNHUB_API_KEY;
    const info = {};

    await Promise.all(
      Object.entries(stocks).map(async ([key, ticker]) => {
        try {
          const metricsRes = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${finnhubKey}`
          ).then(r => r.json()).catch(() => ({}));

          const m = metricsRes.metric || {};
          info[key] = {
            description: descriptions[key],
            week52High:  m['52WeekHigh'] ?? null,
            week52Low:   m['52WeekLow']  ?? null,
          };
        } catch {
          info[key] = {
            description: descriptions[key],
            week52High: null,
            week52Low:  null,
          };
        }
      })
    );

    await redis.set('stock-info:v2', JSON.stringify({ info }), { ex: 21600 });
    return res.status(200).json({ success: true, info, fromCache: false });
  } catch (error) {
    return res.status(200).json({ success: false, info: {}, error: error.message });
  }
};
