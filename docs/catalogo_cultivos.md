# Catálogo agrícola dominicano en la web

Actualizado el 15-nov-2026.

## Qué se añadió

La página ahora tiene una sección **Cultivos** accesible desde Inicio. El directorio reúne 48 cultivos/rubros (39 de las estadísticas y el motor, y 9 añadidos para la calculadora de agua), con búsqueda, filtro por grupo y filtro por estado del modelo. Incluye frutas (por ejemplo lechosa, aguacate, piña, coco, zapote, naranja, mango y limón), además de cacao, café y otros rubros. Muestra producción nacional de 2025 cuando el boletín ONE la publica por separado y el porcentaje de exportación para los productos que aparecen en esa tabla.

El cacao aparece primero en el directorio y su ficha distingue las exportaciones de cacao en grano de la producción nacional: ONE reporta 77,058.7 toneladas exportadas y USD 668.9 millones en 2025. Son exportaciones, no toneladas producidas en finca ni un precio que pueda usar el planificador. Fuente: ONE, *Boletín de Estadísticas Agropecuarias, enero-diciembre 2025*.

Fuentes principales:

- ONE, *Boletín de Estadísticas Agropecuarias, enero-diciembre 2025*: https://www.one.gob.do/media/njpkonqj/bolet%C3%ADn-estad%C3%ADstico-agropecuario-enero-diciembre-2025.pdf
- Ministerio de Agricultura, perfil de la yuca: https://agricultura.gob.do/wp-content/uploads/2024/09/Yuca.pdf

Las cifras individuales de producción y exportación se transcribieron del boletín de ONE. Son estadísticas nacionales preliminares, no rendimientos por tarea ni resultados de una finca. Si la ficha no muestra una cifra, no se interpreta como producción cero: el boletín no publicó ese total separado en sus cuadros principales.

## Qué significa “en el motor actual”

El motor contiene ocho perfiles generales: arroz, habichuela, guandul de ciclo corto, caupí, maíz, sorgo, auyama y sesbania. La habichuela se representa como una sola categoría general; no distingue habichuela roja, negra y blanca. Esos perfiles se comparan dentro del escenario arrocero que existe hoy. No equivalen a ocho planificadores completos e independientes.

El resto del catálogo es informativo. Desde el 15-nov la web calcula el agua de riego de yuca, plátano, cítricos, hortalizas y otros cultivos con perfil FAO-56 (ver "Calculadora de agua" abajo), pero no recomienda rotaciones para ellos. Cacao, café, aguacate, mango y otros frutales siguen sin cálculo.

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

La lista reúne productos nombrados en las estadísticas principales de ONE y los perfiles que ya existían. Es una ampliación representativa, no una lista exhaustiva de todas las especies, variedades ni cultivos menores dominicanos; el propio boletín agrupa parte de la producción como “otros”. No rotularlo como “todos los cultivos existentes” sin consolidar antes la base mensual y regional del Ministerio de Agricultura.

## Calculadora de agua (15-nov)

La sección también calcula el agua de riego por tarea para 31 cultivos en cada zona y mes:
los 8 del motor de rotación y 23 más tomados de FAO-56 (tabla 11, días por etapa; tabla
12, coeficiente Kc): https://www.fao.org/4/x0490e/x0490e0b.htm. En `crops_fao.py` cada
cultivo anota la fila usada. Cuando la tabla 12 no da Kc inicial se usa el valor del grupo,
como indica FAO-56; cuando da un rango se usa el punto medio.

Este cálculo solo cuenta agua. No convierte esos cultivos en recomendaciones: su
tolerancia al calor y al suelo arrocero, el calendario local y el mercado deben revisarse
con un técnico. Las filas de FAO-56 provienen de otros climas (Mediterráneo, zonas áridas,
trópicos) y se ajustan aquí solo con el clima de NASA POWER.

Los totales por grupo que mostraba la parte de arriba (frutales, musáceas, vegetales) se
quitaron: la suma de cinco vegetales del directorio superaba el total de vegetales y no se
pudo abrir el boletín para aclararlo. Las cifras por cultivo siguen pendientes de cotejo.
