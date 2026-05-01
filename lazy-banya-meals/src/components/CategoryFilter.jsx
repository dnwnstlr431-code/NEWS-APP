function CategoryFilter({ categories, selectedCategory, onSelect }) {
  return (
    <div className="category-filter">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={category === selectedCategory ? 'active' : ''}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
