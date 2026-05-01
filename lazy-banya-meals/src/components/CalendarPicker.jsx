function CalendarPicker({ selectedDate, onChange }) {
  return (
    <div className="calendar-picker">
      <label htmlFor="meal-date">날짜 선택</label>
      <input
        id="meal-date"
        type="date"
        value={selectedDate}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export default CalendarPicker
