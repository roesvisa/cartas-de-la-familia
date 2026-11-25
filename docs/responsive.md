# Validación responsive

## Causa y corrección

El encabezado de Inicio combinaba `height: 112px` con `overflow: hidden`. Los nombres reales podían ocupar varias líneas, fuera de la altura reservada. Se reemplazó la altura por Grid: logo/perfil en la primera fila y saludo completo en la segunda, con salto de palabras largas. La decoración mantiene su posición absoluta; el contenido usa flujo normal.

El panel de sobres conservaba `min-height: 363px`, márgenes verticales de 24/28px y tamaños rígidos. Ahora usa Grid con separación acotada por altura visible, imágenes proporcionales y sin altura mínima artificial. Los resúmenes tienen columnas `minmax(0, 1fr)`; sus textos pueden ajustarse sin ensanchar la pantalla.

Se conserva la estructura de dos filas: contenido desplazable y navegación inferior. Usa `100dvh` con respaldo `100vh`, y áreas seguras en los cuatro bordes. El contenido largo se desplaza; no se fuerza a caber reduciendo el texto. Se retiraron mínimos innecesarios en apertura/revelación y los filtros tienen 44px de altura mínima y permiten ajuste de texto.

## Comprobaciones

Navegador con anchos 320, 360, 375, 390 y 430 px; cada uno con alturas 568, 700 y 844 px (15 combinaciones por vista). Vistas recorridas: bienvenida, login, Inicio con nombre largo y con cero sobres, colección vacía y con cartas, ranking y ranking vacío, apertura, revelación, resultado, carta ampliada y detalle.

Mediciones DOM: sin desbordamiento horizontal, saludo dentro de su encabezado y navegación dentro del viewport, separada del área de contenido. Revisión visual en 390×700 y 320×568. Nombre de prueba: «Rodrigo Vilches Sandoval», aplicado temporalmente al fixture y restaurado antes del commit. Flujo de apertura y duplicados revisado con datos locales; no se alteraron usuarios reales.

44 pruebas automatizadas aprobadas y `npm run build` correcto. Esta validación emula dimensiones en navegador; falta confirmar en el teléfono Android físico con sus barras de navegador, teclado y preferencias de tamaño de texto.

## Reproducir

`npm ci` y `npm run dev`. Abrir `/?demo=normal` o `/?demo=empty&packs=0`. Credenciales de demo documentadas en README. Probar los tamaños anteriores, desplazarse hasta el último elemento, abrir un sobre, revelar cartas y entrar a detalle. La demo está disponible solo en desarrollo.

La rama `codex/mobile-responsive` se prepara para incorporar a `main`; el workflow de GitHub Pages publica tras superar pruebas y compilación.
