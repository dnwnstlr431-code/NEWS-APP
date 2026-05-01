function CategorySelection({ categories, selectedCategory, onSelect, onNext }) {
  return (
    <div className="screen-card category-screen">
      <div className="section-head">
        <span className="section-label">카테고리 선택</span>
        <h2>어떤 식단으로 시작할까요?</h2>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={category === selectedCategory ? 'category-button active' : 'category-button'}
            onClick={() => onSelect(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <button className="primary-button wide-button" type="button" onClick={onNext}>
        선택하기
      </button>
    </div>
  )
}

export default CategorySelection
