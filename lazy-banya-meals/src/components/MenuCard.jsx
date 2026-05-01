function MenuCard({ item, onSelect }) {
  return (
    <button className="menu-card" type="button" onClick={() => onSelect(item)}>
      <img className="menu-image" src={item.image} alt={item.name} />
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="badge">{item.category}</div>
    </button>
  )
}

export default MenuCard
