# Cartas de la Familia

Demo mobile-first con React, TypeScript, Vite y CSS Modules. Referencia visual: las páginas Navidapp y Design System del archivo Figma `ffDjtT9Tyfp8PEnsrYY6Uf`, más las capturas proporcionadas. Base de 390 × 844 px, adaptable a otros anchos; en escritorio se mantiene una columna de hasta 480 px.

## Ejecutar

Node.js 26.12.1 (versión verificada; disponible en `.nvmrc`) y npm. Desde esta carpeta:

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:5173 (o el puerto impreso por Vite).

La app usa Supabase para el acceso por invitación y el guardado de sobres y cartas. La sesión persiste en este navegador; el inventario se guarda en el servidor y se recupera desde otro dispositivo al iniciar sesión.

Para revisar el diseño con datos ficticios, **solo en desarrollo**, abre `http://127.0.0.1:5173/?demo=normal`. Acceso: `mariel@familia.demo` / `familia123`. Este acceso no funciona en producción ni permite leer datos reales.

## Recorrido

1. Ingresar desde bienvenida y completar el login con una cuenta invitada.
2. Inicio muestra 0/30 cartas y 3 sobres. Colección tiene su estado vacío.
3. Abrir sobres, tocar el sobre y revelar sus tres cartas. Tocar la carta ampliada o pulsar Escape para continuar. El diálogo contiene el foco y lo devuelve a la carta.
4. Ver la colección: el inventario ya contiene las cartas recibidas. Pueden aparecer duplicadas incluso en un mismo sobre; las copias no suman al progreso de únicas.
5. Buscar por nombre o filtrar Comunes, Raras y Especiales. El filtro Todas muestra los 30 espacios; los filtros de rareza muestran cartas obtenidas.
6. Tocar una carta obtenida para ver su detalle. Volver a la colección con la flecha.
7. Ranking muestra miembros de la colección ordenados por cartas únicas. Los usuarios sin cartas no figuran; empates por quien alcanzó antes esa cantidad; los sobres con solo repetidas no cambian la prioridad.
8. Abrir el siguiente sobre hasta agotar los tres. Inicio pasa por 3, 2, 1 y 0 sobres; el botón queda desactivado al agotarlos.

La apertura es de **un sobre y tres cartas** por operación. La reposición entrega un sobre cada 24 horas desde la primera apertura con el inventario lleno. Abrir más sobres no reinicia el ciclo. Se acumulan como máximo tres; al llegar a tres el ciclo se detiene hasta abrir otro. Inicio muestra el tiempo restante confirmado por el servidor, y recupera los sobres acumulados al volver a la aplicación.

## Escenarios reproducibles

Estos escenarios se ejecutan exclusivamente en desarrollo con login simulado:

- `/?demo=normal&packs=0`, `/?demo=normal&packs=1`, `/?demo=normal&packs=2`, `/?demo=normal&packs=3`: sobres iniciales.
- `/?demo=empty`: ranking sin coleccionistas y colección vacía, con tres sobres para comenzar. Abrir uno incorpora a Mariel al ranking.
- `/?demo=error`: error persistente del repositorio y botón Reintentar. Quitar el parámetro para recuperar el escenario normal.
- Credenciales incorrectas: mensaje de error en login.
- Buscar un nombre inexistente: estado sin resultados.

## Pruebas y compilación

```sh
npm test
npm run build
npm run preview
```

44 pruebas cubren login simulado, inventario vacío, duplicados, ranking, aislamiento de usuario/colección, apertura de tres cartas, agotamiento y concurrencia. TypeScript estricto y compilación Vite verificados.

Para revisar en teléfono de la misma red: `npm run dev -- --host 0.0.0.0`, y abrir `http://IP-DEL-COMPUTADOR:5173`. Las vistas móviles se han revisado en navegador y se han ajustado a partir de las capturas del teléfono del usuario.

## Arquitectura

- `src/domain/`: tipos y reglas puras de colección, inventario, ranking y sorteo.
- `src/data/`: contrato `CollectionRepository`, adaptadores Supabase y memoria; fixtures para pruebas.
- `src/application/useCollection.ts`: coordinación de carga, apertura y errores.
- `src/ui/`: componentes reutilizables (Button, Logo, Title, Back, Navigation, EmptyState, CardTile), pantallas y revelación.
- `src/ui/tokens.css`: colores, tipografía, radios y espaciado del Design System.
- `src/main.tsx`: composición e inyección del repositorio y escenarios de prueba.

