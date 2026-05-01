function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null

  return (
    <div className="recipe-modal" onClick={onClose}>
      <div className="recipe-card" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="recipe-header-info">
            <span className="section-label">조리법 보기</span>
            <h2>{recipe.name}</h2>
            <p>{recipe.category} · {recipe.meal} · {recipe.cookTime}</p>
            <div className="menu-meta">
              <span className="calorie-badge">{recipe.calories} kcal</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">✕</button>
        </header>

        <div className="recipe-body">
          <img src={recipe.image} alt={recipe.name} />

          <section className="recipe-detail">
            <h3>재료 정보</h3>
            <ul>
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </section>

          <section className="recipe-detail">
            <h3>조리 순서</h3>
            {recipe.steps.map((step, index) => (
              <div key={step.text} className="recipe-step">
                <div className="recipe-step-title">Step {index + 1}</div>
                <p>{step.text}</p>
                <img src={step.image} alt={`Step ${index + 1}`} />
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

export default RecipeModal
