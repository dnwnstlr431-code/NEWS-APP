function MenuCard({ item, onSelect }) {
  return (
    <button className="menu-card" type="button" onClick={() => onSelect(item)}>
      <img className="menu-image" src={item.image} alt={item.name} />
      <div className="menu-info">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="menu-meta">
          <span className="calorie-badge">{item.calories} kcal</span>
          <span className="cook-time">조리 {item.cookTime}</span>
        </div>
        <span className="view-button">보기</span>
      </div>
    </button>
  )
}

export default MenuCard
