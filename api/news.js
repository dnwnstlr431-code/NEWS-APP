module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.json({ success: false, error: "API 키가 Vercel 설정에 없습니다." });
  }

  try {
    const queries = { 'palantir': 'PLTR', 'iren': 'IREN', 'ionq': 'IONQ', 'biomarin': 'BMNR' };
    const q = queries[stockParam] || 'PLTR';
    
    // 1. 뉴스 가져오기
    const newsUrl = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`;
    const newsRes = await fetch(newsUrl);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    // 2. Claude 분석
    const news = await Promise.all(
      articles.map(async (article) => {
        try {
          const translateRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': claudeApiKey, // 중요: Authorization: Bearer 가 아닙니다!
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 600,
              messages: [{
                role: 'user',
                content: `분석할 뉴스:
                제목: ${article.title}
                설명: ${article.description}

                위 뉴스를 보고 다음 JSON 형식으로만 답해줘:
                {"analysis": "한국어 요약 2-3문장", "importance": 1에서 5사이 숫자}`
              }]
            })
          });

          const data = await translateRes.json();
          
          if (!data.content || !data.content[0]) {
             throw new Error(data.error?.message || "Claude 응답 없음");
          }

          const rawText = data.content[0].text;
          const jsonMatch = rawText.match(/\{.*\}/s); // JSON 부분만 골라내기
          const result = JSON.parse(jsonMatch[0]);

          return {
            title: article.title,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url,
            analysis: result.analysis,
            importance: result.importance,
            content: article.description || "내용 없음"
          };
        } catch (error) {
          console.error("Claude 분석 에러:", error.message);
          return {
            title: article.title,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url,
            analysis: `분석 실패: ${error.message}`,
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