Cada carta, sobre e inventario está vinculado a una colección. La colección tiene 30 espacios y tres cartas disponibles con identidades e ilustraciones distintas. Los 27 espacios restantes están reservados (`availableInPacks: false`) y no se sortean hasta incorporar su contenido. Cada copia se acumula en el mismo identificador; la colección muestra una carta con xN en la esquina inferior derecha. El catálogo real está en `public.cards` de Supabase. `fixtures.ts` solo alimenta las pruebas y la demo local.

## Recursos visuales

`public/figma` contiene recursos individuales descargados de las URLs de Figma obtenidas durante la lectura del diseño; las URLs temporales no se usan en ejecución. Inter también está alojada localmente. Las capturas completas suministradas no forman parte de la interfaz. Fondo decorativo, logotipo, sobres y retratos son recursos; botones, formularios, navegación, tarjetas y texto son HTML/CSS interactivo.

El dorso usa la imagen aportada en `public/cards/family-card-back.png`, con marco CSS y giro interactivo. Los iconos de navegación se resuelven con Lucide. La barra de estado del teléfono se omite deliberadamente porque corresponde al sistema operativo, no a la web. Estas diferencias quedan pendientes de una revisión visual final con los recursos exactos.

## Fuera de alcance

Sin registro público, entregas diarias, compras, monedas, intercambios ni minijuegos. El backend actual gestiona autenticación, inventarios y apertura atómica. Las imágenes siguen alojadas con la web; trasladarlas a Storage queda para una etapa posterior.

## Revisión de esta entrega

Compilación de producción y 47 pruebas aprobadas. Recorrido manual verificado a 390 × 844: login, apertura, tres revelaciones, ampliación y Escape, incorporación a la colección, ranking vacío y paso al ranking con Mariel, e Inicio con dos sobres. Colección vacía revisado a 320 px sin desbordamiento horizontal. Sin errores de consola en la sesión revisada.

## Ajustes móviles

El menú ocupa su propia fila fuera del área de contenido desplazable y respeta las zonas seguras. Se redujeron los márgenes superiores y las alturas de ilustraciones se adaptan a `dvh`. En apertura se puede tocar el sobre o deslizar horizontalmente de un borde al otro del sobre en cualquiera de las dos direcciones (umbral: 85 % de su ancho). Los desplazamientos verticales y gestos cancelados no abren sobres. Solo las cartas únicas suman al progreso y ranking.

## Descubrimiento al mantener presionada una carta

Solo en el detalle, mantener presionada la carta durante 220 ms muestra su versión realista; soltar restaura inmediatamente el dibujo. Un toque breve no cambia la imagen. También admite Espacio/Enter sostenidos y restaura al cancelar el gesto, perder foco o cambiar de pestaña. El desplazamiento vertical sigue disponible fuera de la carta; sobre ella se reserva el gesto para mantener presionado. Se evita el menú de guardar imagen durante la pulsación.

La colección y los sobres usan siempre `imageUrl` (dibujo). `realisticImageUrl` y `realisticImagePosition` se usan exclusivamente en `CardDiscovery`. Son dos representaciones de la misma carta: no crean copias ni alteran progreso o ranking. La segunda imagen se precarga al entrar en detalle; si falla, se conserva el dibujo.

Parejas disponibles: Lucía (`8da36.png` / `6b38c.png`) y Rodrigo (mitades derecha/izquierda del recurso `c3c29.png`, mediante encuadre CSS). Falta aportar la versión realista de El alfarero y las parejas de los espacios reservados. No se ha generado ni sustituido esa imagen por otra persona. Para incorporarla, añadir su archivo y `realisticImageUrl` en el catálogo. Las cartas definitivas deberán tener ambas versiones.

## Corrección de carga y pulsación

Las tres ilustraciones de runtime usan JPEG optimizado en `public/cards/optimized` en lugar de los PNG de exportación (más de 6 MB frente a aproximadamente 530 KB entre las tres). Los originales se conservan en `public/figma`. Rodrigo mantiene sus dos versiones en el mismo recurso, encuadradas a izquierda/derecha.

La pulsación se registra aunque la imagen realista esté descargándose, y se revela cuando termine de cargar solo si todavía se mantiene presionada. Sobre la carta se desactiva la interpretación de scroll para evitar cancelaciones por pequeños movimientos del dedo. Hay cinco pruebas del componente con eventos táctiles, carga tardía, cancelación y teclado, además de las pruebas de lógica. La versión realista de El alfarero continúa pendiente de recibir.

### Rasgado interactivo del sobre

