module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stockParam = req.query.stock || 'palantir';
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;

  const tickers = {
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
    const ticker = tickers[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    const finnhubUrl = `https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`;
    const finnhubRes = await fetch(finnhubUrl);
    const finnhubData = await finnhubRes.json();

    if (!finnhubData || finnhubData.length === 0) {
      return res.status(200).json({ success: false, sec: [], error: '공시 없음' });
    }

    const recentFilings = finnhubData.slice(0, 8);

    const secFilings = await Promise.all(
      recentFilings.map(async (filing) => {
        const formType = filing.form || '기타';
        const formDesc = formDescriptions[formType] || '기타 공시';
        const filingDate = filing.filedDate || filing.acceptedDate || '';
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10&search_text=`;

        // Form 4일 경우 상세 내용 가져오기
        let detailInfo = '';
        if (formType === '4' || formType === '3') {
          try {
            const reportUrl = filing.reportUrl || filing.filingUrl || '';
            if (reportUrl) {
              const reportRes = await fetch(reportUrl);
              const reportText = await reportRes.text();

              // 임원 이름 추출
              const nameMatch = reportText.match(/<rptOwnerName>(.*?)<\/rptOwnerName>/);
              const ownerName = nameMatch ? nameMatch[1] : '';

              // 거래 정보 추출
              const shares = [];
              const shareMatches = reportText.matchAll(/<transactionShares>\s*<value>([\d.]+)<\/value>/g);
              for (const match of shareMatches) {
                shares.push(parseFloat(match[1]));
              }

              const prices = [];
              const priceMatches = reportText.matchAll(/<transactionPricePerShare>\s*<value>([\d.]+)<\/value>/g);
              for (const match of priceMatches) {
                prices.push(parseFloat(match[1]));
              }

              // 매수/매도 구분
              const codeMatch = reportText.match(/<transactionCode>(.*?)<\/transactionCode>/);
              const txCode = codeMatch ? codeMatch[1] : '';
              const txType = txCode === 'S' ? '매도' : txCode === 'P' ? '매수' : txCode === 'A' ? '수여' : txCode;

              // 직책 추출
              const isDirector = reportText.includes('<isDirector>1</isDirector>') ? '이사' : '';
              const isOfficer = reportText.includes('<isOfficer>1</isOfficer>') ? '임원' : '';
              const role = isDirector || isOfficer || '내부자';

              const totalShares = shares.reduce((a, b) => a + b, 0);
              const avgPrice = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : '';

              if (ownerName && totalShares) {
                detailInfo = `거래자: ${ownerName} (${role})\n거래유형: ${txType}\n총 거래수량: ${totalShares.toLocaleString()}주${avgPrice ? `\n평균가: $${avgPrice}` : ''}`;
              }
            }
          } catch (e) {
            detailInfo = '';
          }
        }

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
              max_tokens: 800,
              messages: [{
                role: 'user',
                content: `SEC 공시를 분석해줘.

회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}
${detailInfo ? `\n거래 상세 정보:\n${detailInfo}` : ''}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
${formType} (${formDesc})가 무엇인지 1-2문장으로 설명

${detailInfo ? `[거래 내역]\n거래자, 거래 유형, 수량, 가격 등 구체적 내용을 2-3문장으로 설명` : ''}

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
            filingDate: filingDate ? new Date(filingDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }) : '날짜 없음',
            analysis: analysis,
            url: url
          };
        } catch (err) {
          return {
            form: formType,
            formDesc: formDesc,
            filingDate: filingDate ? new Date(filingDate).toLocaleDateString('ko-KR') : '날짜 없음',
            analysis: null,
            url: url
          };
        }
      })
    );

    return res.status(200).json({ success: true, sec: secFilings });
  } catch (error) {
    return res.status(200).json({ success: false, sec: [], error: error.message });
  }
};
