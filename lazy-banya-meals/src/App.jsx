import { useMemo, useState } from 'react'
import CategoryFilter from './components/CategoryFilter.jsx'
import CalendarPicker from './components/CalendarPicker.jsx'
import MenuCard from './components/MenuCard.jsx'
import RecipeModal from './components/RecipeModal.jsx'
import { menuItems, categories } from './data/menuData.js'
import './styles/app.css'

const meals = ['아침', '점심', '저녁']

function App() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [activeRecipe, setActiveRecipe] = useState(null)

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === selectedCategory),
    [selectedCategory]
  )

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <div className="hero-copy">
          <div className="hero-badge">게으름뱅이 강아지</div>
          <h1>식사? 자동화로 커버한다</h1>
          <p>매일 아침·점심·저녁 추천을 한 곳에서, 채널 브랜딩 그대로.</p>
        </div>
        <div className="hero-mascot">🐶</div>
      </header>

      <main className="page-content">
        <section className="control-panel">
          <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </section>

        <section className="menu-grid">
          {meals.map((meal) => (
            <div key={meal} className="meal-section">
              <div className="meal-header">
                <span>{meal}</span>
                <small>{selectedDate} 추천</small>
              </div>
              <div className="cards-row">
                {filteredItems
                  .filter((item) => item.meal === meal)
                  .map((item) => (
                    <MenuCard key={item.id} item={item} onSelect={setActiveRecipe} />
                  ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
    </div>
  )
}

export default App
