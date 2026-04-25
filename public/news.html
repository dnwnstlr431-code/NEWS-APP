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

  try {
    // 캐시 확인
    const cached = await redis.get(`news:${stockParam}`);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({
        success: true,
        news: data.news,
        updatedAt: data.updatedAt,
        fromCache: true
      });
    }

    const ticker = tickers[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    const rssUrl = `https://finance.yahoo.com/rss/headline?s=${ticker}`;
    const rssRes = await fetch(rssUrl);
    const rssText = await rssRes.text();
    const items = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];

    const articles = items.slice(0, 5).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     item.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                           item.match(/<description>(.*?)<\/description>/) || [])[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      return {
        title: title.trim(),
        description: description.replace(/<[^>]*>/g, '').trim(),
        link: link.trim(),
        pubDate: pubDate.trim()
      };
    });

    const news = await Promise.all(articles.map(async (article) => {
      const originalText = article.description || article.title || '내용 없음';
      try {
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
            messages: [{
              role: 'user',
              content: `다음 뉴스를 분석해줘. 내용이 일부만 제공되더라도 주어진 정보만으로 반드시 분석을 완성해줘. 내용 부족을 언급하지 말고 바로 분석 결과만 답변해줘.

제목: ${article.title}
내용: ${originalText}

아래 형식으로 한국어로 답변해줘:

[한글 번역]
(제목과 내용을 자연스러운 한국어로 번역)

[AI 요약]
(${stockName} 투자자 관점에서 2-3문장으로 핵심 요약)

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`
            }]
          })
        });
        const claudeData = await claudeRes.json();
        return {
          title: article.title,
          originalContent: originalText,
          analysis: claudeData.content?.[0]?.text || null,
          source: 'Yahoo Finance',
          publishedAt: new Date(article.pubDate).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }),
          url: article.link
        };
      } catch {
        return {
          title: article.title,
          originalContent: originalText,
          analysis: null,
          source: 'Yahoo Finance',
          publishedAt: new Date(article.pubDate).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          url: article.link
        };
      }
    }));

    const updatedAt = new Date().toISOString();
    await redis.set(`news:${stockParam}`, JSON.stringify({ news, updatedAt }), { ex: 7200 });

    return res.status(200).json({ success: true, news, updatedAt, fromCache: false });

  } catch (error) {
    return res.status(200).json({ success: false, news: [], error: error.message });
  }
};
