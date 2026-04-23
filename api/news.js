module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.json({ success: false, message: "API 키 설정이 필요합니다." });
  }

  try {
    const queries = {
      'palantir': 'PLTR',
      'iren': 'IREN',
      'ionq': 'IONQ',
      'biomarin': 'BMNR'
    };
    const q = queries[stockParam] || 'PLTR';
    
    // 1. 뉴스 가져오기
    const newsUrl = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`;
    const newsRes = await fetch(newsUrl);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    // 2. 각 뉴스 요약하기
    const news = await Promise.all(
      articles.map(async (article) => {
        try {
          const translateRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': claudeApiKey, // Anthropic은 x-api-key를 사용합니다.
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022', 
              max_tokens: 400,
              messages: [{
                role: 'user',
                content: `다음 주식 관련 뉴스를 한국어로 핵심만 2-3문장 요약해줘:\n\n제목: ${article.title}\n내용: ${article.description || article.content}`
              }]
            })
          });

          const data = await translateRes.json();
          const translation = data.content?.[0]?.text || "요약 내용을 불러올 수 없습니다.";

          return {
            title: article.title,
            content: translation,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url
          };
        } catch (error) {
          return {
            title: article.title,
            content: "AI 분석 중 오류가 발생했습니다.",
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url
          };
        }
      })
    );

    return res.json({ success: true, news });
  } catch (error) {
    return res.json({ success: false, news: [], message: error.message });
  }
};
