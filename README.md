# NEWS-APP GitHub Integration

이 폴더를 GitHub과 자동으로 연동하려면 `setup-github.ps1` 스크립트를 사용하세요.

## 사용 방법

1. PowerShell에서 워크스페이스 루트로 이동합니다.
2. 다음 명령을 실행합니다:

```powershell
./setup-github.ps1 -GitHubRepoUrl "https://github.com/<username>/<repo>.git" -Push
```

3. GitHub 리포지토리를 새로 만들려면, GitHub CLI(`gh`)가 설치되어 있어야 합니다.

## 옵션

- `-GitHubRepoUrl`: 연결할 GitHub 원격 저장소 URL
- `-CreateRepo`: 로컬 폴더 이름으로 GitHub 리포지토리를 생성하려면 사용
- `-Push`: 원격 저장소에 `main` 브랜치를 푸시하려면 사용

## 예

```powershell
./setup-github.ps1 -GitHubRepoUrl "https://github.com/yourname/news-app.git" -Push
```
