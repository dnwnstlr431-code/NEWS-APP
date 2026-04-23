module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.json({ success: false, error: "API 키 설정이 누락되었습니다." });
  }

  try {
    const queries = { 'palantir': 'PLTR', 'iren': 'IREN', 'ionq': 'IONQ', 'biomarin': 'BMNR' };
    const q = queries[stockParam] || 'PLTR';
    
    const newsUrl = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`;
    const newsRes = await fetch(newsUrl);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    const news = await Promise.all(
      articles.map(async (article) => {
        try {
          const translateRes = await fetch('https://api.anthropic.com/v1/messages', {
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
                content: `다음 뉴스를 분석해서 JSON 형식으로 답해줘. 
                형식: {"analysis": "2-3문장 요약", "importance": 1~5 숫자}
                
                제목: ${article.title}
                내용: ${article.description || article.content}`
              }]
            })
          });

          const data = await translateRes.json();
          const rawText = data.content[0].text;
          // Claude가 준 답변에서 JSON만 추출
          const result = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));

          return {
            title: article.title,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url,
            analysis: result.analysis || "요약 실패",
            importance: result.importance || 1,
            content: article.description || "내용 없음"
          };
        } catch (error) {
          return {
            title: article.title,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url,
            analysis: "AI 분석 중 오류가 발생했습니다.",
            importance: 1,
            content: article.description || "내용 없음"
          };
        }
      })
    );

    return res.json({ success: true, news });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
};
