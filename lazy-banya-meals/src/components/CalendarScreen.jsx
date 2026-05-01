const weekDays = ['일', '월', '화', '수', '목', '금', '토']

function CalendarScreen({ currentDate, selectedDate, onSelectDate, onNext, onBack }) {
  const year = currentDate.getFullYear()
  const month = currentDate.toLocaleString('ko-KR', { month: 'long' })
  const firstDayIndex = new Date(year, currentDate.getMonth(), 1).getDay()
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate()
  const today = new Date()

  const cells = []
  for (let i = 0; i < firstDayIndex; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, currentDate.getMonth(), day))
  }

  return (
    <div className="screen-card calendar-screen">
      <div className="section-head">
        <span className="section-label">달력에서 날짜 선택</span>
        <h2>{year}년 {month}</h2>
      </div>

      <div className="calendar-legend">
        {weekDays.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="calendar-cell empty" />
          }

          const isToday = date.toDateString() === today.toDateString()
          const isSelected = date.toDateString() === selectedDate.toDateString()

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={isSelected ? 'calendar-cell selected' : isToday ? 'calendar-cell today' : 'calendar-cell'}
              onClick={() => onSelectDate(date)}
            >
              <span>{date.getDate()}</span>
            </button>
          )
        })}
      </div>

      <div className="calendar-actions">
        <button className="secondary-button" type="button" onClick={onBack}>
          이전으로
        </button>
        <button className="primary-button" type="button" onClick={onNext}>
          메뉴 보기
        </button>
      </div>
    </div>
  )
}

export default CalendarScreen
