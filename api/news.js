export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const stockParam = req.query.stock || 'palantir';
    
    const stockMappings = {
      'palantir': { name: '팔란티어', queries: ['PLTR', 'Palantir'] },
      'iren': { name: '아이렌', queries: ['IREN', 'Iren'] },
      'ionq': { name: '아이온큐', queries: ['IONQ', 'IonQ'] },
      'biomarin': { name: '비트마인', queries: ['BMNR', 'BitMain'] }
    };

    const stockInfo = stockMappings[stockParam] || stockMappings['palantir'];
    
    const newsApiKey = process.env.NEWS_API_KEY;
    if (!newsApiKey) {
      return res.status(400).json({ error: 'NEWS_API_KEY 없음' });
    }

    // NewsAPI에서 뉴스 가져오기
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(stockInfo.queries.join(' OR '))}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`;
    
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();
    const articles = newsData.articles || [];
    
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(400).json({ error: 'CLAUDE_API_KEY 없음' });
    }

    // 각 뉴스를 Claude로 분석
    const newsWithAnalysis = await Promise.all(
      articles.map(async (article) => {
        try {
          const newsText = article.description || article.content || '내용 없음';
          
          const analysisPrompt = `뉴스를 분석해줘.

제목: ${article.title}
내용: ${newsText}

이걸 한국어로:
1. 뉴스 요약 (2-3문장)
2. ${stockInfo.name} 투자자에게 긍정/부정 영향
3. 핵심 요약`;

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': claudeApiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 400,
              messages: [
                {
                  role: 'user',
                  content: analysisPrompt
                }
              ]
            })
          });

          const data = await response.json();
          
          if (!response.ok) {
            console.error('Claude API 에러:', data);
            throw new Error(data.error?.message || '분석 실패');
          }

          const analysis = data.content?.[0]?.text || '분석 실패';

          return {
            title: article.title,
            content: newsText,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            analysis: analysis,
            importance: Math.floor(Math.random() * 3) + 3,
            url: article.url
          };
        } catch (error) {
          console.error('뉴스 분석 에러:', error.message);
          return {
            title: article.title,
            content: article.description || '내용 없음',
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            analysis: '분석 실패: ' + error.message,
            importance: 1,
            url: article.url
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      news: newsWithAnalysis
    });

  } catch (error) {
    console.error('에러:', error.message);
    return res.status(500).json({
      error: '뉴스 처리 실패: ' + error.message
    });
  }
}
