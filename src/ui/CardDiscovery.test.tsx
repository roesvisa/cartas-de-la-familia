// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { PhysicalCard } from './PhysicalCard';
import { createFixture } from '../data/fixtures';
import { cardMotion, gestureAngles, visualRarity } from './cardVisualConfig';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{
 vi.useFakeTimers();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>setTimeout(()=>cb(0),16));vi.stubGlobal('cancelAnimationFrame',clearTimeout);
 HTMLElement.prototype.setPointerCapture=vi.fn();
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
 render('Común');
 vi.spyOn(host.querySelector('button')!,'getBoundingClientRect').mockReturnValue({width:300} as DOMRect);
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
function render(category:string,missing=false){act(()=>root.render(<PhysicalCard card={{...createFixture().cards[0],category,realisticImageUrl:missing?undefined:createFixture().cards[0].realisticImageUrl}}/>));}
function pointer(type:string,x=0,y=0){const e=new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0});Object.defineProperties(e,{isPrimary:{value:true},pointerId:{value:1},pointerType:{value:'touch'}});act(()=>host.querySelector('button')!.dispatchEvent(e));act(()=>vi.advanceTimersByTime(16));}
const button=()=>host.querySelector('button')!;
it.each(['Común','Rara','Especial'])('tilts %s and keeps effects on illustrated face only',category=>{
 render(category);pointer('pointerdown');pointer('pointermove',45,15);
 expect(button().style.getPropertyValue('--turn')).toBe('30deg');expect(button().style.getPropertyValue('--tilt')).not.toBe('0deg');
 expect(host.querySelectorAll('[data-rarity]').length).toBe(category==='Común'?1:2);
 expect(host.querySelector('[aria-hidden="true"] [data-rarity]')).toBeNull();
});
it.each([30,80])('returns from %s degrees without changing face',degrees=>{
 pointer('pointerdown');pointer('pointermove',135*degrees/90);pointer('pointerup');
 expect(button().dataset.rear).toBe('false');expect(button().style.getPropertyValue('--turn')).toBe('0deg');
});
it.each([-1,1])('commits at 90 degrees in direction %s and requires a new gesture',direction=>{
 pointer('pointerdown');pointer('pointermove',direction*135);
 expect(button().dataset.rear).toBe('true');expect(button().style.getPropertyValue('--turn')).toBe(`${direction*180}deg`);
 act(()=>vi.advanceTimersByTime(600));pointer('pointermove',direction*600);expect(button().style.getPropertyValue('--turn')).toBe(`${direction*180}deg`);
 pointer('pointerup');pointer('pointerdown');pointer('pointermove',direction*135);
 expect(button().dataset.rear).toBe('false');expect(button().style.getPropertyValue('--turn')).toBe(`${direction*360}deg`);
});
it('reverses from the rear without a 360 degree jump',()=>{
 pointer('pointerdown');pointer('pointermove',135);pointer('pointerup');act(()=>vi.advanceTimersByTime(600));
 pointer('pointerdown');pointer('pointermove',-135);expect(button().style.getPropertyValue('--turn')).toBe('0deg');
});
it('preserves collection scrolling and cancels interrupted gestures',()=>{
 act(()=>root.render(<PhysicalCard card={createFixture().cards[0]} compact/>));
 pointer('pointerdown');pointer('pointermove',5,40);expect(button().dataset.rear).toBe('false');
 expect(HTMLElement.prototype.setPointerCapture).not.toHaveBeenCalled();
 pointer('pointerdown');pointer('pointermove',50,5);pointer('pointercancel');expect(button().style.getPropertyValue('--tilt')).toBe('0deg');expect(button().style.getPropertyValue('--turn')).toBe('0deg');
});
it('shows a neutral missing photo and still flips back',()=>{
 render('Especial',true);pointer('pointerdown');pointer('pointermove',135);
 expect(host.textContent).toContain('Fotografía aún no disponible');expect(button().dataset.rear).toBe('true');
});
it('handles failed photos without a broken image',()=>{
 act(()=>host.querySelectorAll('img')[1].dispatchEvent(new Event('error')));expect(host.querySelectorAll('img')).toHaveLength(1);expect(host.textContent).toContain('Fotografía aún no disponible');
});
it('supports reduced motion and keyboard without a visible flip control',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:true}));
 act(()=>button().dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
 expect(button().dataset.rear).toBe('true');expect(host.querySelectorAll('button')).toHaveLength(1);
});
it('keeps tap navigation but suppresses clicks after a drag',()=>{
 const open=vi.fn();act(()=>root.render(<PhysicalCard card={createFixture().cards[0]} compact onOpen={open}/>));
 pointer('pointerdown');pointer('pointerup');act(()=>button().dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));expect(open).toHaveBeenCalledTimes(1);
 pointer('pointerdown');pointer('pointermove',50);pointer('pointerup');act(()=>button().dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));expect(open).toHaveBeenCalledTimes(1);
});
it('centralizes sensitivity, bounded tilt, and only three rarity mappings',()=>{
 expect(gestureAngles(300*cardMotion.sensitivity,10000,300)).toEqual({y:90,x:-6});
 expect(['Común','Rara','Especial','Única'].map(visualRarity)).toEqual(['common','rare','special','common']);
});

it('tracks vertical touch movement in detail and uses 80% foil while dragging',()=>{
 render('Especial');pointer('pointerdown');pointer('pointermove',5,40);
 expect(button().style.getPropertyValue('--tilt')).not.toBe('0deg');
 expect(button().style.getPropertyValue('--foil-strength')).toBe('0.8');
 expect(HTMLElement.prototype.setPointerCapture).toHaveBeenCalled();
 pointer('pointerup');expect(button().style.getPropertyValue('--foil-strength')).toBe('0.4');
});
