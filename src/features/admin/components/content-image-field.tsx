"use client";
import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {photo} from "@/utils/images";
import {isSafePublicImage} from "@/features/content/website-model";
import {MAX_CONTENT_IMAGE_BYTES} from "@/features/content/image-upload";

export default function ContentImageField({value,onChange,disabled=false,id}:{value:string;onChange:(value:string)=>void;disabled?:boolean;id?:string}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const latestChange = useRef(onChange);
  useEffect(()=>{latestChange.current=onChange;},[onChange]);
  async function upload(file?:File) {
    if (!file || busy || disabled) return;
    if (file.size > MAX_CONTENT_IMAGE_BYTES) {setError("Choose an image smaller than 8 MB.");return;}
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/content/images",{method:"POST",headers:{"Content-Type":file.type},body:file});
      const result=await response.json();if(!response.ok)throw Error(result.error || "Image upload failed.");
      latestChange.current(result.url);
    } catch(error) {setError(error instanceof Error?error.message:"Unable to upload image.");}
    finally {setBusy(false);if(input.current)input.current.value="";}
  }
  return <span className="content-image-field">
    <input id={id} aria-label="Image URL" value={value} maxLength={2000} disabled={disabled||busy} onChange={event=>onChange(event.target.value)}/>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={disabled||busy} onChange={event=>{void upload(event.target.files?.[0]);}} aria-label="Upload image to Cloudinary"/>
    {busy&&<span role="status">Uploading image…</span>}{error&&<span role="alert">{error}</span>}
    <small>Upload to Cloudinary or use an image URL. Save draft to store your selection; publish to show it on the website.</small>
    {isSafePublicImage(value)&&<Image src={photo(value,480)} alt="Selected website image" width={360} height={180} style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/>}
  </span>;
}
