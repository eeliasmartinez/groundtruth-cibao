# Handoff para Claude Code — 14-nov-2026

> **15-nov:** la Autopista Duarte (`build_roads.py`, `data/duarte_osrm.json`, `web/roads.js`)
> se quitó del proyecto. Las notas de abajo sobre ella quedan solo como historia.

## Actualización Codex — bug de finca, calendario, botones y presas

- Bug visto en la captura del recorrido: el texto decía que se vería la marca de finca,
  pero al iniciar desde Inicio y escoger una zona el relieve no la dibujaba. `drawScene`
  ahora la muestra mientras el recorrido conserva la zona seleccionada; sigue siendo un
  símbolo ilustrativo, no el lindero de una finca real.
- Las acciones de “Mi plan” ahora están agrupadas: compartir ocupa una fila principal y
  copiar, escuchar, imprimir y guardar/borrar quedan en una cuadrícula compacta.
- El calendario de dos ciclos explica en español e inglés el significado del gris: días
  que quedan fuera de la duración modelada del cultivo. Pueden incluir preparación,
  descanso o espera; no son una observación satelital de suelo desnudo.
- El relieve carga `web/dam.svg` y lo dibuja en los puntos de presa. Hay un marcador de
  reserva mientras carga el SVG. `web/sw.js` pasa a `plan-b-v15` y precarga el recurso.
- No se incorporó un estimador de ganancia todavía. Agricultura publica costos de arroz
  (RD$7,900.40/tarea) y habichuela roja (RD$7,766.22/tarea), pero son referencias de
  2021; el costo de habichuela proviene de la Regional Suroeste. ONE publica precios al
  productor recientes y el IAD publica rendimientos del sector reformado, pero combinar
  esas fuentes para prometer el resultado de una finca del Cibao sería engañoso. Antes
  de calcular ahorro/beneficio hacen falta precios recibidos por el productor del Cibao,
  rendimientos comparables, costos actuales y validación de cultivos/temporadas.
- Fuentes revisadas: costos de producción del Ministerio de Agricultura (2021),
  <https://agricultura.gob.do/wp-content/uploads/2023/05/Costo-de-Produccion-2021.pdf>;
  rendimiento del IAD (enero-junio 2025),
  <https://iad.gob.do/wp-content/uploads/2025/07/INFORME-POA-ENERO-JUNIO-2025-1.pdf>;
  boletines agropecuarios ONE, incluyendo precios al productor,
  <https://www.one.gob.do/publicaciones/2026/boletin-de-estadisticas-agropecuarias-enero-marzo-2026/>.

## Actualización Codex — guardado privado, procedencia y superficies de mapa

- `web/copy.js` contiene ahora el objeto bilingüe `T`, separado de la lógica de pantalla.
- `web/storage.js` es un módulo clásico independiente. Guarda una lista blanca de respuestas
  (zona regional, mes, tareas, suelo, agua, prioridad, idioma y preferencias) en
  `localStorage`; valida el registro al cargarlo. No almacena coordenadas exactas ni hace
  solicitudes de red. En “Mi plan” se ofrece guardar/borrar; si el navegador falla, avisa y
  la herramienta sigue funcionando.
- `web/index.html` carga `copy.js` y `storage.js` antes de `engine.js` y `app.js`. Mantener
  scripts clásicos para que `file://` y el modo offline sigan funcionando.
- El resumen del relieve tiene un efecto cristal translúcido con fondo opaco alternativo;
  se limita a ese panel. Se respeta `prefers-reduced-transparency` cuando el navegador lo
  soporta.
- Movimiento reducido ya no elimina toda respuesta visual: detiene oleaje, flujos y entradas
  de movimiento; mantiene cambios de color/opacidad. El canvas 3D se detiene al cambiar de
  pestaña del navegador y reacciona si cambia la preferencia del sistema durante la sesión.
- El panel del plan distingue clima NASA POWER, entradas del productor y mapa ilustrativo.
  No se cambiaron motor, cultivos ni coeficientes. PWA subida a `plan-b-v12`.
- Falta revisar en dispositivos reales contraste del vidrio, lectura a 320–390 px, guardado
  y borrado en Chrome/Safari, reapertura offline y el recorrido con movimiento reducido.
- `app.js` sigue siendo el controlador grande; solo se separaron contenido y persistencia.
  Una división ulterior debe ser incremental y mantener `engine.js` + la comparación Python/JS.

## Actualización Codex — simplificación de la finca y opciones

- El recuadro de clima/suelo/agua/área en el relieve 3D está dentro de un menú nativo
  cerrado inicialmente, “Datos del mapa”. Abrirlo es opcional.
- “Continuar con esta finca” ahora pone la marca ilustrativa y abre inmediatamente la
  primera pregunta junto al mismo relieve 3D. Ya no requiere un segundo clic.
- Inicio incluye “Guía sencilla para el campo”. Usa el motor y las opciones existentes;
  solo adapta preguntas y explicaciones para productores. No crea cuentas ni guarda datos.
