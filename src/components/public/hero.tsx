"use client";
import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {useWebsite} from "@/features/content/public-content";
import Icon from "@/components/ui/icon";
import WebsiteMessage from "./website-message";
import {photo} from "@/utils/images";
export default function PublicHero() {
  const {slides:allSlides,copy:c}=useWebsite();
  const [messageOpen, setMessageOpen] = useState(false);
  const slides=allSlides.filter(slide=>slide.visible);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (hovered || focused || messageOpen || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setActive(current => (current + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [hovered, focused, messageOpen, slides.length]);
  if (!slides.length) return null;
  const currentIndex=Math.min(active,slides.length-1);
  return <><section className="taxi-hero" aria-label="Falak Rides services" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);}}>
    {slides.map((slide,index) => <div key={slide.id} className="taxi-slide" data-active={currentIndex === index} aria-hidden={currentIndex !== index}>{slide.image && <Image src={photo(slide.image)} alt="" fill preload={index === 0} loading={index === 0 ? undefined : "eager"} sizes="100vw"/>}<div className="taxi-slide-shade"/><div className="taxi-slide-copy">{index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}<p>{slide.text}</p><div className="taxi-hero-actions"><Link className="taxi-button" href="/book-a-ride" tabIndex={currentIndex === index ? 0 : -1}>{c.bookNow}</Link><button type="button" className="taxi-button taxi-hero-message" aria-haspopup="dialog" onClick={() => setMessageOpen(true)} tabIndex={currentIndex === index ? 0 : -1}><Icon name="mail" size={20}/>Message</button></div></div></div>)}
  </section><WebsiteMessage open={messageOpen} onClose={() => setMessageOpen(false)}/></>;
}
