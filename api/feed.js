const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const stocks = ['palantir', 'iren', 'ionq', 'biomarin'];
const stockMeta = {
  palantir: { name: '팔란티어', ticker: 'PLTR', badgeClass: 'badge-pltr' },
  iren:     { name: '아이렌',   ticker: 'IREN', badgeClass: 'badge-iren' },
  ionq:     { name: '아이온큐', ticker: 'IONQ', badgeClass: 'badge-ionq' },
  biomarin: { name: '비트마인', ticker: 'BMNR', badgeClass: 'badge-bmnr' },
};

const beatMissLabel = { BEAT: '📈 예상 초과', MISS: '📉 예상 미달', MEET: '➡️ 예상 부합' };

// 뉴스 분석 텍스트에서 한글 번역 제목 추출
function extractKoreanTitle(analysis, fallback) {
  if (!analysis) return fallback;
  const match = analysis.match(/\[한글 번역\][\r\n]+([\s\S]+?)(?:\n\n|\[|$)/);
  if (!match) return fallback;
  let first = match[1].trim().split('\n')[0].trim();
  // "제목:", "**제목:**" 등 접두사 제거
  first = first.replace(/^\*{0,2}제목\s*:\s*\*{0,2}\s*/i, '').trim();
  return first || fallback;
}

// 날짜 문자열 → 정렬용 timestamp 변환
function parseSortDate(dateStr) {
  if (!dateStr) return 0;
  // "2025. 04. 26. PM 03:30" (뉴스)
  const m1 = dateStr.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.\s*(AM|PM)\s*(\d{2}):(\d{2})/);
  if (m1) {
    let h = parseInt(m1[5]);
    if (m1[4] === 'PM' && h !== 12) h += 12;
    if (m1[4] === 'AM' && h === 12) h = 0;
    return new Date(`${m1[1]}-${m1[2]}-${m1[3]}T${String(h).padStart(2, '0')}:${m1[6]}:00Z`).getTime();
  }
  // "2025. 04. 26." (SEC)
  const m2 = dateStr.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})/);
  if (m2) return new Date(`${m2[1]}-${m2[2]}-${m2[3]}T00:00:00Z`).getTime();
  // "2025-04-26" (실적)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(`${dateStr}T00:00:00Z`).getTime();
  return 0;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 12개 캐시 키를 한 번에 병렬 조회 (외부 API 호출 없음)
    const keys = [
      ...stocks.map(s => `news:${s}`),
      ...stocks.map(s => `sec:${s}`),
      ...stocks.map(s => `earnings:${s}`),
    ];
    const results = await Promise.all(keys.map(k => redis.get(k)));

    const newsCache     = Object.fromEntries(stocks.map((s, i) => [s, results[i]]));
    const secCache      = Object.fromEntries(stocks.map((s, i) => [s, results[4 + i]]));
    const earningsCache = Object.fromEntries(stocks.map((s, i) => [s, results[8 + i]]));

    const items = [];

    for (const stock of stocks) {
      const meta = stockMeta[stock];

      // 뉴스 (최대 3개)
      const newsRaw = newsCache[stock];
      if (newsRaw) {
        const d = typeof newsRaw === 'string' ? JSON.parse(newsRaw) : newsRaw;
        (d.news || []).slice(0, 1).forEach(item => {
          const title = extractKoreanTitle(item.analysis, item.title);
          items.push({
            type: 'news',
            ticker: meta.ticker,
            stockName: meta.name,
            title,
            date: item.publishedAt || '',
            url: `news.html?stock=${stock}&name=${meta.name}`,
            sortDate: parseSortDate(item.publishedAt),
          });
        });
      }

      // SEC 공시 (최대 2개)
      const secRaw = secCache[stock];
      if (secRaw) {
        const d = typeof secRaw === 'string' ? JSON.parse(secRaw) : secRaw;
        (d.sec || []).slice(0, 1).forEach(item => {
          items.push({
            type: 'sec',
            ticker: meta.ticker,
            stockName: meta.name,
            title: `${item.form} · ${item.formDesc}`,
            date: item.filingDate || '',
            url: `sec.html?stock=${stock}&name=${meta.name}`,
            sortDate: parseSortDate(item.filingDate),
          });
        });
      }

      // 실적 발표 (최대 2개)
      const earningsRaw = earningsCache[stock];
      if (earningsRaw) {
        const d = typeof earningsRaw === 'string' ? JSON.parse(earningsRaw) : earningsRaw;
        (d.earnings || []).slice(0, 1).forEach(item => {
          const label = item.isFuture
            ? '📅 실적 발표 예정'
            : (beatMissLabel[item.beatMiss] || '📊 실적 발표');
          items.push({
            type: 'earnings',
            ticker: meta.ticker,
            stockName: meta.name,
            title: label,
            date: item.date || '',
            url: `earnings.html?stock=${stock}&name=${meta.name}`,
            sortDate: parseSortDate(item.date),
          });
        });
      }
    }

    // 섹션별(type) 정렬 후 각 섹션 내 날짜 최신순
    items.sort((a, b) => {
      if (a.type !== b.type) return 0;
      return b.sortDate - a.sortDate;
    });
    const feed = items;

    return res.status(200).json({ success: true, feed });
  } catch (error) {
    return res.status(200).json({ success: false, feed: [], error: error.message });
  }
};
