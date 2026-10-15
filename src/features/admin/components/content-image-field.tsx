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
    <input hidden ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={disabled||busy} onChange={event=>{void upload(event.target.files?.[0]);}} aria-label="Upload image to Cloudinary"/>
    <span className="content-image-upload-row"><button type="button" className="content-image-upload-button" disabled={disabled||busy} onClick={()=>input.current?.click()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/></svg>{busy ? "Uploading..." : "Choose file"}</button><small>JPG, PNG, WebP, GIF or AVIF ? Up to 8 MB</small></span>
    {busy&&<span role="status">Uploading image…</span>}{error&&<span role="alert">{error}</span>}
    <small>Upload to Cloudinary or use an image URL. Save draft to store your selection; publish to show it on the website.</small>
    {value ? <span className="content-image-preview">{isSafePublicImage(value)&&<Image src={photo(value,480)} alt="Selected website image" width={360} height={180} style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/>}<button type="button" className="content-image-remove" aria-label="Remove image" title="Remove image" disabled={disabled||busy} onClick={()=>{setError("");onChange("");if(input.current)input.current.value="";}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></span> : <small>No image selected.</small>}
  </span>;
}
