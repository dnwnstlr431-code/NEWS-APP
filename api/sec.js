module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stockParam = req.query.stock || 'palantir';
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  const cikNumbers = {
    'palantir': '1321655',
    'iren': '1620459',
    'ionq': '1819989',
    'biomarin': '1643953'
  };

  const stockNames = {
    'palantir': '팔란티어',
    'iren': '아이렌',
    'ionq': '아이온큐',
    'biomarin': '비트마인'
  };

  const formDescriptions = {
    '8-K': '중요사항 보고서',
    '10-Q': '분기 실적 보고서',
    '10-K': '연간 실적 보고서',
    '4': '임원 주식 매매',
    'S-1': '신규 상장 관련',
    'DEF 14A': '주주총회 위임장',
    'SC 13G': '대량 주식 보유 보고',
    'SC 13D': '대량 주식 보유 변경',
    '3': '임원 최초 주식 보유 보고',
    '424B4': '증권 발행 설명서'
  };

  try {
    const cik = cikNumbers[stockParam] || cikNumbers['palantir'];
    const stockName = stockNames[stockParam] || '팔란티어';
    const paddedCik = cik.padStart(10, '0');

    const secUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
    
    const secRes = await fetch(secUrl, {
      headers: {
        'User-Agent': 'InvestmentNewsApp admin@investnews.com',
        'Accept': 'application/json'
      }
    });

    if (!secRes.ok) {
      return res.status(200).json({ 
        success: false, 
        sec: [], 
        error: `SEC API 오류: ${secRes.status}` 
      });
    }

    const secData = await secRes.json();
    const filings = secData.filings?.recent;
    
    if (!filings) {
      return res.status(200).json({ success: false, sec: [], error: '공시 없음' });
    }

    const recentFilings = [];
    for (let i = 0; i < Math.min(8, filings.form.length); i++) {
      recentFilings.push({
        form: filings.form[i],
        filingDate: filings.filingDate[i],
        accessionNumber: filings.accessionNumber[i],
        primaryDocument: filings.primaryDocument[i] || ''
      });
    }

    const secFilings = await Promise.all(
      recentFilings.map(async (filing) => {
        const formType = filing.form;
        const formDesc = formDescriptions[formType] || '기타 공시';
        const secViewUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10`;

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
              max_tokens: 400,
              messages: [{
                role: 'user',
                content: `SEC 공시를 분석해줘.

회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filing.filingDate}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
${formType} (${formDesc})가 무엇인지 1-2문장으로 설명

[투자자 주목 포인트]
이 공시가 ${stockName} 투자자에게 중요한 이유 2-3문장

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`
              }]
            })
          });

          const claudeData = await claudeRes.json();
          const analysis = claudeData.content?.[0]?.text || null;

          return {
            form: formType,
            formDesc: formDesc,
            filingDate: new Date(filing.filingDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            analysis: analysis,
            url: secViewUrl
          };
        } catch (err) {
          return {
            form: formType,
            formDesc: formDesc,
            filingDate: new Date(filing.filingDate).toLocaleDateString('ko-KR'),
            analysis: null,
            url: secViewUrl
          };
        }
      })
    );

    return res.status(200).json({ success: true, sec: secFilings });
  } catch (error) {
    return res.status(200).json({ success: false, sec: [], error: error.message });
  }
};
