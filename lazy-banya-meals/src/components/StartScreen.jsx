import { useEffect } from 'react'

function StartScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div className="splash-screen">
      <div className="splash-card">
        <div className="mascot-circle">🐶</div>
        <div className="splash-text">
          <strong>식사? 자동화로 커버한다</strong>
          <p>게으름뱅이 강아지와 함께하는 오늘의 메뉴 추천</p>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
