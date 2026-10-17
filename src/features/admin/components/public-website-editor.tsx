"use client";
import ContentImageField from "./content-image-field";
import {WEBSITE_FIELD, websiteCopyFields, websiteFromValues} from "@/features/content/website-model";
import type {ContentSection} from "@/features/content/page-navigation";
import type {ContentValues} from "@/features/content/types";
import "./public-website-editor.css";

export default function PublicWebsiteEditor({values,onChange,disabled,section,query}: {values:ContentValues;onChange:(values:ContentValues)=>void;disabled:boolean;section:ContentSection;query:string}) {
  const data=websiteFromValues(values,true);
  const matches=(text:string)=>text.toLowerCase().includes(query.toLowerCase());
  function copy(key:string,value:string){onChange({...values,[WEBSITE_FIELD]:JSON.stringify({...data,copy:{...data.copy,[key]:value}})});}
  function row(id:string,key:string,value:string){const collection=section.collection;if(collection)onChange({...values,[WEBSITE_FIELD]:JSON.stringify({...data,[collection]:data[collection].map(item=>item.id===id?{...item,[key]:value}:item)})});}
  const fields=websiteCopyFields.filter(field=>section.copy.includes(field.key)&&matches(`${field.label} ${data.copy[field.key]}`));
  const rows=section.collection?data[section.collection].filter(item=>matches(JSON.stringify(item))):[];
  return <div className="website-manager">
    <div className="website-copy-grid">{fields.map(field=><label key={field.key}>{field.label}{field.image?<ContentImageField value={data.copy[field.key]} disabled={disabled} onChange={value=>copy(field.key,value)}/>:<textarea rows={field.value.length>90?4:2} maxLength={6000} value={data.copy[field.key]} onChange={event=>copy(field.key,event.target.value)}/>}</label>)}</div>
    <div className="website-records">{rows.map((item,index)=><article className="website-record" key={item.id}><div className="website-record-heading"><span className="website-item-index">{index+1}</span><h3>{"title" in item?item.title:item.question}</h3></div><div className="website-record-fields cms-scoped-record">{Object.entries(item).filter(([key])=>!["id","visible"].includes(key)).map(([key,value])=><label key={key}>{{title:"Heading",text:"Description",image:"Image",question:"Question",answer:"Answer"}[key]||key}{key==="image"?<ContentImageField value={String(value)} disabled={disabled} onChange={value=>row(item.id,key,value)}/>:<textarea rows={key==="title"||key==="question"?2:4} maxLength={6000} value={String(value)} onChange={event=>row(item.id,key,event.target.value)}/>}</label>)}</div></article>)}</div>
    {!fields.length&&!rows.length&&<p className="website-manager-note">No matching content in this section.</p>}
  </div>;
}
