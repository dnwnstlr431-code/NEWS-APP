function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null

  return (
    <div className="recipe-modal" onClick={onClose}>
      <div className="recipe-card" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <h2>{recipe.name}</h2>
            <p>{recipe.category} · {recipe.meal}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className="recipe-body">
          <img src={recipe.image} alt={recipe.name} />
          <section>
            <h3>재료 정보</h3>
            <ul>
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>조리법</h3>
            <p>{recipe.details}</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default RecipeModal
