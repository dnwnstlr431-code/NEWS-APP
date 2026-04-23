module.exports = async (req, res) => {
  try {
    const stockParam = req.query.stock || 'palantir';
    
    const stocks = {
      'palantir': '팔란티어',
      'iren': '아이렌',
      'ionq': '아이온큐',
      'biomarin': '비트마인'
    };

    res.json({
      success: true,
      news: [
        {
          title: "샘플 뉴스 1",
          content: "이것은 테스트 뉴스입니다.",
          source: "Test Source",
          publishedAt: "2026.04.24",
          analysis: "테스트 분석입니다. API가 작동하고 있습니다.",
          importance: 5,
          url: "https://example.com"
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