El rasgado y el brillo siguen el avance del dedo. Si se suelta antes del umbral, el sobre se restaura sin consumirse. Al completar el recorrido, la tira superior se desprende y un brillo cubre la pantalla durante 850 ms; luego se desvanece durante 450 ms para mostrar las tres cartas boca abajo. Se conserva la apertura con toque o teclado. Con movimiento reducido, la transición se acorta a 120 ms por fase. La animación utiliza capas de la imagen existente y CSS, sin descargar video ni nuevas librerías.

Validación: 44 pruebas, incluidas apertura en ambas direcciones, avance parcial, cancelación y recuperación tras fallo. Prueba de navegador a 390 × 700: un arrastre completo muestra las tres cartas.

### Abrir sin barra del navegador

Se incluye un manifiesto con `display: standalone`, iconos de instalación y metadatos para iOS. La barra del navegador no se puede ocultar automáticamente al visitar un enlace o QR. Para abrir sin ella, sirve la app por HTTPS, instálala desde el menú del navegador (Instalar app / Agregar a pantalla de inicio) y ábrela desde ese icono. En iPhone utiliza Compartir → Agregar a pantalla de inicio y, si aparece, Abrir como app web.

La dirección de desarrollo HTTP de la red local (192.168.x.x) no cumple los requisitos de instalación segura. El modo instalado debe verificarse en un dispositivo con una URL HTTPS. No se añade caché offline ni service worker: esta configuración solo prepara la presentación instalada y requiere conexión.

### Publicar una prueba por FileZilla en una subcarpeta

La compilación utiliza rutas relativas y se puede subir a cualquier subcarpeta. Ejecuta `npm run build` y sube **todo el contenido de `dist`** dentro de la carpeta remota elegida, por ejemplo `public_html/cartas-prueba/`. Abre `https://tudominio.cl/cartas-prueba/` (con la barra final), o su `index.html`. No subas `node_modules` ni el código fuente. Conserva la estructura de las carpetas `assets`, `figma`, `cards` e `icons`.

No hacen falta reglas de reescritura: la navegación de esta demo se maneja en memoria. La instalación sin barra del navegador requiere HTTPS incluso en este sitio de prueba.

### Resumen de Inicio y Mi colección

Inicio reúne el progreso de cartas únicas y la posición de ranking en una sola tarjeta encima de los sobres. Sin cartas muestra 00/30 y # 0. Mi colección muestra cartas distintas sobre el catálogo de 30 y cartas totales (todas las copias). Las repetidas no aumentan el progreso ni el ranking. La navegación y los textos visibles usan Colección.

### Giro de cartas al descubrirlas

En la revelación de un sobre puedes tocar una carta o deslizar horizontalmente sobre ella en cualquiera de los dos sentidos. El giro sigue el dedo y, al superar los 90° (42,5 % del ancho de la carta), el giro se completa automáticamente y abre la carta en grande. Un gesto incompleto o cancelado vuelve al dorso sin descubrirla. Se mantiene el acceso por teclado y se respeta movimiento reducido. Al descubrir las tres cartas del último sobre, Ver mi colección usa el estilo amarillo principal; debajo aparece Ir al Home como acción secundaria. Para probar rápidamente el último sobre, abre la app con `?demo=normal&packs=1`.

En Ranking, la fila del usuario actual tiene una etiqueta Tú y un contorno lila suave, independientes de los colores del podio.

## Continuar el desarrollo en GitHub

Este repositorio contiene el proyecto existente, incluidas todas las pantallas, componentes e ilustraciones. No se necesita un archivo `.env`: el cliente incluye únicamente la URL y la clave PUBLICABLE de este proyecto Supabase. Nunca se debe incluir una clave secreta o service_role. Usa Node.js 26.12.1, fijado en `.nvmrc` y utilizado en la validación. Si usas otra versión, comprueba los requisitos de las dependencias: jsdom 31 exige ^22.22.2, ^24.15.0 o >=26.0.0.

```sh
git clone https://github.com/roesvisa/cartas-de-la-familia.git
cd cartas-de-la-familia
npm ci
npm run dev
```

El repositorio es público: cualquiera puede clonarlo; enviar cambios requiere permisos con tu cuenta de GitHub. La sesión de GitHub en Codex y la autenticación de Git en tu equipo son independientes.

Para cada cambio, parte de `main` actualizado, crea una rama y conserva el trabajo en commits pequeños:

```sh
git switch main
git pull --ff-only
git switch -c codex/descripcion-del-cambio
# Modificar el código existente
npm test
npm run build
git add src README.md
git commit -m "Describe el cambio"
git push -u origin codex/descripcion-del-cambio
```

