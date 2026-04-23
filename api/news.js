import axios from 'axios';

const stockMappings = {
  'palantir': { name: '팔란티어', queries: ['PLTR', 'Palantir'] },
  'iren': { name: '아이렌', queries: ['IREN', 'Iren'] },
  'ionq': { name: '아이온큐', queries: ['IONQ', 'IonQ'] },
  'biomarin': { name: '비트마인', queries: ['BMNR', 'BitMain'] }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const stockParam = req.query.stock || 'palantir';
    const stockInfo = stockMappings[stockParam] || stockMappings['palantir'];
    
    const newsApiKey = process.env.NEWS_API_KEY;
    if (!newsApiKey) {
      return res.status(400).json({ error: 'NEWS_API_KEY가 설정되지 않았습니다' });
    }

    const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: stockInfo.queries.join(' OR '),
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 5
      },
      headers: {
        'X-API-Key': newsApiKey
      }
    });

    const articles = newsResponse.data.articles || [];

    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(400).json({ error: 'CLAUDE_API_KEY가 설정되지 않았습니다' });
    }

    const newsWithAnalysis = await Promise.all(
      articles.map(async (article) => {
        try {
          const analysisPrompt = `다음 뉴스를 분석해주세요:

제목: ${article.title}
내용: ${article.description || article.content || '내용 없음'}

다음을 한국어 2-3문장으로 간결하게 답변해주세요:
${stockInfo.name} 투자자에게 미치는 영향은 뭔가요? (긍정/부정/중립)`;

          const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': claudeApiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-opus-4-20250805',
              max_tokens: 300,
              messages: [
                {
                  role: 'user',
                  content: analysisPrompt
                }
              ]
            })
          });

          const analysisData = await analysisResponse.json();
          const analysis = analysisData.content?.[0]?.text || '분석 불가';

          return {
            title: article.title,
            content: article.description || article.content || '내용 없음',
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
          return {
            title: article.title,
            content: article.description || '내용 없음',
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            analysis: '분석 중 오류가 발생했습니다.',
            importance: 3,
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
    console.error('Error:', error);
    return res.status(500).json({
      error: '뉴스를 가져올 수 없습니다: ' + error.message
    });
  }
}
