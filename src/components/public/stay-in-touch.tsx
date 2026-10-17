"use client";

import {useWebsite} from "@/features/content/public-content";
import Icon from "@/components/ui/icon";
import TravelInquiry from "./travel-inquiry";
import "./stay-in-touch.css";

export default function StayInTouch() {
  const {copy: c} = useWebsite();
  return <section className="taxi-stay-in-touch" aria-labelledby="stay-in-touch-title">
    <div className="taxi-container taxi-stay-in-touch-layout">
      <div>
        <span className="taxi-eyebrow">{c.footerLabel}</span>
        <h2 id="stay-in-touch-title">{c.footerTitle}</h2>
        <p>{c.footerText}</p>
      </div>
      <div className="taxi-stay-in-touch-form">
        <h3><span className="taxi-stay-in-touch-icon"><Icon name="mail" size={24}/></span>{c.footerInquiryTitle}</h3>
        <p>{c.footerInquiryText}</p>
        <TravelInquiry/>
      </div>
    </div>
  </section>;
}
