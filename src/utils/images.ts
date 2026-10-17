import {isCloudinaryImage} from "@/features/content/image-reference";
export const photo = (id:string,w=900) => id.startsWith("/") || isCloudinaryImage(id) ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
