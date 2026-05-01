import { useEffect, useMemo, useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import CategorySelection from './components/CategorySelection.jsx'
import CalendarScreen from './components/CalendarScreen.jsx'
import MenuCard from './components/MenuCard.jsx'
import RecipeModal from './components/RecipeModal.jsx'
import { categories, getMenuForDate } from './data/menuData.js'
import './styles/app.css'

const initialDate = new Date()

function App() {
  const [view, setView] = useState('splash')
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [activeRecipe, setActiveRecipe] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setView('category'), 2000)
    return () => clearTimeout(timer)
  }, [])

  const mealsForDate = useMemo(
    () => getMenuForDate(selectedCategory, selectedDate.getDate()),
    [selectedCategory, selectedDate]
  )

  const selectedLabel = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="app-shell">
      <div className="hero-strip">
        <span>게으름뱅이 채널</span>
        <div className="floating-mascot">🐶</div>
      </div>

      {view === 'splash' && <StartScreen onFinish={() => setView('category')} />}

      {view === 'category' && (
        <CategorySelection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={(category) => setSelectedCategory(category)}
          onNext={() => setView('calendar')}
        />
      )}

      {view === 'calendar' && (
        <CalendarScreen
          currentDate={initialDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onBack={() => setView('category')}
          onNext={() => setView('menu')}
        />
      )}

      {view === 'menu' && (
        <div className="screen-card menu-screen">
          <div className="section-head">
            <span className="section-label">오늘의 메뉴</span>
            <h2>{selectedLabel}</h2>
            <p className="subtitle">{selectedCategory} 추천 아침, 점심, 저녁을 확인해보세요.</p>
          </div>

          <div className="meal-list">
            {['breakfast', 'lunch', 'dinner'].map((mealType) => (
              <div key={mealType} className="meal-block">
                <div className="meal-title">
                  <span>{mealType === 'breakfast' ? '아침' : mealType === 'lunch' ? '점심' : '저녁'}</span>
                  <span className="meal-label">{mealsForDate[mealType].calories} kcal</span>
                </div>
                <MenuCard item={mealsForDate[mealType]} onSelect={setActiveRecipe} />
              </div>
            ))}
          </div>

          <div className="navigation-strip">
            <button className="secondary-button" type="button" onClick={() => setView('calendar')}>
              날짜 다시 선택
            </button>
            <button className="secondary-button" type="button" onClick={() => setView('category')}>
              식단 다시 선택
            </button>
          </div>
        </div>
      )}

      <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
    </div>
  )
}

export default App
