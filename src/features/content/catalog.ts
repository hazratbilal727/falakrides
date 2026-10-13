import {locations, routes, vehicles} from "@/data/catalog";
import type {ContentValues, PublicCatalog} from "./types";
export function getCatalog(values: ContentValues, catalog?: PublicCatalog) {
  if (catalog) return catalog;
  const text = (id: string, fallback: string) => values[id] ?? fallback;
  return {
    offers: [] as PublicCatalog["offers"], reviews: [] as PublicCatalog["reviews"],
    locations: locations.map((value, index) => text(`location.${index}`, value)),
    routes: routes.map((route, index) => route.map((value, position) => text(`route.${index}.${position}`, value))),
    vehicles: vehicles.map((vehicle, index) => ({...vehicle, name: text(`vehicle.${index}.name`, vehicle.name), description: text(`vehicle.${index}.description`, vehicle.description), image: text(`vehicle.${index}.image`, vehicle.image), passengers: Number(text(`vehicle.${index}.passengers`, String(vehicle.passengers))), bags: Number(text(`vehicle.${index}.bags`, String(vehicle.bags)))})),
  };
}
