module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.json({ success: false, error: "Vercel 설정에서 API 키를 찾을 수 없습니다." });
  }

  try {
    const queries = { 'palantir': 'PLTR', 'iren': 'IREN', 'ionq': 'IONQ', 'biomarin': 'BMNR' };
    const q = queries[stockParam] || 'PLTR';
    
    // 1. 뉴스 가져오기
    const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    // 2. Claude 분석 (Haiku 모델이 가장 빠르고 에러가 적습니다)
    const news = await Promise.all(
      articles.map(async (article) => {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': claudeApiKey, // 인증 방식 확인
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307', 
              max_tokens: 500,
              messages: [{
                role: 'user',
                content: `이 뉴스를 한국어로 요약하고 1~5점 중요도를 매겨줘. 반드시 JSON으로만 답해. {"analysis": "요약", "importance": 5} \n\n제목: ${article.title}`
              }]
            })
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          const result = JSON.parse(data.content[0].text);
          return {
            title: article.title,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            analysis: result.analysis,
            importance: result.importance,
            url: article.url,
            source: article.source.name
          };
        } catch (e) {
          return { title: article.title, analysis: "AI 분석 일시적 오류", importance: 1, url: article.url };
        }
      })
    );

    return res.json({ success: true, news });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
};
