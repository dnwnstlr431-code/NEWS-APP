module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stockParam = req.query.stock || 'palantir';
  const claudeApiKey = process.env.CLAUDE_API_KEY;

  const cikNumbers = {
    'palantir': '1321655',
    'iren': '1878848',
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
    '3': '임원 최초 주식 보유 보고',
    'S-1': '신규 상장 관련',
    'DEF 14A': '주주총회 위임장',
    'SC 13G': '대량 주식 보유 보고',
    'SC 13D': '대량 주식 보유 변경',
    '424B4': '증권 발행 설명서',
    '6-K': '해외기업 수시 보고서',
    '20-F': '해외기업 연간 보고서'
  };

  try {
    const cik = cikNumbers[stockParam] || cikNumbers['palantir'];
    const stockName = stockNames[stockParam] || '팔란티어';

    const rssUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&dateb=&owner=include&count=10&search_text=&output=atom`;

    const rssRes = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    const rssText = await rssRes.text();

    // 디버깅용: 응답 첫 200자 확인
    const preview = rssText.substring(0, 200);

    // entry 태그 파싱 시도
    const entryMatches = rssText.match(/<entry>([\s\S]*?)<\/entry>/g);

    if (!entryMatches || entryMatches.length === 0) {
      // 응답이 왔지만 파싱 실패 → 미리보기 반환해서 디버깅
      return res.status(200).json({
        success: false,
        sec: [],
        error: '파싱 실패',
        debug: preview
      });
    }

    const filings = entryMatches.slice(0, 8).map(entry => {
      const titleMatch = entry.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const updatedMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/);
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
      const summaryMatch = entry.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '제목 없음';
      const updated = updatedMatch ? updatedMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      // 공시 유형 추출
      const formMatch = title.match(/^([A-Z0-9\-\/]+)/);
      const formType = formMatch ? formMatch[1].trim() : '기타';
      const formDesc = formDescriptions[formType] || '기타 공시';

      return {
        formType,
        formDesc,
        title,
        filingDate: updated ? new Date(updated).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : '날짜 없음',
        link: link || `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&count=10`,
        summary
      };
    });

    // Claude로 분석
    const secFilings = await Promise.all(
      filings.map(async (filing) => {
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
공시 유형: ${filing.formType} (${filing.formDesc})
제출일: ${filing.filingDate}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
${filing.formType} (${filing.formDesc})가 무엇인지 1-2문장으로 설명

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
            form: filing.formType,
            formDesc: filing.formDesc,
            filingDate: filing.filingDate,
            analysis,
            url: filing.link
          };
        } catch (err) {
          return {
            form: filing.formType,
            formDesc: filing.formDesc,
            filingDate: filing.filingDate,
            analysis: null,
            url: filing.link
          };
        }
      })
    );

    return res.status(200).json({ success: true, sec: secFilings });

  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      sec: [], 
      error: error.message 
    });
  }
};
