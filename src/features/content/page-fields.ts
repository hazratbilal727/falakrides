import type {ContentField} from "./types";

export const pageServices = [
  ["City rides", "Hotel pickups and local journeys in Makkah, Madinah and Jeddah.", "photo-1449965408869-eaa3f722e40d"],
  ["Airport transfers", "Travel to or from Jeddah and Madinah airports. Share your flight number and meeting point.", "photo-1436491865332-7a61a109cc05"],
  ["Intercity travel", "Travel between supported cities on your preferred schedule.", "photo-1500534623283-312aade485b7"],
  ["Umrah", "Coordinate airport, hotel and holy-city transportation for your pilgrimage.", "photo-1565552645632-d725f8bfc19a"],
  ["Ziyarat", "Share the sites you wish to visit to plan your itinerary and stops.", "photo-1591604129939-f1efa4d9f7fa"],
];
export const aboutLists = {
  values: [
    ["user", "People before plans", "Every journey starts with your needs: who is travelling, what you are bringing and where you want to go."],
    ["chat", "A real conversation", "Speak directly with our team about the details, from your airport meeting point to an extra stop along the way."],
    ["shield", "Clarity at every step", "Confirm your itinerary, vehicle and full fare in SAR before agreeing to travel. Ask about extra charges in advance."],
  ],
  services: [
    ["plane", "Airport transfers", "Plan arrivals and departures at Jeddah and Madinah airports."],
    ["car", "City & intercity rides", "Hotel pickups, local journeys and connections between the cities on your itinerary."],
    ["star", "Umrah transportation", "Coordinate airport, hotel and holy-city transfers around your pilgrimage."],
    ["pin", "Ziyarat journeys", "Discuss the places you wish to visit and arrange a private itinerary with planned stops."],
  ],
  steps: [
    ["Tell us your plans", "Share your pickup, destination, date, passengers and luggage requirements."],
    ["Agree on the details", "Discuss availability, vehicle suitability, the complete fare and cancellation terms."],
    ["Receive your confirmation", "Our team confirms your ride directly. Keep your pickup and contact details handy."],
  ],
  standards: [
    ["A pickup plan", "Agree on the date, local time, exact meeting point and flight details where needed."],
    ["The right vehicle fit", "Confirm passenger capacity, luggage space and any accessibility or child-seat requirements."],
    ["A complete quote", "Agree on the fare in SAR, payment arrangements, waiting time and additional charges."],
    ["Clear change arrangements", "Ask about cancellations, rescheduling and refund terms before accepting your quote."],
  ],
};
export const pageFields: ContentField[] = [
  ...pageServices.flatMap((service, index) => service.map((value, position) => ({id: `page-services.${index}.${position}`, section: "services", label: `Services page: ${service[0]} ${["title", "description", "image"][position]}`, value, ...(position === 2 ? {kind: "image" as const} : {})}))),
  ...Object.entries(aboutLists).flatMap(([group, rows]) => rows.flatMap((row, index) => row.flatMap((value, position) => (row.length === 3 && position === 0) ? [] : [{id: `page-about.${group}.${index}.${position}`, section: "about", label: `About page: ${group} ${index + 1}, ${position === row.length - 1 ? "description" : "title"}`, value}]))),
];
