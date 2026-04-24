const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
    // ✅ 캐시 확인
    const cached = await redis.get(`sec:${stockParam}`);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json({
        success: true,
        sec: data.sec,
        updatedAt: data.updatedAt,
        fromCache: true
      });
    }

    const ticker = tickers[stockParam] || 'PLTR';
    const stockName = stockNames[stockParam] || '팔란티어';

    // 공시 목록 가져오기
    const filingsUrl = `https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${finnhubApiKey}`;
    const filingsRes = await fetch(filingsUrl);
    const filingsData = await filingsRes.json();

    // 내부자 거래 전용 API
    const insiderUrl = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${finnhubApiKey}`;
    const insiderRes = await fetch(insiderUrl);
    const insiderData = await insiderRes.json();
    const insiderTransactions = insiderData?.data || [];

    if (!filingsData || filingsData.length === 0) {
      return res.status(200).json({ success: false, sec: [], error: '공시 없음' });
    }

    // Form 4 중복 제거
    const seen = new Set();
    const deduped = filingsData.filter(filing => {
      const key = `${filing.form}-${filing.filedDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const recentFilings = deduped.slice(0, 8);
    const usedTxIndices = new Set();

    const secFilings = await Promise.all(
      recentFilings.map(async (filing) => {
        const formType = filing.form || '기타';
        const formDesc = formDescriptions[formType] || '기타 공시';
        const filingDate = filing.filedDate || filing.acceptedDate || '';
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${encodeURIComponent(formType)}&dateb=&owner=include&count=10&search_text=`;

        let detailInfo = '';

        if (formType === '4' || formType === '3') {
          const filingDateStr = filingDate ? filingDate.substring(0, 10) : '';
          const matchIdx = insiderTransactions.findIndex((tx, idx) => {
            if (usedTxIndices.has(idx)) return false;
            const txDate = (tx.transactionDate || tx.filingDate || '').substring(0, 10);
            return txDate === filingDateStr;
          });
          if (matchIdx !== -1) {
            usedTxIndices.add(matchIdx);
            const tx = insiderTransactions[matchIdx];
            const name = tx.name || '알 수 없음';
            const change = tx.change || 0;
            const txPrice = tx.transactionPrice || 0;
            const txType = change > 0 ? '매수' : change < 0 ? '매도' : '변동없음';
            const absChange = Math.abs(change);
            detailInfo = `거래자: ${name}\n거래유형: ${txType}\n거래수량: ${absChange.toLocaleString()}주${txPrice ? `\n거래가: $${txPrice.toFixed(2)}` : ''}\n거래 후 보유수량: ${tx.share?.toLocaleString() || ''}주`;
          }
        }

        if (formType === '144') {
          const filingDateStr = filingDate ? filingDate.substring(0, 10) : '';
          const matchIdx = insiderTransactions.findIndex((tx, idx) => {
            if (usedTxIndices.has(idx)) return false;
            const txDate = (tx.transactionDate || tx.filingDate || '').substring(0, 10);
            return txDate.startsWith(filingDateStr.substring(0, 7));
          });
          if (matchIdx !== -1) {
            usedTxIndices.add(matchIdx);
            const tx = insiderTransactions[matchIdx];
            const name = tx.name || '알 수 없음';
            const change = Math.abs(tx.change || 0);
            const txPrice = tx.transactionPrice || 0;
            detailInfo = `매도 예정자: ${name}\n예정 매도 수량: ${change.toLocaleString()}주${txPrice ? `\n예상 가격: $${txPrice.toFixed(2)}` : ''}`;
          }
        }

        try {
          let prompt = '';

          if (formType === '4' || formType === '3') {
            prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}\n${detailInfo ? `\n거래 상세:\n${detailInfo}` : ''}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\nForm ${formType}이 무엇인지 1문장 설명\n\n[거래 내역]\n${detailInfo ? '위 거래 상세 정보를 바탕으로 거래자, 매수/매도, 수량, 가격을 구체적으로 설명' : '거래 내역 정보 없음'}\n\n[투자자 주목 포인트]\n이 거래가 ${stockName} 투자자에게 의미하는 바 2문장\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`;
          } else if (formType === '144') {
            prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}\n${detailInfo ? `\n매도 예고 상세:\n${detailInfo}` : ''}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\nForm 144가 무엇인지 1문장 설명\n\n[매도 예고 내역]\n${detailInfo ? '위 정보를 바탕으로 누가 얼마나 팔 예정인지 구체적으로 설명' : '상세 내역 없음'}\n\n[투자자 주목 포인트]\n이 매도 예고가 ${stockName} 투자자에게 미치는 영향 2문장\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`;
          } else if (formType === '8-K' || formType === '6-K') {
            prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n8-K 공시가 무엇인지 1문장 설명\n\n[주요 내용]\n8-K 공시의 일반적인 중요성과 ${stockName}에서 자주 발생하는 8-K 유형 설명\n\n[투자자 주목 포인트]\n이 공시가 ${stockName} 투자자에게 중요한 이유 2문장\n\n[투자 영향]\n중립 - 원문 확인 필요`;
          } else if (formType === '10-Q') {
            prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n10-Q 분기 실적 보고서가 무엇인지 1문장 설명\n\n[주요 내용]\n분기 실적 보고서의 핵심 구성요소와 투자자가 주목해야 할 지표 설명\n\n[투자자 주목 포인트]\n${stockName}의 분기 실적을 볼 때 중요한 포인트 2문장\n\n[투자 영향]\n중립 - 실제 수치 확인 필요`;
          } else if (formType === '10-K') {
            prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n10-K 연간 실적 보고서가 무엇인지 1문장 설명\n\n[주요 내용]\n연간 실적 보고서에서 투자자가 반드시 확인해야 할 핵심 지표 설명\n\n[투자자 주목 포인트]\n${stockName}의 연간 실적을 평가할 때 중요한 포인트 2문장\n\n[투자 영향]\n중립 - 실제 수치 확인 필요`;
          } else {
            prompt = `회사: ${stockName}\n공시 유형: ${formType} (${formDesc})\n제출일: ${filingDate}\n\n아래 형식으로 한국어로 답변해줘:\n\n[공시 설명]\n${formType} (${formDesc})가 무엇인지 1-2문장 설명\n\n[주요 내용]\n이 공시의 일반적인 의미와 투자자에게 중요한 이유 설명\n\n[투자자 주목 포인트]\n이 공시가 ${stockName} 투자자에게 중요한 이유 2문장\n\n[투자 영향]\n긍정 / 부정 / 중립 중 하나와 이유 한 줄`;
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
              messages: [{ role: 'user', content: prompt }]
            })
          });

          const claudeData = await claudeRes.json();
          const analysis = claudeData.content?.[0]?.text || null;

          return {
            form: formType,
            formDesc: formDesc,
            filingDate: filingDate ? new Date(filingDate).toLocaleDateString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit'
            }) : '날짜 없음',
            analysis,
            url
          };
        } catch (err) {
          return {
            form: formType,
            formDesc: formDesc,
            filingDate: filingDate ? new Date(filingDate).toLocaleDateString('ko-KR') : '날짜 없음',
            analysis: null,
            url
          };
        }
      })
    );

    // ✅ Redis에 캐시 저장 (6시간)
    const updatedAt = new Date().toISOString();
    await redis.set(
      `sec:${stockParam}`,
      JSON.stringify({ sec: secFilings, updatedAt }),
      { ex: 21600 }
    );

    return res.status(200).json({ success: true, sec: secFilings, updatedAt, fromCache: false });

  } catch (error) {
    return res.status(200).json({ success: false, sec: [], error: error.message });
  }
};