Revisa el diff antes del commit y abre un pull request hacia `main`. Las imágenes nuevas se agregan explícitamente desde `public/`. `package-lock.json` se guarda para instalaciones reproducibles; `node_modules/`, `dist/`, archivos de entorno, claves privadas y archivos temporales se excluyen mediante `.gitignore`. La contraseña del login de demostración es ficticia y pública por diseño; no otorga acceso a servicios reales.

El ranking actual muestra un podio para los puestos 1–3 y una lista desde el cuarto lugar. La marca Tú identifica al usuario tanto en el podio como en la lista. La arquitectura y el diseño existentes se conservan; el backend usa Supabase conservando el diseño.

## Publicación en GitHub Pages

URL: https://roesvisa.github.io/cartas-de-la-familia/

El workflow `.github/workflows/pages.yml` instala dependencias, ejecuta las pruebas y compila la app antes de publicar `dist`. Se ejecuta al actualizar `main` o manualmente desde Actions. No requiere FileZilla ni secretos personalizados. Si fallan las pruebas o la compilación, no publica esa versión. La web se comunica directamente con Supabase; GitHub Pages aloja solo el frontend.


## Backend Supabase

Proyecto: `bkkyustjpclrssqrkrck`, región `sa-east-1`.
Panel: https://supabase.com/dashboard/project/bkkyustjpclrssqrkrck

- `collections`, `cards`: catálogo vinculado a colección.
- `profiles`, `memberships`: identidad visible y acceso autorizado.
- `packs`, `inventory`, `pack_cards`: sobres, cantidades y resultado durable de cada apertura.
- `collection_snapshot`: devuelve el inventario propio y únicamente los conteos agregados de otros miembros para el ranking.
- `open_pack`: sorteo del servidor, bloqueo transaccional y respuesta idempotente por ID de sobre. Repetir la petición no consume cartas ni sobres adicionales.
- RLS en todas las tablas. El cliente solo lee; no puede crear sobres, cambiar cantidades ni inscribirse en colecciones. Las funciones privilegiadas viven en `private` y comprueban identidad y pertenencia.
- Ranking se actualiza al navegar o regresar a la ventana. No usa suscripciones Realtime.

### Invitar familiares

En Authentication → Users → Invite user del panel, enviar la invitación a su correo. El trigger de la base reconoce exclusivamente invitaciones del administrador y añade automáticamente al usuario a `familia-2026` con tres sobres iniciales. La persona abre el enlace y elige su contraseña en la app. Nunca guardar contraseñas en GitHub ni enviar claves de administración al navegador.

Configuración necesaria en Authentication antes de invitar: desactivar **Allow new users to sign up**, mantener acceso anónimo desactivado y establecer Site URL en `https://roesvisa.github.io/cartas-de-la-familia/`. Autorizar esa misma URL de redirección. La entrega de emails para direcciones externas puede requerir configurar SMTP propio según las restricciones del servicio de correo de Supabase.

Si un administrador crea una cuenta directamente (sin invitación), debe asignarle acceso desde SQL Editor con `select private.enroll_user('UUID_DEL_USUARIO', 'familia-2026', 'Nombre');`. Esta función no es accesible desde el cliente y no vuelve a dar sobres si ya existe la membresía.

### Validación del servidor

Migraciones versionadas en `supabase/migrations/`. No volver a aplicarlas sobre el mismo proyecto: ya están instaladas. `supabase/tests/isolation.sql` se ejecuta en SQL Editor como administrador y termina con ROLLBACK: prueba permisos de dos usuarios, inventario, ranking, reintentos, escrituras prohibidas y bloqueo anónimo, sin conservar cuentas de prueba. No prueba el envío de correo.

Pendiente de prueba con cuentas personales: aceptar invitación, definir contraseña, cerrar y abrir sesión desde dos celulares y comprobar el ranking. La colección conserva 30 posiciones y 3 cartas habilitadas; las otras 27 necesitan su contenido definitivo.

Estado de activación: integración preparada en la rama `codex/supabase-backend`. No publicar en `main` hasta configurar Auth (registro cerrado y URL) y validar una invitación real. Las migraciones sí están aplicadas en el proyecto Supabase.

### Validación de reposición diaria

`supabase/tests/daily_packs.sql` verifica con transacciones revertidas el inicio del ciclo, aperturas sin reinicio, reposición, límite de tres, tiempo sin conexión e idempotencia. La migración `20261125233525_daily_pack_refill.sql` guarda el próximo plazo en la membresía; el servidor reconcilia el saldo al consultar o abrir sobres, sin depender del reloj del teléfono ni de una tarea programada.
