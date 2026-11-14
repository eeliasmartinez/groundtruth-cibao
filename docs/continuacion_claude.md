# Handoff para Claude Code — 14-nov-2026

Este documento resume el último cambio pedido por Elias. Está escrito para que otro
agente pueda continuar sin volver a investigar ni asumir que los dibujos son datos.

## Qué pidió Elias

1. Después de pulsar **“Continuar con esta finca”**, abrir la pregunta siguiente y dejar
   el relieve 3D visible.
2. Añadir la Autopista Duarte con carritos pequeños en movimiento; intentar obtener una
   línea real, no dibujarla a mano.
3. Añadir vida/cultivos al mapa, con geografía veraz.
4. Documentar el trabajo y enumerar lo pendiente.

## Cambios implementados

- `web/index.html`: el recorrido ahora tiene un espacio lateral para una segunda copia del
  canvas 3D. Al continuar desde la ficha de zona, la pregunta aparece al lado del relieve.
  El mismo canvas permite arrastrar y girar la vista. En pantallas angostas, el relieve se
  coloca arriba de la pregunta.
- `web/app.js`: `guideWithScene` mantiene el modo 3D en las preguntas del recorrido que
  empiezan desde una zona. El render selecciona `g-canvas` en el recorrido y `z-canvas` en
  la ficha. El botón Atrás sigue devolviendo a la ficha de zona. Al iniciar desde Inicio,
  el cuestionario conserva su mapa 2D original.
- `data/duarte_osrm.json`: respuesta reducida de OSRM con cinco pasos que llevan el nombre
  `Autopista Duarte` o `Autopista Juan Pablo Duarte`, obtenidos entre Santo Domingo
  (`-69.95,18.48`) y Santiago (`-70.70,19.45`) el 14-nov-2026.
- `build_roads.py` genera `web/roads.js`; conserva una geometría simplificada de 249 puntos
  para que la línea funcione offline. Ejecutar `python3 build_roads.py` para regenerar.
- Los mapas 2D (Mapa, Inicio y paso de ubicación) dibujan la carretera desde la geometría
  guardada. Dos carritos SVG siguen la línea; en el relieve 3D los carritos avanzan por el
  tramo solo cuando la ruta cruza la ventana de esa zona. No hay información de tránsito.
- Cada punto arrocero del mapa tiene un pequeño brote con sombra. El símbolo representa
  una zona arrocera, no cultivo observado ni un lindero. La finca ilustrativa del 3D ahora
  tiene surcos y brotes de arroz.
- `web/sw.js` se subió a `plan-b-v7` y precarga `roads.js`, para no dejar fuera la nueva
  capa cuando se use la PWA sin conexión.
- `AGENTS.md`, `README.md` y `docs/como_funciona.md` describen los datos, límites y cómo
  reconstruir la línea. Los nuevos enlaces de fuentes también están en `SOURCES` de
  `web/app.js`.

## Fuentes y decisiones cartográficas

- El MOPC/RD Vial describe Autopista Duarte entre Santo Domingo y Santiago con longitud
  oficial de **146.6 km**: <https://rdvial.gob.do/wp-content/uploads/2024/02/SIMVFOP-003-P2-PS-11231.pdf>.
- Se consultó OSRM con `route/v1/driving/-69.95,18.48;-70.70,19.45?overview=full&geometries=geojson&steps=true`.
  La ruta completa resultó 149.1 km incluyendo accesos urbanos; sus pasos nombrados
  Duarte suman **145.63 km**, dentro de 1 km de la longitud del MOPC. La línea sirve como
  referencia visual basada en OSM, no como delineación oficial del derecho de vía.
- También se intentó Overpass: el endpoint principal devolvió HTTP 406; dos alternativos
  no respondieron dentro del plazo o no resolvieron. Se encontró el extracto regional de
  Geofabrik, pero era demasiado grande para esta tarea. OSRM sí entregó la ruta nombrada.
- OSM requiere atribución: <https://www.openstreetmap.org/copyright>. Los carritos son
  decoración del recorrido visual; no simulan densidad, velocidad o condiciones reales.
- Se revisó el Atlas de Estadísticas Ambientales ONE 2024, que contiene mapas regionales
  de uso agrícola y menciona concentraciones de café/tabaco. No se pusieron símbolos de
  esos cultivos en coordenadas puntuales: la fuente reporta zonas amplias, no parcelas.
  El prototipo se centra en arroz y solo muestra los 14 puntos arroceros ya definidos.
  Fuente: <https://one.gob.do/media/pmgbiesl/atlas-estadisticas-ambientales-2024.pdf>.
- No se agregaron animales: no hay una capa pública y fiable de ubicación ganadera
  preparada para la app. No inventar animales o cultivos en puntos escogidos a mano.

## Validación de esta ronda

- Debe correr `node --check web/app.js`, `node --check web/roads.js` y `node check_web.js`.
- `check_web.js` valida el motor JS contra escenarios ya empaquetados. Los cálculos Python
  y los coeficientes de cultivos no se tocaron.
- Se intentó abrir la copia `file://` en el navegador mediante la automatización disponible,
  pero la política del navegador solo permitió páginas HTTP/HTTPS. No intentar eludir esa
  restricción; Elias puede validar la copia local con doble clic.
- Tras cualquier cambio adicional en `web/`, incrementar el nombre de caché en
  `web/sw.js`. Todo texto visible debe estar en ES y EN.

## Pendiente para el equipo

1. Abrir `web/index.html`, elegir una zona, colocar la finca y pulsar “Continuar con esta
   finca”; confirmar que el 3D sigue al lado y gira en desktop y móvil.
2. Comprobar que la Autopista Duarte se ve en Inicio, Mapa y paso de ubicación, y que los
   carritos se mueven sobre la línea. No confundirlos con tráfico en vivo.
3. Revisar visualmente que los brotes no tapen nombres o puntos en el mapa nacional.
4. Probar la PWA instalada después de cambiar a `plan-b-v7`, incluyendo modo sin internet.
5. Mantener como pendientes la revisión de un agrónomo, el ensayo del pitch y el material
   global (máximo 30 s o 7 diapositivas). La app sigue cubriendo 14 zonas arroceras, no
   toda la agricultura ni todas las fincas dominicanas.
