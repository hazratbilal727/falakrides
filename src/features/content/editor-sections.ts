import {contentFields} from "./fields";

const groups = [
  {id: "homepage", label: "Homepage & navigation", sections: ["home", "main", "Navigation", "SEO"]},
  {id: "transportation", label: "Services & Umrah", sections: ["services", "umrah"]},
  {id: "vehicles", label: "Fleet & vehicles", sections: ["fleet", "Vehicles"]},
  {id: "destinations", label: "Routes & destinations", sections: ["routes", "Popular routes"]},
  {id: "offers", label: "Offers & packages", sections: ["offers"]},
  {id: "bookings", label: "Bookings & inquiries", sections: ["booking", "inquiry", "Booking locations"]},
  {id: "company", label: "Company & footer", sections: ["about", "Company details", "footer"]},
  {id: "contact", label: "Contact & WhatsApp", sections: ["contact", "whatsapp-title", "whatsapp-chat", "whatsapp-description", "whatsapp"]},
  {id: "help", label: "Help & policies", sections: ["faq", "privacy", "terms"]},
];
const available = new Set(contentFields.map(field => field.section));
const assigned = new Set(groups.flatMap(group => group.sections));

// Future sections remain visible even before they have an assigned group.
export const editorSections = [
  ...groups.map(group => ({...group, sections: group.sections.filter(section => available.has(section))})).filter(group => group.sections.length),
  ...Array.from(available).filter(section => !assigned.has(section)).map(section => ({id: `section:${section}`, label: section, sections: [section]})),
];
export const sectionContains = (group: string, section: string) => group === "all" || !!editorSections.find(item => item.id === group)?.sections.includes(section);
export const editorSectionName = (group: string) => editorSections.find(item => item.id === group)?.label || group;
