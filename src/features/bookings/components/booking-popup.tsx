"use client";

import {useEffect, useId, useRef, useState} from "react";
import Icon from "@/components/ui/icon";
import {useUnsavedChanges} from "@/components/forms/unsaved-changes";
import {api} from "@/lib/api-client";
import {useSiteCatalog} from "@/features/content/public-content";
import "./booking-popup.css";

type Ride = {
  pickup: string; destination: string; stops: string[]; timing: "now" | "later";
  journey: "one-way" | "round-trip"; date: string; time: string;
  returnDate: string; returnTime: string; passengers: number; luggage: number;
  vehicle: string; name: string; phone: string; notes: string;
};
const emptyRide: Ride = {pickup: "", destination: "", stops: [], timing: "now", journey: "one-way", date: "", time: "", returnDate: "", returnTime: "", passengers: 1, luggage: 1, vehicle: "", name: "", phone: "", notes: ""};

export default function BookingPopup() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const mapTrigger = useRef<HTMLButtonElement | null>(null);
  const {vehicles, locations, routes, fares} = useSiteCatalog();
  const locationList = useId();
  const [ride, setRide] = useState<Ride>(emptyRide);
  const [step, setStep] = useState(0);
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<"draft" | "ready" | "cancelled">("draft");
  const [error, setError] = useState("");
  const [mapTarget, setMapTarget] = useState<"pickup" | "destination" | null>(null);
  const [pin, setPin] = useState({x: 48, y: 45});
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingVersion, setBookingVersion] = useState(1);
  const [bookingStatus, setBookingStatus] = useState("Pending");
  const idempotencyKey = useRef("");
  const confirmDiscard = useUnsavedChanges(isOpen && (status === "draft" || rescheduling) && JSON.stringify(ride) !== JSON.stringify(emptyRide), reset);
  const vehicle = vehicles.find(item => item.name === ride.vehicle);
  const estimatedFare = ride.stops.length || ride.journey === "round-trip" ? null : fares?.find(item => item.route.toLowerCase() === `${ride.pickup} → ${ride.destination}`.toLowerCase())?.fare ?? null;
  const eligibleVehicles = vehicles.filter(item => item.passengers >= ride.passengers && item.bags >= ride.luggage);
  const today = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());

  function update<K extends keyof Ride>(key: K, value: Ride[K]) {setRide(current => ({...current, [key]: value})); setError("");}
  function close() {if (submitting) return; confirmDiscard(() => {setMapTarget(null); setIsOpen(false); dialog.current?.close();});}
  function closeMap() {setMapTarget(null); requestAnimationFrame(() => mapTrigger.current?.focus());}
  useEffect(() => {
    function bookVehicle(event: Event) {
      const name = (event as CustomEvent<string>).detail;
      if (submitting || !vehicles.some(item => item.name === name)) return;
      trigger.current = document.activeElement as HTMLElement;
      if (status !== "draft" || rescheduling) reset();
      setRide(current => ({...current, vehicle: name}));
      setError(""); setStep(0); setIsOpen(true); dialog.current?.showModal();
      requestAnimationFrame(() => heading.current?.focus({preventScroll: true}));
    }
    window.addEventListener("falak:book-vehicle", bookVehicle);
    return () => window.removeEventListener("falak:book-vehicle", bookVehicle);
  });
  useEffect(() => {
    function editBooking(event: Event) {
      const reference = (event as CustomEvent<string>).detail;
      void api<{bookings: (Ride & {reference: string; version: number; status: string})[]}>("/api/bookings").then(result => {
        const booking = result.bookings.find(item => item.reference === reference);
        if (!booking) return;
        setRide({...emptyRide, ...booking, timing: "later"}); setReference(booking.reference); setBookingVersion(booking.version); setBookingStatus(booking.status); setRescheduling(true); setStatus("ready"); setStep(0); setIsOpen(true); setError(""); trigger.current = document.activeElement as HTMLElement; dialog.current?.showModal();
      }).catch(() => {setError("Unable to open this booking. Please try again.");});
    }
    window.addEventListener("falak:edit-booking", editBooking);
    return () => window.removeEventListener("falak:edit-booking", editBooking);
  }, []);
  useEffect(() => {
    function open(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.replace(/\/$/, "") !== "/book-a-ride") return;
      event.preventDefault();
      trigger.current = target;
      const preferredVehicle = url.searchParams.get("vehicle")?.slice(0, 100);
      const preferredPackage = url.searchParams.get("package")?.slice(0, 100);
      if (status === "draft" && (preferredVehicle || preferredPackage)) {
        setRide(current => {
          const preference = [preferredVehicle ? `Requested vehicle: ${preferredVehicle}` : "", preferredPackage ? `Requested package: ${preferredPackage}` : ""].filter(Boolean).join("; ");
          const match = vehicles.find(item => item.name.toLowerCase() === preferredVehicle?.toLowerCase());
          return {...current, ...(match ? {vehicle: match.name} : {}), notes: current.notes.includes(preference) ? current.notes : [current.notes, preference].filter(Boolean).join("\n").slice(0, 600)};
        });
      }
      dialog.current?.showModal();
      setIsOpen(true);
      requestAnimationFrame(() => {heading.current?.focus({preventScroll: true}); dialog.current?.querySelector(".ride-form-content")?.scrollTo(0, 0);});
    }
    document.addEventListener("click", open, true);
    return () => document.removeEventListener("click", open, true);
  }, [status, vehicles]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    let previousOverflow: string | null = null;
    function restore() {
      if (previousOverflow !== null) {document.body.style.overflow = previousOverflow; previousOverflow = null;}
      trigger.current?.focus();
    }
    const observer = new MutationObserver(() => {
      if (element?.open && previousOverflow === null) {previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";}
      else if (!element?.open) restore();
    });
    observer.observe(element, {attributes: true, attributeFilter: ["open"]});
    element.addEventListener("close", restore);
    return () => {observer.disconnect(); element.removeEventListener("close", restore); restore();};
  }, []);

  function goTo(next: number) {setStep(next); setError(""); requestAnimationFrame(() => {heading.current?.focus(); dialog.current?.querySelector(".ride-form-content")?.scrollTo(0, 0);});}
  function validateRoute() {
    if (!ride.pickup.trim() || !ride.destination.trim()) return "Add your pickup location and destination.";
    if (ride.pickup.trim().toLowerCase() === ride.destination.trim().toLowerCase()) return "Choose different pickup and drop-off locations.";
    if (ride.stops.some(stop => !stop.trim())) return "Enter a location for each stop, or remove the empty stop.";
    if (ride.timing === "later" && (!ride.date || !ride.time || new Date(`${ride.date}T${ride.time}:00+03:00`).getTime() <= Date.now())) return "Choose a future pickup date and time (Saudi Arabia time).";
    if (ride.journey === "round-trip") {
      const outbound = ride.timing === "later" ? new Date(`${ride.date}T${ride.time}:00+03:00`).getTime() : Date.now();
      if (!ride.returnDate || !ride.returnTime || new Date(`${ride.returnDate}T${ride.returnTime}:00+03:00`).getTime() <= outbound) return "Choose a return date and time after your pickup.";
    }
    return "";
  }
  async function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let message = validateRoute();
    if (step > 0 && (!vehicle || vehicle.passengers < ride.passengers || vehicle.bags < ride.luggage)) message = "Choose a vehicle with room for your passengers and luggage.";
    if (step === 2 && (!ride.name.trim() || ride.phone.replace(/\D/g, "").length < 8)) message = "Add your name and a contact number including country code.";
    if (message) {setError(message); requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>(".ride-error")?.focus()); return;}
    if (step < 2) {goTo(step + 1); return;}
    if (submitting) return; setSubmitting(true);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    try {const result = await api<{booking: {reference: string; version: number; status: string}}>(reference && rescheduling ? `/api/bookings/${encodeURIComponent(reference)}` : "/api/bookings", {method: reference && rescheduling ? "PATCH" : "POST", body: JSON.stringify(reference && rescheduling ? {action: "reschedule", version: bookingVersion, ride: {...ride, idempotencyKey: idempotencyKey.current}} : {...ride, idempotencyKey: idempotencyKey.current})}); setReference(result.booking.reference); setBookingVersion(result.booking.version); setBookingStatus(result.booking.status); setStatus("ready"); setRescheduling(false); goTo(3);}
    catch (error) {setError(error instanceof Error ? error.message : "Your request could not be saved. Please try again.");}
    finally {setSubmitting(false);}
  }
  function reset() {idempotencyKey.current = ""; setRide({...emptyRide}); setStatus("draft"); setReference(""); setCancelPrompt(false); setRescheduling(false); setMapTarget(null); goTo(0);}
  async function cancelBooking() {if (submitting) return; setSubmitting(true); try {const result = await api<{booking: {version: number; status: string}}>(`/api/bookings/${encodeURIComponent(reference)}`, {method: "PATCH", body: JSON.stringify({action: "cancel", version: bookingVersion})}); setBookingVersion(result.booking.version); setBookingStatus(result.booking.status); setStatus("cancelled"); setCancelPrompt(false);} catch (error) {setError(error instanceof Error ? error.message : "Unable to cancel this booking.");} finally {setSubmitting(false);}}
  const pickupTime = ride.timing === "now" ? "As soon as possible" : `${ride.date} · ${ride.time} KSA`;

  return <dialog ref={dialog} className="ride-dialog" aria-labelledby="ride-title" onClose={() => setIsOpen(false)} onClick={event => {if (event.target === event.currentTarget) close();}} onCancel={event => {event.preventDefault(); if (mapTarget) closeMap(); else close();}}>
    <div className="ride-shell">
      <div className="ride-top" inert={mapTarget ? true : undefined}><span className="ride-wordmark">falak<span>rides</span><i/></span><span><Icon name="shield" size={15}/> Your own private ride</span><button type="button" className="ride-icon-button" onClick={close} aria-label="Close booking popup">×</button></div>
      <div className="ride-layout" inert={mapTarget ? true : undefined}>
        <div className="ride-main">
          {step < 3 ? <>
            <div className="ride-intro"><span className="ride-eyebrow">LET’S GET YOU THERE</span><h2 id="ride-title" ref={heading} tabIndex={-1}>{rescheduling ? "A change of plans?" : ["Where are we going?", "Make room for everyone.", "One last look."][step]}</h2><p>{["Start with your pickup and destination. Next, choose your vehicle and review your ride.", "Choose the right fit for you, your family, and everything you’re bringing.", "Check your journey and add the details your driver should know."][step]}</p></div>
            <ol className="ride-progress" aria-label="Booking steps">{["Your journey", "Your vehicle", "Review & confirm"].map((label, index) => <li key={label} data-active={step === index} data-complete={step > index} aria-current={step === index ? "step" : undefined}><span>{step > index ? "✓" : index + 1}</span>{label}</li>)}</ol>
            <form className="ride-form" onSubmit={next}>
              <div className="ride-form-content">
              {step === 0 && <>
                <div className="ride-segments" aria-label="Pickup timing">{(["now", "later"] as const).map(value => <button key={value} type="button" aria-pressed={ride.timing === value} className={ride.timing === value ? "active" : ""} onClick={() => update("timing", value)}><Icon name={value === "now" ? "car" : "clock"} size={18}/>{value === "now" ? "Ride now" : "Schedule for later"}</button>)}</div>
                <div className="ride-route-fields">
                  {(["pickup", "destination"] as const).map((key, index) => <div className="ride-location" key={key}><span className={`ride-route-dot ${index ? "dropoff" : ""}`}/><label><span>{index ? "Drop-off location" : "Pickup location"}</span><input data-ride-location={key} required list={locationList} value={ride[key]} maxLength={160} placeholder={index ? "Where would you like to go?" : "Address, airport, hotel or landmark"} onChange={event => update(key, event.target.value)}/></label><button type="button" className="ride-map-button" aria-label={`Choose ${index ? "drop-off" : "pickup"} on map`} onClick={event => {mapTrigger.current = event.currentTarget; setMapTarget(key);}}><Icon name="pin" size={18}/><span>Map</span></button></div>)}
                </div>
                <div className="ride-route-tools"><span>Search by name, address or landmark</span><button type="button" disabled={!ride.pickup && !ride.destination} onClick={() => setRide(current => ({...current, pickup: current.destination, destination: current.pickup}))} aria-label="Swap pickup and drop-off"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 4v16m-4-4 4 4 4-4M16 20V4m-4 4 4-4 4 4"/></svg>Swap</button></div>
                {!ride.pickup && !ride.destination && <div className="ride-popular"><span>Or start with a popular journey</span><div>{routes.slice(0, 3).map(([from, to]) => <button type="button" key={from + to} onClick={() => {setRide(current => ({...current, pickup: from, destination: to})); setError("");}}>{from}<Icon size={12}/>{to}</button>)}</div></div>}
                <datalist id={locationList}>{locations.map(location => <option key={location} value={location}/>)}</datalist>
                {ride.stops.map((stop, index) => <div className="ride-stop" key={index}><span>{index + 1}</span><label><span>Stop {index + 1}</span><input required list={locationList} placeholder="Add an address or landmark" maxLength={160} value={stop} onChange={event => update("stops", ride.stops.map((value, position) => position === index ? event.target.value : value))}/></label><button type="button" className="ride-icon-button" aria-label={`Remove stop ${index + 1}`} onClick={() => update("stops", ride.stops.filter((_, position) => index !== position))}>×</button></div>)}
                <button className="ride-add-stop" type="button" disabled={ride.stops.length >= 5} onClick={() => update("stops", [...ride.stops, ""])}>＋ Add a stop <small>{ride.stops.length}/5</small></button>
                <div className="ride-divider"/>
                <div className="ride-form-title">Journey type</div><div className="ride-journey-options">{(["one-way", "round-trip"] as const).map(value => <button key={value} type="button" className={ride.journey === value ? "selected" : ""} aria-pressed={ride.journey === value} onClick={() => update("journey", value)}><span className="ride-radio"/><span><strong>{value === "one-way" ? "One way" : "Round trip"}</strong><small>{value === "one-way" ? "A ride to your destination" : "And a ride back, too"}</small></span><span aria-hidden="true">{value === "one-way" ? "↗" : "⇄"}</span></button>)}</div>
                {ride.timing === "later" && <div className="ride-fields"><label>Pickup date<input required type="date" min={today} value={ride.date} onChange={event => update("date", event.target.value)}/></label><label>Pickup time <small>(KSA)</small><input required type="time" value={ride.time} onChange={event => update("time", event.target.value)}/></label></div>}
                {ride.journey === "round-trip" && <div className="ride-fields"><label>Return date<input required type="date" min={ride.timing === "later" && ride.date ? ride.date : today} value={ride.returnDate} onChange={event => update("returnDate", event.target.value)}/></label><label>Return time <small>(KSA)</small><input required type="time" value={ride.returnTime} onChange={event => update("returnTime", event.target.value)}/></label></div>}
                <div className="ride-private-note"><Icon name="shield" size={19}/><span><strong>Just you and your people.</strong> Every booking is a private ride. No shared pickups.</span></div>
              </>}
              {step === 1 && <>
                <div className="ride-counts">{(["passengers", "luggage"] as const).map(key => <div className="ride-counter" key={key}><Icon name={key === "passengers" ? "user" : "bag"} size={22}/><div><strong>{key === "passengers" ? "Passengers" : "Luggage"}</strong><small>{key === "passengers" ? "Including children" : "Suitcases & travel bags"}</small></div><button type="button" disabled={ride[key] <= (key === "passengers" ? 1 : 0)} aria-label={`Fewer ${key}`} onClick={() => update(key, ride[key] - 1)}>−</button><output aria-label={`${key} quantity`} aria-live="polite">{ride[key]}</output><button type="button" disabled={ride[key] >= (key === "passengers" ? 16 : 30)} aria-label={`More ${key}`} onClick={() => update(key, ride[key] + 1)}>+</button></div>)}</div>
                <div className="ride-vehicle-heading"><div className="ride-form-title">Choose your vehicle</div><span>{eligibleVehicles.length} suitable options</span></div>
                <div className="ride-vehicles">{vehicles.map(item => {const fits = item.passengers >= ride.passengers && item.bags >= ride.luggage; return <button key={item.name} type="button" disabled={!fits} aria-pressed={ride.vehicle === item.name} className={`ride-vehicle ${ride.vehicle === item.name ? "selected" : ""}`} onClick={() => update("vehicle", item.name)}><div className="ride-vehicle-art"><Icon name="car" size={48}/><span>{item.category}</span></div><div><strong>{item.name}</strong><p>{item.description}</p><span className="ride-capacity"><span><Icon name="user" size={14}/> {item.passengers} passengers</span><span><Icon name="bag" size={14}/> {item.bags} bags</span></span>{!fits && <small className="ride-doesnt-fit">More space needed for this trip</small>}</div><span className="ride-radio"/></button>;})}</div>
                {!eligibleVehicles.length && <p className="ride-private-note">Your group needs a larger vehicle. Reduce the quantities or contact our team to arrange suitable transport.</p>}
              </>}
              {step === 2 && <>
                <div className="ride-review-route"><div className="ride-section-label">YOUR JOURNEY<button type="button" onClick={() => goTo(0)}>Edit</button></div><strong>{ride.pickup} <span>→</span> {ride.destination}</strong>{ride.stops.length > 0 && <p>Via {ride.stops.join(" → ")}</p>}<p>{pickupTime} · {ride.journey === "one-way" ? "One way" : "Round trip"}</p>{ride.journey === "round-trip" && <p>Return: {ride.returnDate} · {ride.returnTime} KSA</p>}<div className="ride-review-chips"><span>{ride.vehicle}</span><span>{ride.passengers} passengers</span><span>{ride.luggage} bags</span><button type="button" onClick={() => goTo(1)}>Edit vehicle</button></div></div>
                <div className="ride-fields"><label>Your name<input required autoComplete="name" maxLength={80} value={ride.name} placeholder="Full name" onChange={event => update("name", event.target.value)}/></label><label>Phone number<input required type="tel" autoComplete="tel" maxLength={25} value={ride.phone} placeholder="+966 5X XXX XXXX" onChange={event => update("phone", event.target.value)}/></label></div>
                <label className="ride-notes">Instructions for your driver <small>Optional</small><textarea rows={3} maxLength={600} value={ride.notes} placeholder="Flight number, child seat, meeting point, or anything else we should know…" onChange={event => update("notes", event.target.value)}/><small>{ride.notes.length}/600</small></label>
                <div className="ride-mobile-fare"><span>Estimated fare</span><strong>{estimatedFare === null ? "Quote required ? SAR" : `SAR ${estimatedFare.toFixed(2)}`}</strong><small>Pricing will be available before a live booking is confirmed.</small></div>
                <div className="ride-preview-notice"><Icon name="shield" size={18}/><p>Your request is saved for review. The team confirms availability and the final fare.</p></div>
              </>}
              {error && <p className="ride-error" role="alert" tabIndex={-1}>{error}</p>}
              </div>
              <div className="ride-footer"><div className="ride-next-hint"><strong>{step === 0 ? "Next: choose your vehicle" : step === 1 ? "Next: review your journey" : "Your booking request"}</strong><span>{step === 0 ? "Add your pickup and destination to continue." : step === 1 ? "Select a vehicle with enough room for everyone." : "Check your details before confirming."}</span></div><div className="ride-footer-actions"><button type="button" className="ride-back" onClick={() => step ? goTo(step - 1) : close()}>{step ? "← Back" : "Maybe later"}</button><button type="submit" disabled={submitting} className="ride-primary">{step === 0 ? "Continue to vehicles" : step === 1 ? "Review journey" : rescheduling ? "Update booking request" : "Request booking"}<Icon size={18}/></button></div></div>
            </form>
          </> : <div className="ride-success">{error && <p className="ride-error" role="alert">{error}</p>}
            <div className={`ride-success-icon ${status === "cancelled" ? "cancelled" : ""}`}>{status === "cancelled" ? "×" : <Icon name="check" size={32}/>}</div>
            <span className="ride-eyebrow">{status === "cancelled" ? "PLANS CHANGE. WE UNDERSTAND." : "YOUR JOURNEY, ALL TOGETHER"}</span><h2 id="ride-title" ref={heading} tabIndex={-1}>{status === "cancelled" ? "Booking cancelled." : "You’re ready for the road."}</h2><p>{status === "cancelled" ? "This booking has been cancelled. Start fresh whenever you’re ready." : "Your request has been received. The team will confirm availability and the final fare."}</p>
            <div className="ride-reference"><span>BOOKING REFERENCE</span><strong>{reference}</strong><small>Your request is awaiting confirmation</small></div>
            <div className="ride-success-details"><div><span>Journey</span><strong>{ride.pickup} → {ride.destination}</strong></div><div><span>Pickup</span><strong>{pickupTime}</strong></div>{ride.journey === "round-trip" && <div><span>Return</span><strong>{ride.returnDate} · {ride.returnTime} KSA</strong></div>}<div><span>Your ride</span><strong>{ride.vehicle} · {ride.passengers} passengers</strong></div><div><span>Status</span><strong className="ride-status">{status === "cancelled" ? "Cancelled" : bookingStatus}</strong></div></div>
            {status !== "cancelled" && <div className="ride-management"><button type="button" onClick={() => {setRescheduling(true); update("timing", "later"); goTo(0);}}> <Icon name="clock" size={17}/> Reschedule</button><button type="button" onClick={() => setCancelPrompt(true)}>Cancel booking</button></div>}
            {cancelPrompt && status !== "cancelled" && <div className="ride-cancel-prompt" role="alert"><strong>Cancel this booking?</strong><p>You can create a new one at any time.</p><button type="button" onClick={cancelBooking}>Yes, cancel booking</button><button type="button" onClick={() => setCancelPrompt(false)}>Keep it</button></div>}
            <button type="button" className="ride-primary" onClick={reset}>Plan another ride<Icon size={18}/></button><button type="button" className="ride-back" onClick={close}>Close</button>
          </div>}
        </div>
        <aside className="ride-summary"><div className="ride-summary-map"><MapPreview/><span className="ride-map-label"><i/> {ride.pickup && ride.destination ? "Your journey" : "SAUDI ARABIA"}</span><small>Illustrative map preview</small></div><div className="ride-summary-body"><span className="ride-eyebrow">A LITTLE PEACE OF MIND</span><h3>Your journey at a glance.</h3><div className="ride-summary-route"><div><i/><span><small>PICKUP</small><strong>{ride.pickup || "Your starting point"}</strong></span></div>{ride.stops.map((stop, index) => <div key={index}><i/><span><small>STOP {index + 1}</small><strong>{stop || "Add a stop"}</strong></span></div>)}<div><i/><span><small>DROP-OFF</small><strong>{ride.destination || "Somewhere worth going"}</strong></span></div></div><dl><div><dt>When</dt><dd>{pickupTime}</dd></div><div><dt>Journey</dt><dd>{ride.journey === "one-way" ? "One way" : "Round trip"}</dd></div><div><dt>Vehicle</dt><dd>{ride.vehicle || "Choose your comfort"}</dd></div></dl><div className="ride-fare"><span>Estimated fare <small>For your private journey</small></span><strong>{estimatedFare === null ? "—" : estimatedFare.toFixed(2)} <small>SAR</small></strong></div><p className="ride-fare-note">{estimatedFare === null ? "Quote required. Your estimated fare will appear here when pricing is available." : "Published route fare. The team confirms your final fare and any additional charges."}</p><div className="ride-summary-benefits"><span><Icon name="shield" size={16}/> Private rides, always</span><span><Icon name="bag" size={16}/> Space for your journey</span><span><Icon name="chat" size={16}/> A team ready to help</span></div></div></aside>
      </div>
      {mapTarget && <div className="ride-map-overlay"><section className="ride-map-picker" role="region" aria-label={`Choose ${mapTarget} map preview`}><div className="ride-map-picker-head"><div><span className="ride-eyebrow">FIND YOUR MEETING POINT</span><h3>Choose your {mapTarget === "pickup" ? "pickup" : "drop-off"}.</h3></div><button autoFocus type="button" className="ride-icon-button" aria-label="Close map preview" onClick={closeMap}>×</button></div><p>Map preview only. Live location selection will be available soon.</p><div className="ride-pickable-map" role="button" tabIndex={0} aria-label="Move preview pin. Use arrow keys or click the illustrative map." onClick={event => {const rect = event.currentTarget.getBoundingClientRect(); setPin({x: Math.max(5, Math.min(95, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(10, Math.min(85, (event.clientY - rect.top) / rect.height * 100))});}} onKeyDown={event => {const directions: Record<string, [number, number]> = {ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3]}; if (directions[event.key]) {event.preventDefault(); const [x, y] = directions[event.key]; setPin(current => ({x: Math.max(5, Math.min(95, current.x + x)), y: Math.max(10, Math.min(85, current.y + y))}));}}}><MapPreview/><span className="ride-preview-pin" style={{left: `${pin.x}%`, top: `${pin.y}%`}}><Icon name="pin" size={29}/></span><span className="ride-map-preview-tag">ILLUSTRATIVE MAP · NOT A REAL LOCATION</span></div><label className="ride-map-address">{mapTarget === "pickup" ? "Pickup" : "Drop-off"} address<input autoComplete="off" maxLength={160} placeholder="Enter your address or landmark" value={ride[mapTarget]} onChange={event => update(mapTarget, event.target.value)}/></label><button className="ride-primary" type="button" disabled={!ride[mapTarget].trim()} onClick={closeMap}>Use this address<Icon name="check" size={18}/></button></section></div>}
    </div>
  </dialog>;
}

