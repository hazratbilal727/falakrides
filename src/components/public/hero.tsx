"use client";
import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {useWebsite} from "@/features/content/public-content";
import {photo} from "@/utils/images";
export default function PublicHero() {
  const {slides:allSlides,copy:c}=useWebsite();
  const slides=allSlides.filter(slide=>slide.visible);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setActive(current => (current + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [paused, slides.length]);
  if (!slides.length) return null;
  const currentIndex=Math.min(active,slides.length-1);
  return <section className="taxi-hero" aria-label="Falak Rides services" aria-roledescription="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)}>
    {slides.map((slide,index) => <div key={slide.id} className="taxi-slide" data-active={currentIndex === index} aria-hidden={currentIndex !== index}><Image src={photo(slide.image)} alt="" fill priority={index === 0} sizes="100vw"/><div className="taxi-slide-shade"/><div className="taxi-slide-copy">{index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}<p>{slide.text}</p><Link className="taxi-button" href="/book-a-ride" tabIndex={currentIndex === index ? 0 : -1}>{c.bookNow}</Link></div></div>)}
    <div className="taxi-slider-controls">{slides.map((slide,index)=><button type="button" key={slide.id} className="taxi-slide-dot" aria-label={`Show slide ${index + 1}`} aria-pressed={currentIndex === index} onClick={() => {setPaused(true);setActive(index);}}/>)}</div>
  </section>;
}
