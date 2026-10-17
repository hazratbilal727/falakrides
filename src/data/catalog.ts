export const locations = ["Jeddah Airport (JED)", "Makkah", "Madinah", "Madinah Airport (MED)", "Jeddah", "Hotel / other location"];
export const vehicles = [
 {name:"Economy sedan", category:"Economy", image:"photo-1552519507-da3b142c6e3d", description:"A simple, comfortable choice for everyday journeys.", passengers:3, bags:2},
 {name:"Premium sedan", category:"Premium", image:"photo-1618843479313-40f8afb4b4d8", description:"A little more comfort, from arrival to destination.", passengers:3, bags:2},
 {name:"Family SUV", category:"Family", image:"photo-1519641471654-76ce0107ad1b", description:"Room to settle in and enjoy the journey together.", passengers:6, bags:4},
 {name:"Group minibus", category:"Groups", image:"photo-1570125909232-eb263c188f7e", description:"Keep your group together, every step of the way.", passengers:12, bags:8},
];
export const promotions: {id:string;title:string;route:string;discountPercent:number;validUntil:string;terms:string;active:boolean}[] = [];
export const reviews: {id:string;name:string;rating:number;text:string;verified:boolean}[] = [];
export const routes = [["Jeddah Airport", "Makkah", "Airport to the holy city", "photo-1565552645632-d725f8bfc19a"], ["Makkah", "Madinah", "A journey between the holy cities", "photo-1591604129939-f1efa4d9f7fa"], ["Madinah", "Makkah", "Travel at your own pace", "photo-1548013146-72479768bada"]];
