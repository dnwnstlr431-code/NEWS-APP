export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const stockParam = req.query.stock || 'palantir';
  
  const stockMappings = {
    'palantir': { name: '팔란티어', queries: ['PLTR', 'Palantir'] },
    'iren': { name: '아이렌', queries: ['IREN', 'Iren'] },
    'ionq': { name: '아이온큐', queries: ['IONQ', 'IonQ'] },
    'biomarin': { name: '비트마인', queries: ['BMNR', 'BitMain'] }
  };

  const stockInfo = stockMappings[stockParam] || stockMappings['palantir'];
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.status(400).json({ error: 'API 키 없음' });
  }

  try {
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(stockInfo.queries.join(' OR '))}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();
    const articles = newsData.articles || [];

    const newsWithAnalysis = await Promise.all(
      articles.map(async (article) => {
        const newsText = article.description || article.content || '내용 없음';
        
        const analysisPrompt = `뉴스를 분석해줄래?

제목: ${article.title}
내용: ${newsText}

한국어로:
1. 뉴스 요약 (2-3문장)
2. ${stockInfo.name} 투자자에게 긍정/부정 영향
3. 핵심`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${claudeApiKey}`,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 400,
            messages: [{ role: 'user', content: analysisPrompt }]
          })
        });

        const data = await response.json();
        const analysis = data.content?.[0]?.text || '분석 실패';

        return {
          title: article.title,
          content: newsText,
          source: article.source.name,
          publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
          analysis: analysis,
          importance: Math.floor(Math.random() * 3) + 3,
          url: article.url
        };
      })
    );

    return res.status(200).json({ success: true, news: newsWithAnalysis });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
