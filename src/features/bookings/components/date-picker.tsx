"use client";

import {useId, useRef} from "react";
import Icon from "@/components/ui/icon";

export default function DatePicker({label, name, value, min, onChange, returnJourney = false}: {label: string; name: string; value: string; min: string; onChange: (value: string) => void; returnJourney?: boolean}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const next = new Date(`${min}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDay = next.toISOString().slice(0, 10);
  function openCalendar() {
    const element = input.current;
    if (!element) return;
    element.focus();
    try {element.showPicker?.();} catch { /* Native keyboard entry remains available. */ }
  }
  return <div className="falak-date-picker">
    <label htmlFor={id}>{label}</label>
    <div className="falak-date-input">
      <input ref={input} id={id} name={name} type="date" required min={min} value={value} onChange={event => onChange(event.target.value)}/>
      <button type="button" className="falak-date-calendar" onClick={openCalendar} aria-label={`Open calendar for ${label.toLowerCase()}`}><Icon name="calendar" size={20}/></button>
    </div>
    <div className="falak-date-shortcuts" role="group" aria-label={`${label} quick choices`}>
      <button type="button" aria-pressed={value === min} onClick={() => onChange(min)}>{returnJourney ? "Same day" : "Today"}</button>
      <button type="button" aria-pressed={value === nextDay} onClick={() => onChange(nextDay)}>{returnJourney ? "Next day" : "Tomorrow"}</button>
    </div>
  </div>;
}
