# Imágenes en Supabase

Buckets públicos: `avatars` y `cards`. Admiten WebP, JPEG y PNG. No se otorgaron permisos de subida a visitantes: cargar desde el Dashboard con la cuenta administradora.

## Cargar y asociar
En Storage, seleccionar bucket y crear la carpeta indicada (las carpetas son prefijos, no tablas):
- avatars: `users/<UUID real del perfil>.webp`
- cards: `illustrated/moment-1.webp` y `realistic/moment-1.webp`, hasta moment-30.

En Table Editor localizar el registro por ID, comprobar nombre y número y guardar:
- profiles.avatar_url: `avatars/users/<UUID>.webp`
- cards.image_url: `cards/illustrated/moment-1.webp`
- cards.realistic_image_url: `cards/realistic/moment-1.webp`

Subir primero, asociar después. No es necesario modificar GitHub. Se admite extensión jpg/png si coincide exactamente con el archivo subido. Recargar la app para recuperar los valores. Al reemplazar un archivo, considerar caché del navegador/CDN; para actualización inmediata usar nombre versionado y actualizar la ruta. No guardar URLs firmadas temporales.

Perfil sin foto: iniciales. Ilustración ausente: “Imagen aún no disponible”. Realista ausente: “Fotografía aún no disponible”. Las rutas antiguas siguen funcionando. No se ha modificado collection_snapshot ni open_pack: ya devuelven las columnas de imágenes.

## Privacidad (propuesta, no ejecutada)
Un bucket público permite descargar sus archivos a quien conozca la URL, aunque la app requiera login. Para una fase posterior: buckets privados, políticas SELECT para miembros autorizados, resolver URLs firmadas con caducidad y renovarlas en sesión. No incluir service_role en frontend.

## Recuperación
Respaldo local fuera del repositorio: ../image-migration-backup. El bundle antes de la migración contiene el historial completo. `git clone before-cleanup.bundle recuperado` restaura código y recursos. `tar -xzf assets-before-cleanup.tar.gz -C destino` restaura recursos sin tocar producción. Se extrajo y comparó con los originales mediante diff. database-routes.json contiene la respuesta SQL con IDs y rutas anteriores; restaurar únicamente columnas de imágenes por ID, nunca sobrescribir usuarios/inventarios. storage/ conserva los objetos descargados: restaurarlos por Dashboard en el mismo bucket y nombre.

No se autoriza ninguna eliminación con este documento. La lista privada exacta se encuentra en el respaldo local, junto a sus referencias de base de datos. Los archivos de dependencias desconocidas quedan excluidos.
