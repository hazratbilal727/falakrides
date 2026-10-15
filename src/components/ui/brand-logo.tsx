import Image from "next/image";

export default function BrandLogo({size = 42, name = "Falak Rides"}: {size?: number; name?: string}) {
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:10,width:"auto",height:"auto",background:"transparent",borderRadius:0,color:"#173f2a",fontStyle:"normal",lineHeight:1.2,letterSpacing:0,flexShrink:0}}>
    <Image src="/images/falak-ride-logo.png" alt="" width={size} height={size} sizes={`${size}px`} style={{width:size,height:size,objectFit:"contain",flexShrink:0}}/>
    <strong style={{fontSize:22,fontWeight:700,whiteSpace:"nowrap",fontFamily:"Arial, Helvetica, sans-serif"}}>{name}</strong>
  </span>;
}
