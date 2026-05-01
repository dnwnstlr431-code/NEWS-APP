# Lazy Banya Meals

게으름뱅이 강아지 브랜딩으로 만든 간편 메뉴 추천 웹앱입니다.

## 주요 기능

- 카테고리별 메뉴 추천: 다이어트식 / 일반식 / 자취식
- 달력에서 날짜 선택
- 아침 / 점심 / 저녁 메뉴 추천
- 메뉴 클릭 시 조리법, 사진, 재료 정보 표시
- 반응형 모바일 최적화 디자인

## 설치 및 실행

```bash
cd lazy-banya-meals
npm install
npm run dev
```

브라우저에서 `http://localhost:4173`로 접속하세요.

## 배포 준비

GitHub Actions가 `/lazy-banya-meals/**` 변경에 대해 빌드 테스트를 실행하도록 설정되어 있습니다.

## 구조

- `src/` - 앱 컴포넌트
- `public/` - 정적 파일
- `package.json` - Vite + React 설정
- `.gitignore` - 빌드 결과 및 `node_modules` 제외
