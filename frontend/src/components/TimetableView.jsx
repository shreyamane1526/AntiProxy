import { useState } from "react"
import { TIMETABLE_HOURS, WEEK_DAYS } from "../data/mockData"

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM"
  const display = hour % 12 || 12
  return `${display}:00 ${suffix}`
}

function weekdayFromDate(date = new Date()) {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return names[date.getDay()]
}

function SlotContent({ slot }) {
  return (
    <>
      <p className="truncate text-sm font-semibold text-navy">{slot.subject}</p>
      {slot.meta ? <p className="truncate text-xs text-teal-dark">{slot.meta}</p> : null}
      {slot.room ? <p className="truncate text-xs text-muted">{slot.room}</p> : null}
    </>
  )
}

export default function TimetableView({ lectures = [], onLectureClick }) {
  const [view, setView] = useState("weekly")
  const [day, setDay] = useState(() => {
    const today = weekdayFromDate()
    return WEEK_DAYS.includes(today) ? today : "Monday"
  })
  const dailyLectures = lectures.filter((item) => item.day === day)
  const interactive = typeof onLectureClick === "function"

  const renderSlot = (slot, className, style) => {
    const content = <SlotContent slot={slot} />
    if (interactive) {
      return (
        <button key={slot.id} type="button" onClick={() => onLectureClick(slot)} className={className} style={style}>
          {content}
        </button>
      )
    }
    return (
      <div key={slot.id} className={className} style={style}>
        {content}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-navy">Timetable</h2>
        <div className="flex rounded-lg border border-border bg-white p-1">
          {["daily", "weekly"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize ${
                view === option ? "bg-navy text-white" : "text-muted hover:text-navy"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {view === "daily" ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {WEEK_DAYS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setDay(name)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                day === name ? "bg-teal text-white" : "border border-border bg-white text-muted hover:text-navy"
              }`}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      ) : null}

      {view === "weekly" ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <div
            className="grid min-w-[860px]"
            style={{
              gridTemplateColumns: "72px repeat(6, minmax(120px, 1fr))",
              gridTemplateRows: `44px repeat(${TIMETABLE_HOURS.length}, 72px)`,
            }}
          >
            <div className="border-b border-r border-border bg-page" />
            {WEEK_DAYS.map((name) => (
              <div
                key={name}
                className="border-b border-r border-border bg-page px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted last:border-r-0"
              >
                {name}
              </div>
            ))}

            {TIMETABLE_HOURS.map((hour, hourIndex) => (
              <div key={`h-${hour}`} className="contents">
                <div
                  className="border-b border-r border-border px-2 py-2 text-xs font-medium text-muted"
                  style={{ gridColumn: 1, gridRow: hourIndex + 2 }}
                >
                  {formatHour(hour)}
                </div>
                {WEEK_DAYS.map((name, dayIndex) => (
                  <div
                    key={`${name}-${hour}`}
                    className="border-b border-r border-border last:border-r-0"
                    style={{ gridColumn: dayIndex + 2, gridRow: hourIndex + 2 }}
                  />
                ))}
              </div>
            ))}

            {lectures.map((slot) => {
              const dayIndex = WEEK_DAYS.indexOf(slot.day)
              const hourIndex = TIMETABLE_HOURS.indexOf(slot.startHour)
              if (dayIndex < 0 || hourIndex < 0) return null
              return renderSlot(
                slot,
                `z-10 m-1 overflow-hidden rounded-md bg-teal/15 px-2 py-1.5 text-left ${interactive ? "transition hover:bg-teal/25" : ""}`,
                {
                  gridColumn: dayIndex + 2,
                  gridRow: `${hourIndex + 2} / span ${slot.duration}`,
                },
              )
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div
            className="grid"
            style={{
              gridTemplateColumns: "80px 1fr",
              gridTemplateRows: `repeat(${TIMETABLE_HOURS.length}, 88px)`,
            }}
          >
            {TIMETABLE_HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-b border-r border-border px-2 py-3 text-xs font-medium text-muted">{formatHour(hour)}</div>
                <div className="relative overflow-visible border-b border-border">
                  {dailyLectures
                    .filter((slot) => slot.startHour === hour)
                    .map((slot) =>
                      renderSlot(
                        slot,
                        `absolute inset-x-2 top-2 overflow-hidden rounded-md bg-teal/15 px-3 py-2 text-left ${interactive ? "hover:bg-teal/25" : ""}`,
                        { height: `calc(${slot.duration * 88}px - 16px)` },
                      ),
                    )}
                </div>
              </div>
            ))}
          </div>
          {dailyLectures.length === 0 ? (
            <p className="border-t border-border px-4 py-8 text-center text-sm text-muted">No lectures scheduled for {day}.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}

export { formatHour }
