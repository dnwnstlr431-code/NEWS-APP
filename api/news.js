module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.json({ success: false, news: [] });
  }

  try {
    const queries = {
      'palantir': 'PLTR',
      'iren': 'IREN',
      'ionq': 'IONQ',
      'biomarin': 'BMNR'
    };

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
              'authorization': `Bearer ${claudeApiKey}`,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20250514',
              max_tokens: 200,
              messages: [{
                role: 'user',
                content: `이 뉴스를 한국어로 번역해줄래? 2-3문장으로.\n\n${article.description || article.content || '내용 없음'}`
              }]
            })
          });

          const data = await translateRes.json();
          const translation = data.content?.[0]?.text || article.description || '번역 실패';

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
            content: article.description || '내용 없음',
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString('ko-KR'),
            url: article.url
          };
        }
      })
    );

    return res.json({ success: true, news });
  } catch (error) {
    return res.json({ success: false, news: [] });
  }
};
