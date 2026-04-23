module.exports = async (req, res) => {
  const stockParam = req.query.stock || 'palantir';
  const newsApiKey = process.env.NEWS_API_KEY;
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!newsApiKey || !claudeApiKey) {
    return res.json({ success: false, news: [], error: 'API 키 없음' });
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