- La PWA subió a `plan-b-v10`; el teléfono debe cargar esta versión para mostrar los cambios.
- Cambios en `web/app.js`, `web/index.html`, `web/style.css`, `web/sw.js`, `AGENTS.md` y
  esta documentación. Mantener los dos idiomas y subir CACHE en futuros cambios.

## Actualización Codex — narrativa de scroll y mapa que responde

- La portada suma la sección journey con tres capítulos: clima, agua y rotación. En
  escritorio el mapa se queda fijo mientras el capítulo activo cambia al entrar en
  pantalla. En móvil el mapa aparece primero y el scroll sigue nativo. No hay bloqueo de
  scroll ni librerías externas.
- El mapa narrativo j-map reutiliza las capas locales existentes; es decorativo y no
  interactivo para evitar que parezca un segundo selector de finca.
- El resumen debajo del mosaico de 100 tareas y el panel sobre el relieve z-canvas y
  g-canvas muestran el mes elegido, Tmax media mensual y lluvia media histórica del mes
  para la zona, suelo elegido por el usuario y porcentaje de agua configurado. Cambian al
  modificar las respuestas; el suelo y el agua no son datos satelitales de la parcela.
- web/sw.js cambió a plan-b-v9. El área elegida también se muestra en el contexto del
  relieve, pero no cambia la geometría del mapa porque no se conoce el lindero real. No se
  agregaron cuentas ni base de datos, ni se amplió a
  escala mundial: siguen siendo decisiones para después de la evaluación y requieren
  diseño de privacidad y validación agronómica por región.
- Al continuar: probar el scroll en desktop y móvil, cambiar idioma, mes, suelo y agua
  con la escena 3D visible, y comprobar la actualización del cache PWA sin conexión.

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

## Corrección del relieve en “Empezar con mi finca” (14-nov-2026)

- Problema: el recorrido iniciado desde Inicio comenzaba con `guideWithScene = false`.
  Al seleccionar una provincia solo se redibujaba el cuestionario; el panel y el render 3D
  seguían apagados. Además, al avanzar un paso no se reiniciaba el canvas que acababa de
  hacerse visible.
- Corrección en `web/app.js`: al seleccionar provincia o zona en el mapa del cuestionario,
  activar `guideWithScene`, redibujar y comenzar `startScene()`. Ahora el relieve aparece
  junto al mapa de selección y permanece junto a las preguntas. `visibleSceneCanvas()` y
  `sceneVisible()` usan el canvas correcto durante todo ese recorrido; avanzar reinicia el
  tamaño/render del canvas para evitar una vista vacía.
- `web/sw.js`: caché aumentada a `plan-b-v13` para que la PWA solicite los archivos nuevos.
- No se cambió el motor agrícola, los datos ni el flujo que mantiene el mapa 2D cuando aún
  no se ha elegido una provincia.
- Validación manual pendiente: elegir “Empezar con mi finca”, tocar una provincia, comprobar
  relieve 3D a la izquierda del mapa y avanzar; cambiar la selección y confirmar que la zona
  3D también cambia. Probar en escritorio y teléfono.

## Rediseño de Mi plan, Rotación, Opciones y Datos (14-nov-2026)

- Contexto: las capturas mostraban el panel alto de controles en todas las vistas. En las
  pantallas de rotación, comparación y clima ocupaba casi un tercio del ancho y repetía la
  recomendación azul en cada sección.
- Dirección: mantener el sistema de GroundTruth (ultramar, rojo, papel blanco, tipografías
  locales y bordes directos) y tratar cada pantalla como herramienta de trabajo, no como una
  colección de tarjetas. Sin cristal nuevo ni imágenes decorativas.
- `web/index.html`: el editor común ahora vive dentro de `details#farm-settings`. La franja
  muestra zona, mes, tareas, suelo y asignación de agua. En “Mi plan” queda abierto; en
  Rotación, Opciones y Datos se pliega y puede abrirse para ajustar datos sin perder la vista;
  la etiqueta cambia entre “Editar condiciones” y “Cerrar ajustes”.
  Se mantiene un solo juego de campos y los IDs que usa el motor.
- `web/app.js`: la franja se actualiza con las respuestas actuales. `setView()` abre o pliega
  el editor según la sección. El consejo principal solo se muestra en Mi plan; Rotación,
  Opciones y Datos ya no repiten ese bloque.
- `web/style.css`: las tres secciones pasan a ancho completo. Rotación destaca el calendario
  de dos ciclos; Opciones usa ese ancho para comparar los cuatro planes; Datos da espacio a
  las gráficas. El editor se puede desplegar también en móvil. La apertura tiene movimiento
  breve y respeta `prefers-reduced-motion`.
- `web/copy.js`: nuevas etiquetas de la franja en español e inglés.
- `web/sw.js`: caché actualizada a `plan-b-v14`.
- No cambió el motor, los datos de NASA POWER, los coeficientes de cultivos ni el resultado
  agronómico. Validar visualmente cada sección en escritorio y móvil y confirmar navegación
  ES/EN antes de considerar terminado el rediseño.
