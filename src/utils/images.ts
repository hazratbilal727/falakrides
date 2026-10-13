export const photo = (id:string,w=900) => id.startsWith("/") ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
