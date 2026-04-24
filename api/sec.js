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
    '144': '내부자 주식 매도 예고',
    'S-1': '신규 상장 관련',
    'DEF 14A': '주주총회 위임장',
    'SC 13G': '대량 주식 보유 보고',
    'SC 13G/A': '대량 주식 보유 정정',
    'SC 13D': '대량 주식 보유 변경',
    '424B4': '증권 발행 설명서',
    '6-K': '해외기업 수시 보고서',
    '20-F': '해외기업 연간 보고서'
  };

  try {
    const ticker = tickers[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    // 일반 공시 목록
    const filingsUrl = `https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`;
    const filingsRes = await fetch(filingsUrl);
    const filingsData = await filingsRes.json();

    // 내부자 거래 전용 API (Form 4 상세 데이터)
    const insiderUrl = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${finnhubApiKey}`;
    const insiderRes = await fetch(insiderUrl);
    const insiderData = await insiderRes.json();
    const insiderTransactions = insiderData?.data || [];

    if (!filingsData || filingsData.length === 0) {
      return res.status(200).json({ success: false, sec: [], error: '공시 없음' });
    }

    const recentFilings = filingsData.slice(0, 8);

    const secFilings = await Promise.all(
      recentFilings.map(async (filing) => {
        const formType = filing.form || '기타';
        const formDesc = formDescriptions[formType] || '기타 공시';
        const filingDate = filing.filedDate || filing.acceptedDate || '';
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10&search_text=`;

        // Form 4, 3: 내부자 거래 API에서 상세 정보 가져오기
        let detailInfo = '';
        if (formType === '4' || formType === '3') {
          // 해당 날짜와 가장 가까운 내부자 거래 찾기
          const matchingTx = insiderTransactions.find(tx => {
            const txDate = tx.transactionDate || tx.filingDate || '';
            return txDate === filingDate || txDate.startsWith(filingDate?.substring(0, 7));
          }) || insiderTransactions[0];

          if (matchingTx) {
            const name = matchingTx.name || '알 수 없음';
            const share = matchingTx.share || 0;
            const change = matchingTx.change || 0;
            const txPrice = matchingTx.transactionPrice || 0;
            const txType = change > 0 ? '매수' : change < 0 ? '매도' : '변동없음';
            const absChange = Math.abs(change);

            detailInfo = `거래자: ${name}\n거래유형: ${txType}\n거래수량: ${absChange.toLocaleString()}주${txPrice ? `\n거래가: $${txPrice.toFixed(2)}` : ''}\n거래 후 보유수량: ${share.toLocaleString()}주`;
          }
        }

        // 144: 내부자 매도 예고
        if (formType === '144') {
          const matchingTx = insiderTransactions.find(tx => {
            const txDate = tx.transactionDate || tx.filingDate || '';
            return txDate.startsWith(filingDate?.substring(0, 7));
          });

          if (matchingTx) {
            const name = matchingTx.name || '알 수 없음';
            const change = Math.abs(matchingTx.change || 0);
            const txPrice = matchingTx.transactionPrice || 0;
            detailInfo = `매도 예정자: ${name}\n예정 매도 수량: ${change.toLocaleString()}주${txPrice ? `\n예상 가격: $${txPrice.toFixed(2)}` : ''}`;
          }
        }

        try {
          let prompt = '';

          if (formType === '4' || formType === '3') {
            prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}
${detailInfo ? `\n거래 상세:\n${detailInfo}` : ''}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
Form ${formType}이 무엇인지 1문장 설명

[거래 내역]
${detailInfo ? '위 거래 상세 정보를 바탕으로 거래자, 매수/매도, 수량, 가격을 구체적으로 설명' : '거래 내역 정보 없음'}

[투자자 주목 포인트]
이 거래가 ${stockName} 투자자에게 의미하는 바 2문장

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

          } else if (formType === '144') {
            prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}
${detailInfo ? `\n매도 예고 상세:\n${detailInfo}` : ''}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
Form 144가 무엇인지 1문장 설명

[매도 예고 내역]
${detailInfo ? '위 정보를 바탕으로 누가 얼마나 팔 예정인지 구체적으로 설명' : '상세 내역 없음'}

[투자자 주목 포인트]
이 매도 예고가 ${stockName} 투자자에게 미치는 영향 2문장

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`;

          } else if (formType === '8-K' || formType === '6-K') {
            prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
8-K 공시가 무엇인지 1문장 설명

[주요 내용]
8-K 공시의 일반적인 중요성과 ${stockName}에서 자주 발생하는 8-K 유형 설명

[투자자 주목 포인트]
이 공시가 ${stockName} 투자자에게 중요한 이유 2문장

[투자 영향]
중립 - 원문 확인 필요`;

          } else if (formType === '10-Q') {
            prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
10-Q 분기 실적 보고서가 무엇인지 1문장 설명

[주요 내용]
분기 실적 보고서의 핵심 구성요소와 투자자가 주목해야 할 지표 설명

[투자자 주목 포인트]
${stockName}의 분기 실적을 볼 때 중요한 포인트 2문장

[투자 영향]
중립 - 실제 수치 확인 필요`;

          } else if (formType === '10-K') {
            prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
10-K 연간 실적 보고서가 무엇인지 1문장 설명

[주요 내용]
연간 실적 보고서에서 투자자가 반드시 확인해야 할 핵심 지표 설명

[투자자 주목 포인트]
${stockName}의 연간 실적을 평가할 때 중요한 포인트 2문장

[투자 영향]
중립 - 실제 수치 확인 필요`;

          } else {
            prompt = `회사: ${stockName}
공시 유형: ${formType} (${formDesc})
제출일: ${filingDate}

아래 형식으로 한국어로 답변해줘:

[공시 설명]
${formType} (${formDesc})가 무엇인지 1-2문장 설명

[주요 내용]
이 공시의 일반적인 의미와 투자자에게 중요한 이유 설명

[투자자 주목 포인트]
이 공시가 ${stockName} 투자자에게 중요한 이유 2문장

[투자 영향]
긍정 / 부정 / 중립 중 하나와 이유 한 줄`;
          }

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
                content: prompt
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
