const storageBase = 'https://bkkyustjpclrssqrkrck.supabase.co/storage/v1/object/public/';
/** Store bucket/key paths, never signed URLs. Legacy assets remain supported. */
export function resolveImageUrl(value?: string | null): string | undefined {
 const path=value?.trim();if (!path) return undefined;
 if (/^(avatars\/users\/|cards\/(illustrated|realistic)\/)/.test(path)) return storageBase+path.split('/').map(encodeURIComponent).join('/');
 if (/^https?:\/\//.test(path)||path.startsWith('./')||path.startsWith('/')) return path;
 return undefined;
}
