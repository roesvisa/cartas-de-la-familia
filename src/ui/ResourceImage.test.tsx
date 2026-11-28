// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it} from 'vitest';
import {ResourceImage} from './ResourceImage';
import {resolveImageUrl} from '../data/imageUrls';
it('resolves exact storage IDs and preserves legacy URLs',()=>{
 expect(resolveImageUrl('cards/illustrated/moment-4.webp')).toBe('https://bkkyustjpclrssqrkrck.supabase.co/storage/v1/object/public/cards/illustrated/moment-4.webp');
 expect(resolveImageUrl('avatars/users/user-id.webp')).toContain('/avatars/users/user-id.webp');
 expect(resolveImageUrl('./cards/optimized/lucia.jpg')).toBe('./cards/optimized/lucia.jpg');
 expect(resolveImageUrl(null)).toBeUndefined();expect(resolveImageUrl('javascript:alert(1)')).toBeUndefined();
});
it('renders no image request when absent, handles failures and retries a new resource',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');const root=createRoot(host);
 act(()=>root.render(<ResourceImage src={undefined}/>));expect(host.querySelector('img')).toBeNull();expect(host.textContent).toContain('Imagen aún no disponible');
 act(()=>root.render(<ResourceImage src="cards/illustrated/moment-4.webp"/>));expect(host.querySelector('img')!.src).toContain('/cards/illustrated/moment-4.webp');
 act(()=>host.querySelector('img')!.dispatchEvent(new Event('error')));expect(host.querySelector('img')).toBeNull();
 act(()=>root.render(<ResourceImage src="cards/realistic/moment-4.webp"/>));expect(host.querySelector('img')).not.toBeNull();
 act(()=>root.unmount());
});
