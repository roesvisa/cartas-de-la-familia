import { ResourceImage } from './ResourceImage';
import { useState, type CSSProperties } from 'react';
import type { Card } from '../domain/models';
import { useCardMotion } from './useCardMotion';
import { cardMotion, visualRarity } from './cardVisualConfig';
import { RarityEffects } from './RarityEffects';
import s from './PhysicalCard.module.css';
export function PhysicalCard({card, compact=false, quantity=1, onOpen}: {card:Card;compact?:boolean;quantity?:number;onOpen?:()=>void}) {
  const motion=useCardMotion({ allowScroll: compact });
  const [failed,setFailed]=useState(false);
  return <button type="button" ref={motion.ref} className={`${s.scene} ${compact?s.compact:s.detail}`} data-rear={motion.rear}
    style={{'--flip-duration':`${cardMotion.flipMs}ms`,'--return-duration':`${cardMotion.returnMs}ms`} as CSSProperties}
    aria-label={`${card.title}, ${card.category}, ${quantity} copias, ${motion.rear?'fotografía':'ilustración'}`}
    aria-keyshortcuts="ArrowLeft ArrowRight Space" {...motion.handlers}
    onClick={e=>{if (!motion.moved.current || e.detail===0) onOpen?.();}}
    onContextMenu={e=>e.preventDefault()} onDragStart={e=>e.preventDefault()}>
    <span className={s.tilt}><span className={s.flip}>
      <span className={`${s.face} ${s.illustrated}`} data-rarity={visualRarity(card.category)} aria-hidden={motion.rear}>
        <ResourceImage src={card.imageUrl} alt={`${card.title}, dibujo`} draggable={false}/>
        <RarityEffects category={card.category}/>
        {compact && quantity>1 && <small className={s.copies}>x{quantity}</small>}
      </span>
      <span className={`${s.face} ${s.realistic}`} aria-hidden={!motion.rear}>
        {card.realisticImageUrl&&!failed ? <ResourceImage fallback="Fotografía aún no disponible" src={card.realisticImageUrl} alt={`${card.title}, fotografía`} draggable={false} loading="lazy" style={{objectPosition:card.realisticImagePosition??'center'}} onError={()=>setFailed(true)}/> : <span className={s.missing}>Fotografía aún no disponible</span>}
      </span>
    </span></span>
  </button>;
}
