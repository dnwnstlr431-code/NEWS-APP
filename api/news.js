module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  try {
    const queries = { 'palantir': 'PLTR', 'iren': 'IREN', 'ionq': 'IONQ', 'biomarin': 'BMNR' };
    const q = queries[stockParam] || 'PLTR';
    
    const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    const news = await Promise.all(
      articles.map(async (article) => {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': claudeApiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 500,
              messages: [{
                role: 'user',
                content: `핵심 요약해줘. 반드시 JSON으로만 답해. 예: {"analysis": "요약", "importance": 5} \n\n제목: ${article.title}`
              }]
            })
          });

          const data = await response.json();
          
          // 클로드 서버에서 에러를 보냈을 경우 (예: 잔액 부족, 키 오류 등)
          if (data.error) {
            return { title: article.title, analysis: `클로드 에러: ${data.error.message}`, importance: 1 };
          }

          const rawText = data.content[0].text;
          const result = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));

          return {
            title: article.title,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            analysis: result.analysis,
            importance: result.importance,
            url: article.url
          };
        } catch (e) {
          return { title: article.title, analysis: "JSON 해석 실패: " + e.message, importance: 1 };
        }
      })
    );

    return res.json({ success: true, news });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
};
