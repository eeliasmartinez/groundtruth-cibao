# Catálogo agrícola dominicano en la web

Actualizado el 14-nov-2026.

## Qué se añadió

La página ahora tiene una sección **Cultivos** accesible desde Inicio. El directorio reúne 39 cultivos/rubros, con búsqueda, filtro por grupo y filtro por estado del modelo. Muestra producción nacional de 2025 cuando el boletín ONE la publica por separado y el porcentaje de exportación para los productos que aparecen en esa tabla.

Fuentes principales:

- ONE, *Boletín de Estadísticas Agropecuarias, enero-diciembre 2025*: https://www.one.gob.do/media/njpkonqj/bolet%C3%ADn-estad%C3%ADstico-agropecuario-enero-diciembre-2025.pdf
- Ministerio de Agricultura, perfil de la yuca: https://agricultura.gob.do/wp-content/uploads/2024/09/Yuca.pdf

Las cifras individuales de producción y exportación se transcribieron del boletín de ONE. Son estadísticas nacionales preliminares, no rendimientos por tarea ni resultados de una finca. Si la ficha no muestra una cifra, no se interpreta como producción cero: el boletín no publicó ese total separado en sus cuadros principales.

## Qué significa “en el motor actual”

El motor contiene ocho perfiles generales: arroz, habichuela, guandul de ciclo corto, caupí, maíz, sorgo, auyama y sesbania. La habichuela se representa como una sola categoría general; no distingue habichuela roja, negra y blanca. Esos perfiles se comparan dentro del escenario arrocero que existe hoy. No equivalen a ocho planificadores completos e independientes.

El resto del catálogo es informativo. La web no calcula todavía necesidades de riego específicas ni recomienda rotaciones para yuca, plátano, cacao, frutales y los demás cultivos pendientes.

## Por qué no se copió el modelo de arroz a todos

Los cultivos anuales, raíces, hortalizas y plantaciones perennes necesitan calendarios, duración, etapas, Kc, manejo del suelo y reglas de rotación propias. En árboles y cultivos permanentes también importan la edad de la plantación, sombra, cobertura entre hileras y años antes de cosechar. Copiar la duración o el perfil del arroz produciría cifras precisas en apariencia, pero sin validez agronómica.

Para habilitar un cultivo en el planificador se deben documentar y revisar:

1. Variedades y calendario de siembra/cosecha dominicanos.
2. Etapas de desarrollo, Kc y duración del ciclo con fuente técnica.
3. Ajustes de lluvia efectiva, riego y tipo de suelo adecuados al cultivo.
4. Compatibilidad con suelos, inundación, salinidad y calor.
5. Plagas, rotaciones no recomendables, mercado, costos y rendimientos locales.
6. Revisión por un agrónomo y comparación con observaciones de productores.

## Cómo ampliar el catálogo

El archivo local de la interfaz es `web/crops_local.js`; su vista y filtros están en `web/app.js`, sus textos bilingües en `web/copy.js` y su presentación en `web/style.css`. `web/sw.js` precarga la nueva fuente y debe incrementar el nombre del caché cuando cambien los archivos offline.

La lista reúne productos nombrados en las estadísticas principales de ONE y los perfiles que ya existían. No es una lista exhaustiva de todas las especies, variedades ni cultivos menores dominicanos; el propio boletín agrupa parte de la producción como “otros”. No rotularlo como “todos los cultivos existentes” sin consolidar antes la base mensual y regional del Ministerio de Agricultura.
