import { useState, type ImgHTMLAttributes } from 'react';
import { resolveImageUrl } from '../data/imageUrls';
export function ResourceImage({src, fallback = 'Imagen aún no disponible', ...props}: ImgHTMLAttributes<HTMLImageElement> & {fallback?: string}) {
 const url=resolveImageUrl(src);const [failed,setFailed]=useState<string>();
 return url && failed!==url ? <img {...props} src={url} onError={e=>{setFailed(url);props.onError?.(e);}}/> : <span role="img" aria-label={fallback} style={{display:'grid',placeItems:'center',width:'100%',height:'100%',minHeight:32,padding:8,textAlign:'center',color:'inherit',fontSize:12}}>{fallback}</span>;
}
