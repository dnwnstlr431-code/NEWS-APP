module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.status(200).json({ success: false, news: [], error: 'API 키 없음' });
  }

  const queries = {
    'palantir': 'PLTR',
    'iren': 'IREN',
    'ionq': 'IONQ',
    'biomarin': 'BMNR'
  };

  const stockNames = {
    'palantir': '팔란티어',
    'iren': '아이렌',
    'ionq': '아이온큐',
    'biomarin': '비트마인'
  };

  try {
    const q = queries[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    const newsUrl = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`;
    const newsRes = await fetch(newsUrl);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    const news = await Promise.all(
      articles.map(async (article) => {
        const originalText = article.description || article.content || '내용 없음';
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
              max_tokens: 500,
              messages: [{
                role: 'user',
                content: `다음 뉴스를 분석해줘.

제목: ${article.title}
내용: ${originalText}

아래 형식으로 한국어로 답변해줘:

[한글 번역]
(뉴스 내용을 자연스러운 한국어로 번역)

[AI 요약]
(${stockName} 투자자 관점에서 2-3문장으로 핵심 요약)

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`
              }]
            })
          });

          const claudeData = await claudeRes.json();
          const analysis = claudeData.content?.[0]?.text || null;

          return {
            title: article.title,
            originalContent: originalText,
            analysis: analysis,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url
          };
        } catch (err) {
          return {
            title: article.title,
            originalContent: originalText,
            analysis: null,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url
          };
        }
      })
    );

    return res.status(200).json({ success: true, news });
  } catch (error) {
    return res.status(200).json({ success: false, news: [], error: error.message });
  }
};