function MapPreview() {
  return <svg className="ride-map-art" viewBox="0 0 500 300" fill="none" aria-hidden="true"><rect width="500" height="300" fill="#eaf0e7"/><path d="M0 0h105l27 55-38 51 9 86-39 108H0Z" fill="#d4e5e5"/><path d="m163 0 18 56 93-9 23-47m-99 110 72-15 40 50-38 51-83-13Zm150 110 77-13 75 43v50H335ZM103 240l62-26 39 86H86Z" fill="#dae6d4"/><g stroke="#fff" strokeWidth="15"><path d="m95-20 50 95 98 56 70 94 79 95M230-20l-28 90 20 74-71 81-20 95M510 58l-128 41-80 6-97 64-90 3-62 35M299-10l43 100-26 94 41 116M500 224l-143-40-135-40-95-25"/></g><g stroke="#d8dfd1" strokeWidth="1.5"><path d="m95-20 50 95 98 56 70 94 79 95M230-20l-28 90 20 74-71 81-20 95M510 58l-128 41-80 6-97 64-90 3-62 35M299-10l43 100-26 94 41 116M500 224l-143-40-135-40-95-25"/></g><path d="m150 79 92 54 71 92 46-41" stroke="#428664" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 7"/><circle cx="150" cy="79" r="12" fill="#fff"/><circle cx="150" cy="79" r="6" fill="#237348"/><circle cx="359" cy="184" r="12" fill="#237348"/><circle cx="359" cy="184" r="4" fill="#fff"/></svg>;
}
