# Guía para continuar este proyecto (para cualquier IA o persona)

Lee este archivo completo antes de tocar nada. Si eres una IA: responde en español
sencillo; el equipo no sabe programar. Explica qué vas a hacer antes de hacerlo.

> Los documentos internos `docs/hoja_de_ruta_claude.md` y `docs/vision_ojo_de_dios.md`
> existen solo en la computadora del equipo. No se publican porque contienen cifras
> sin fuente verificada. La hoja de ruta ya está completa (ver "Avance" abajo).

## Qué es
**GroundTruth Cibao — El Plan B del arrocero.** NASA Space Apps Challenge 2026,
Santiago (RD), reto "Field Shift: Adapting Farms with NASA Data".
Herramienta web que le dice al productor de arroz del Cibao qué puede sembrar con el
agua de riego que le asignan, comparando 4 estrategias de rotación con datos de NASA POWER.

## Enlaces públicos
- Herramienta en vivo: https://eeliasmartinez.github.io/groundtruth-cibao/
- Código: https://github.com/eeliasmartinez/groundtruth-cibao
- Para publicar un cambio: `git add -A && git commit -m "describe el cambio" && git push`.
  La página pública se actualiza sola en uno o dos minutos.

## Fechas
- Pitch local: domingo 15-nov-2026 desde las 4:00 PM, 6 minutos ante 3 jueces (falta
  confirmar el turno del equipo).
- Envío global en spaceappschallenge.org: domingo 15-nov, 11:59 PM. Todo en inglés.
  Demo: video de máximo 30 s o máximo 7 slides.

## Estado: qué funciona hoy
- `web/index.html`: la página interactiva (español/inglés). Se abre con doble clic,
  sin servidor ni internet. **Es el entregable principal.**
- Motor en Python: `nasa_power.py` (descarga y copia guardada en `data/`),
  `water.py` (agua por cultivo, FAO-56), `crops.py` (tabla de cultivos),
  `rotation.py` (estrategias y notas).
- `build_web.py` genera `web/data.js`. `web/engine.js` repite el cálculo de
  `rotation.py` en el navegador.
- `app.py` + `charts.py`: app Streamlit con gráficas de clima (respaldo, opcional).
- `docs/investigacion.md` (problema, cifras y fuentes), `docs/motor.md` (cómo
  calcula y sus límites), `README.md` (inglés, fuentes y declaración de IA).

## Avance de la hoja de ruta (documento interno, no publicado)
- **Paso 1 hecho:** botón "Caso de Don Pedro" (caso de ejemplo) y semáforo de agua
  Normal / Tandeo / Veda en los controles.
- **Paso 2 hecho:** mapa esquemático del Cibao en SVG (7 zonas, ríos Yaque del Norte y
  Yuna, presas, cuadros de NASA POWER) con 4 capas, y "Tu finca desde arriba".
- **Paso 3 hecho:** balance de agua mes a mes (lluvia, pérdida del campo y falta de
  agua marcada en rojo), franja de temperatura máxima por mes y alerta de calor por
  cultivo. La alerta usa el límite de cada cultivo en `crops.py` (`heat_limit`), no un
  umbral fijo de 32 °C, porque ese número no tiene fuente.
- **Paso 4 hecho:** panel "Preguntas frecuentes" (6 respuestas fijas que usan los
  números de la finca; no es una IA respondiendo y la página lo dice), botón
  "Escuchar el plan" (voz del propio dispositivo, sin internet) y botón "Imprimir
  ficha" (hoja de una página con el plan). Probar la voz y la impresión en la
  computadora que se usará en el pitch.
- Decisiones tomadas para no romper la regla 2 (no inventar cifras):
  - El semáforo NO se llama "oficial del INDRHI": no hay fuente de esos porcentajes.
  - Las capas del mapa usan solo NASA POWER. No se rotulan como SMAP ni ECOSTRESS
    porque esos datos no están en el proyecto, y no hay capa de "NDVI sintético".
- **Sin fuente verificada en el documento interno de visión** (no usar en la web ni en el
  pitch hasta tener enlace): costo de RD$ 7,900–9,000 por tarea, 15–25 sacos de urea,
  RD$ 30,000–50,000 de ahorro, esterilidad del arroz a 32 °C, pérdidas de 40% en
  canales, suelos Vertisoles y camellones del IDIAF, canales Mao-Gurabo y Luis Bogaert.

## Rediseño y ampliación (14-nov, tarde)
- **Rediseño:** estilo cristal con colores de la bandera, escena animada en la portada,
  un icono por cultivo, tres pasos guiados con una frase de ayuda cada uno, el "por qué"
  en pestañas y las secciones de datos plegadas.
- **Todo el país:** 14 zonas arroceras (se sumaron Bonao, Sánchez, Dajabón, San Juan,
  Vicente Noble, Miches y Bayaguana), mapa de la isla completa y cuenca Yaque del Sur
  (presas Sabana Yegua y Sabaneta). Las ubicaciones y altitudes de las zonas nuevas son
  aproximadas y deben validarse. Sigue siendo una herramienta para arroceros.
- **Suelo automático: NO se hizo.** Se probó SoilGrids (ISRIC) en las 14 zonas: 8
  consultas se quedaron sin respuesta, 4 devolvieron vacío y solo 2 dieron datos. No es
  confiable para el pitch. El suelo se sigue eligiendo a mano.

## Secciones, mapa real, rotación y PWA (14-nov, tarde)
- La página ahora tiene 7 secciones (Inicio, Mi plan, Rotación, Opciones, Mapa, Datos,
  Ayuda) y muestra una a la vez. En celular hay una barra de pestañas abajo.
- **Rotación en dos ciclos:** calendario por lotes que muestra el cambio de cultivo
  entre el ciclo 1 y el ciclo 2 (6 meses después).
- **Mapa real:** costa de Natural Earth y ríos de OpenStreetMap, guardados en
  `web/geo.js` (lo genera `build_geo.py`). Las presas están ubicadas de forma aproximada
  sobre su río.
- **Límites provinciales:** geoBoundaries ADM1 (2022, dominio público), guardados en
  `data/provinces.geojson` y `web/provinces.js` (lo genera `build_provinces.py`). Tocar
  una provincia selecciona el punto arrocero más cercano, no una parcela exacta.
- **Autopista Duarte: se quitó (15-nov).** La línea y los carritos no ayudaban a decidir
  qué sembrar ni cuánta agua usar, y añadían movimiento y peso a la página. No volver a
  ponerla sin un motivo agronómico (por ejemplo, distancia al mercado con fuente).
- **Arroz en el mapa:** los brotes marcan las 14 zonas arroceras del prototipo. No son
  campos detectados por satélite ni parcelas exactas. No se añadieron animales ni otros
  cultivos porque no hay capas georreferenciadas fiables para ubicarlos.
- **Marca de finca en el relieve 3D:** aparece al elegir "Planificar mi finca aquí"; es
  ilustrativa. El relieve y NASA POWER no tienen detalle suficiente para ubicar el lindero
  de una parcela.
- **Cuestionario con relieve:** al continuar desde la ficha de una zona, el siguiente
  paso y las preguntas siguientes mantienen el mismo relieve 3D en una columna lateral.
  La vista se puede girar allí; el botón Atrás conserva la navegación.
- **Historia de portada:** tres capítulos de scroll nativo mantienen el mapa a la vista y
  explican clima, agua y rotación. El scroll no se secuestra; los cambios son breves y se
  respetan las preferencias de movimiento reducido.
- **Mapa de la finca:** el dibujo de 100 cuadros sigue representando el plan de cultivos.
  Junto a él y sobre el relieve 3D se actualizan el mes, clima mensual de NASA POWER,
  suelo elegido manualmente y porcentaje de agua indicado por el usuario. No son
  mediciones puntuales de la parcela.
- **PWA:** `web/manifest.webmanifest`, `web/sw.js` e iconos. Si se cambian archivos de
  la página, subir el número de `CACHE` en `web/sw.js` (ahora `plan-b-v30`). Desde el
  15-nov el service worker pide **primero la red** (la página y el código siempre
  completos) y usa la copia guardada solo sin conexión o si la red tarda más de 4 s; al
  activarse una versión nueva, la página se recarga una vez sola.
- **Datos del relieve:** el resumen del clima, suelo, agua y área está cerrado inicialmente
  dentro de “Datos del mapa”; se abre solo si el usuario lo elige.
- **Continuar desde una zona:** “Continuar con esta finca” coloca la marca ilustrativa y
  abre la primera pregunta del recorrido en el mismo clic, conservando el relieve 3D.
- **Guía sencilla:** Inicio ofrece “Guía sencilla para el campo”. Usa los mismos cálculos y
  preguntas, con explicaciones más directas; el recorrido normal sigue disponible.
- **Relieve durante el recorrido:** al iniciar desde “Empezar con mi finca”, elegir una
  provincia o zona muestra de inmediato su relieve 3D junto al mapa y lo conserva al avanzar
  por las preguntas. Elegir otra zona actualiza el relieve.
- **Navegación de resultados:** “Mi plan” mantiene el editor de finca abierto; Rotación,
  Opciones y Datos muestran una franja resumida de la finca con el editor plegado. Se puede
  abrir desde esa franja sin salir de la sección. El titular de recomendación aparece solo
  en “Mi plan” para evitar repetirlo en cada pantalla.
- **Guardado en el dispositivo:** en “Mi plan”, la persona puede guardar el plan localmente
  y sus respuestas se actualizan allí al cambiar. No crea cuenta ni transmite ubicación.
  El botón permite borrar el guardado. El módulo está en `web/storage.js`.
- **Textos y JavaScript:** el diccionario bilingüe `T` está en `web/copy.js`; el controlador
  de pantallas continúa en `web/app.js`. `web/storage.js` contiene el guardado independiente.
- **Procedencia visible:** el plan separa clima histórico de NASA POWER, entradas de la
  persona y zona cartográfica ilustrativa. No se cambia ningún coeficiente agronómico.
- **Un solo período:** todo usa 2001–2025.
- Explicación completa del proceso y de dónde están los datos: `docs/como_funciona.md`.

## Recorrido guiado y skills de diseño (14-nov, tarde)
- **Recorrido guiado:** "Empezar con mi finca" y "Ver el caso de Don Pedro" abren 5
  preguntas, una por pantalla (zona en el mapa, mes y tareas, suelo, agua, prioridad), y
  al final revelan el plan. El código está en `prepareGuide` y `updateGuide` de
  `web/app.js`. Las mismas respuestas se pueden cambiar después en "Mi plan".
- **Skills de diseño** en `.claude/skills/` (esa carpeta no se sube a GitHub):
  las de Emil Kowalski completas (solo texto), y `taste-skill` e `impeccable` **solo
  como texto**: se dejaron fuera sus programas, un enganche que se ejecutaba solo al
  terminar cada sesión y un ejecutable, porque correrían código de terceros en esta
  computadora.
- Reglas de animación aplicadas: las cosas entran con desaceleración, solo se animan
  posición y opacidad, los botones responden al toque y nada bloquea al usuario.

## Dirección visual actual (rediseño del 14-nov, noche)
- **Idea:** la impresión de un saco de arroz dominicano. Azul ultramar plano y rojo de
  sello sobre blanco, mayúsculas condensadas gruesas, reglas negras, esquinas rectas.
  Sin cristal decorativo por toda la página, sin desenfoques de fondo ni degradados
  decorativos. El panel del relieve puede usar vidrio translúcido limitado para separar los
  datos del terreno, con alternativa opaca y texto legible.
- **Tipografías** (guardadas en `web/fonts/`, licencia abierta SIL OFL): Big Shoulders
  Display para títulos y números, Archivo para el texto.
- **Iconos:** dibujados en SVG con un solo grosor de línea (`VIEW_ICONS`,
  `PRIORITY_ICONS`, `ICONS` en `web/app.js`).
- **Dos momentos animados a propósito:** el mapa de la portada entra como una
  serigrafía y el plan recibe un sello rojo "Plan B". El resto del movimiento es mínimo.
- Reglas tomadas de las skills: no usar rótulo encima del título, no usar tarjetas de
  icono + título + texto como estructura, no usar cristal como adorno, un solo sistema
  de iconos, tipografía propia (no la del sistema) y revisar el resultado en pantalla.

## Mapa 3D, océano, foto satelital y guía de suelos (14-nov, noche)
- **Explorador de zona:** tocar una zona en el mapa hace zoom y abre su relieve real en
  3D (canvas, sin librerías), con ríos en movimiento, presas y una ficha de clima.
  El relieve está en `web/relief.js` y lo genera `build_relief.py` (elevación SRTM).
- **Altitudes de las zonas:** ahora vienen de ese relieve, no de memoria.
- **Mapa:** mar con olas en movimiento, isla con volumen y capa "Foto satelital"
  (`web/sat.jpg`, NASA MODIS Terra, 18-feb-2026).
- **Guía de suelos:** tabla para reconocer el suelo al tacto, en Ayuda y dentro de la
  pregunta de suelo del recorrido. Las fotos de suelos no se pudieron bajar; usa dibujos.
- Se quitó el botón del caso de Don Pedro. Hay botón "Volver a mi plan".
- Evaluación crítica por aspecto: `docs/evaluacion.md`.
- Continuación para Claude Code: `docs/continuacion_claude.md`.

## Calculadora de agua para todos los cultivos (15-nov)
- El equipo pidió no limitarse al arroz. Se añadió en la sección Cultivos una calculadora:
  agua de riego por tarea (año típico y año seco) para 31 cultivos en cada zona y mes, y
  cuántas tareas alcanza el agua asignada.
- Los 8 cultivos del motor usan sus valores de `crops.py`. Los otros 23 están en
  `crops_fao.py` con días por etapa (tabla 11) y Kc (tabla 12) de FAO-56, y la fila elegida
  anotada en cada uno. `build_web.py` los calcula con el mismo `water.season_needs` y los
  guarda en `other_needs` de `web/data.js`.
- **No entran en las 4 estrategias de rotación**: falta revisar con un técnico su límite de
  calor, tolerancia al suelo arrocero y mercado. La página lo dice en cada ficha.
- Los mosaicos de arriba del catálogo ahora cuentan cultivos del propio directorio; se
  quitaron los totales por grupo (frutales, musáceas, vegetales) porque no cuadraban con
  la suma de sus cultivos y no se pudieron cotejar con el boletín de la ONE.
- Sin cifra todavía: cacao, café, aguacate y mango tienen Kc en la tabla 12, pero la
  tabla 11 no da sus etapas; por eso no tienen cálculo.

## Versión mundial (prototipo, 15-nov)
- En Inicio hay un interruptor **República Dominicana / Todo el mundo · prototipo**. La
  versión de RD no cambió.
- `web/world.js`: globo que gira (foto NASA Blue Marble con relieve sombreado, de GIBS, en
  `web/earth.jpg`), fronteras de Natural Earth 1:110m y los 12 cultivos de más superficie
  de cada país (FAOSTAT 2024, en `web/world_data.js`; lo genera `build_world.py`).
- Al abrir un país, las provincias se piden a geoBoundaries; al abrir una provincia, el
  clima mensual 2001–2025 se pide a NASA POWER (API de climatología) en su punto central.
  **Necesita internet**; si falla, la página lo dice. El globo y los cultivos sí funcionan
  sin internet (en `file://` el globo se dibuja sin foto, solo con fronteras).
- Agua: FAO-56 con promedios mensuales (mismas fórmulas que `water.py`, que usa datos
  diarios). Solo da año promedio, no año seco. **Ojo:** en la climatología de POWER,
  `T2M_MAX` y `T2M_MIN` son los extremos del mes, no promedios; por eso se usan `T2M` y
  `T2M_RANGE` (máxima y mínima promedio ≈ media ± rango/2, una aproximación). Comprobado
  en Santiago, Cotuí y Mao (enero, mayo, septiembre; arroz, habichuela y maíz): entre
  0 y 11% menos que el motor diario.
- Aviso de helada: si la mínima promedio de algún mes del ciclo baja de 0 °C (punto de
  congelación del agua, no un límite de cultivo), el cultivo lo muestra y pasa al final de
  las recomendaciones.
- 8 perfiles más de FAO-56 solo para el mundo (`WORLD_CROPS` en `crops_fao.py`: trigo,
  mijo, algodón, girasol, remolacha, lenteja, arveja, haba). Cultivos de FAOSTAT sin
  perfil (olivo, café, cacao, palma, uva…) se muestran "sin cálculo de agua".
- Es un prototipo: tablas FAO-56 de otros climas, sin validación agronómica por país, sin
  suelo, calor ni mercado. Decirlo así en el pitch.
- **Cuestionario mundial** (vista `wquiz` en `web/world.js`): "Empezar con mi finca" en el
  modo mundo → país → provincia → 5 preguntas (uno o **varios** cultivos que siembra, mes y
  hectáreas de cada uno, suelo, agua como % de la que usan sus cultivos, prioridad: agua /
  suelo / lo que ya se siembra en el país). Solo cultivos de 180 días o menos. Compara
  seguir con sus cultivos, toda la tierra con su cultivo que menos agua pide, cambiar
  todo y mezcla; recomienda el que siembra más tierra sin helada; en empate decide la
  prioridad. Solo agua, año promedio.
- Medida: selector **Hectáreas | Tareas** (1 tarea = 628.86 m², como en `water.py`); las
  áreas se guardan en hectáreas. La tierra se pregunta **en total** y se reparte por igual;
  "Repartir la tierra por cultivo" es opcional.
- Tocar una provincia abre directamente el cuestionario. La pregunta del suelo solo sale si
  marca arroz (aquí el suelo solo cambia el agua del arroz inundado). El selector de medida
  está también en la pregunta de la tierra.
- El resultado va en este orden: **con lo que tú siembras** (recomendación principal),
  **lo mejor en total** (3 cultivos y cambiar todo/mezcla), **tus dos ciclos** (ciclo 2 seis
  meses después) y, plegados, **mejor mes** (menos riego sin helada) y **clima del año**
  (lluvia, ET₀, máxima, mínima, humedad del aire y del suelo `GWETROOT` de NASA POWER).
- La ficha de la provincia solo muestra relieve, clima y el botón del cuestionario. El
  relieve tiene su plegable "Datos del mapa".

## Cuestionario de RD: "¿Qué siembras ahora?" (15-nov)
- El recorrido tiene 6 preguntas: zona, **cultivos que siembra (varios)**, mes y tareas,
  suelo, agua, prioridad. Los pasos tienen nombre (`GUIDE_STEPS` en `web/app.js`), no
  números fijos; el resultado es el paso `RESULT_STEP`.
- Si marca arroz: el plan del arrocero de siempre, y debajo sus otros cultivos por agua.
  Si no marca arroz: el resultado muestra sus propios cultivos y los mejores de todos por
  agua, y el agua asignada se mide sobre lo que piden sus cultivos (`usualNeedPerTarea`).
  El motor (`engine.js`) no cambió.

## Relieve 3D del modo mundo (15-nov)
- En el cuestionario mundial (junto a las preguntas) y en la ficha de provincia: relieve
  3D de la provincia con elevación de Terrain Tiles en AWS ("terrarium", sobre todo NASA
  SRTM; se piden por internet), ríos de Natural Earth 1:10m (`web/world_rivers.js`, se
  carga solo en el modo mundo; lo genera `build_world.py`), límite en amarillo y el punto
  donde se pide el clima. Se gira arrastrando.

## Mis cultivos y dos recomendaciones (15-nov)
- En "Agua y cultivos" el agricultor marca qué cultivos tiene (los 48 del directorio; los
  de borde punteado no tienen cálculo). Se guardan con el plan (`myCrops` en `storage.js`).
- **De todos:** los 3 cultivos que mejor caben en su agua. **De los suyos:** el orden de los
  que marcó y, si otro de fuera de su lista rinde más el agua, se lo dice.
- La regla es solo agua, la única medida que comparten los 31 cultivos: primero las tareas
  que cubre el agua asignada en un año seco, luego menos m³ por tarea. Quedan fuera del
  orden la sesbania (abono verde, no se cosecha) y los ciclos de más de 180 días (plátano,
  caña, cítricos, yuca), porque el agua se asigna por ciclo de riego. La página avisa que
  no revisa suelo, calor ni mercado. Funciones `waterFit`, `drawMyCrops`,
  `drawRecommendations` en `web/app.js`.

## Correcciones de la revisión (15-nov)
- El mapa solo se redibuja cuando cambia la zona, la capa o el idioma (antes se rehacían
  cuatro copias en cada movimiento de un control).
- Tocar una provincia abre una zona arrocera de esa provincia. Si no tiene ninguna, abre la
  más cercana y lo dice en pantalla (texto `province_nearest`).
- El plan guardado recuerda la zona por su nombre y no reescribe el guardado si no cambió.
- El botón Adelante del navegador ya avanza (lista `ahead` en `web/app.js`).
- La etiqueta FINCA/FARM del relieve va encima de la casa, lejos del nombre de la zona.

## Botón Atrás general
- El botón "← Atrás" (barra superior; en celular flota sobre la barra de pestañas)
  vuelve a la pantalla anterior, incluidas las preguntas del recorrido. Usa la lista
  `trail` de `web/app.js` y también responde al botón de atrás del navegador o del
  teléfono. Cualquier pantalla nueva debe abrirse con `setView(...)` para que se recuerde.

## Cómo correrlo
```bash
cd ~/NASA
open web/index.html                    # ver la página
.venv/bin/python build_web.py          # regenerar datos de la página
.venv/bin/python check_engine.py       # debe decir "0 failed"
node check_web.js                      # debe decir "0 different"
```
Si `.venv` no existe: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`

## Reglas que no se pueden romper
1. Si cambias `rotation.py` o `crops.py`, cambia igual `web/engine.js`, corre
   `build_web.py` y luego las dos verificaciones. Deben quedar en cero fallos.
2. No inventes cifras. Toda cifra nueva lleva fuente con enlace.
3. Todo texto de la página va en los dos idiomas (objeto `T` en `web/copy.js`).
4. La página debe seguir funcionando sin internet (sin librerías externas).
5. Mantén los avisos de "herramienta de apoyo" y la declaración de uso de IA.
6. Python 3.9: no usar sintaxis más nueva (`X | Y` en tipos, `match`).

## Lo que falta, en orden de importancia
1. **Validar con un agrónomo o mentor** qué se puede sembrar de verdad en suelo
   arrocero (habichuela, guandul, caupí, maíz, sorgo, auyama, sesbania) y ajustar
   `crops.py` (campos `heavy_soil`, `heat_limit`, `market`, `nitrogen`).
2. **Publicar:** crear repositorio en GitHub, subir todo y activar GitHub Pages
   apuntando a la carpeta `web/` para tener un enlace público.
3. **Pitch de 6 minutos** (gancho, problema, solución con datos NASA, demo, impacto)
   y **demo global** (video de 30 s o 7 slides, en inglés).
4. **Página del proyecto en inglés** en spaceappschallenge.org, con declaración de IA.
5. Cotejar los coeficientes de `crops.py` con las tablas 11 y 12 de FAO-56.
6. Opcional: precios y rendimientos reales para la nota de ingreso.

## Catálogo agrícola (14-nov, noche)
- `web/crops_local.js` alimenta una vista de búsqueda de 39 cultivos/rubros dominicanos,
  con filtros y cifras nacionales preliminares de ONE 2025 cuando hay dato individual.
- Se accede desde Inicio; queda bilingüe y offline y su archivo se incluye en la caché PWA.
- Este catálogo amplía la exploración de la web, pero no cambia el motor de rotación:
  las ocho fichas de cultivo existentes siguen dentro del planificador centrado en arroz.
- No afirmar que el planificador recomienda yuca, plátano, cacao o frutales. Un cultivo
  solo pasa a cálculo cuando tenga calendario, Kc/etapas, reglas de suelo/agua y validación
  agronómica local. Ver `docs/catalogo_cultivos.md`.
- La estadística ONE agrupa parte de los productos como "otros"; el directorio no es una
  lista botánica exhaustiva de cada especie o variedad cultivada en el país.

## Actualización Codex (15-nov): picos, cacao y contexto NASA
- `web/peaks.js` agrega 10 cumbres con nombres y coordenadas de referencia al relieve 3D.
  El mapa no imprime alturas porque las fuentes y resoluciones no coinciden de forma
  suficiente para atribuir una elevación precisa a cada punto. Las posiciones son
  aproximadas; consultar el IGN/GeoNames antes de ampliar o mover etiquetas.
- El catálogo sigue teniendo 39 rubros e incluye frutas y cacao. Cacao aparece primero;
  su tarjeta muestra exportaciones de cacao en grano (77,058.7 t; USD 668.9 millones,
  2025), no producción de finca ni precio pagado al productor. Ver `docs/catalogo_cultivos.md`.
- El relieve muestra más contexto ya procesado de NASA POWER: ET₀, humedad modelada en
  zona radicular y superficie, humedad del aire y viento; lluvia y temperatura ya
  aparecían. La humedad de suelo es indicativa y no cambia el motor de rotación. Los
  promedios son 2001–2025 y regionales, no en vivo ni a nivel parcela.
- `docs/capas_nasa.md` enumera GPM, SMAP, MODIS, ECOSTRESS y GRACE como fuentes candidatas,
  no como capas integradas. Recomienda estudiar pérdida de cobertura forestal como
  contexto de cuenca y erosión; no añadirla aún al puntaje ni llamarla deforestación sin
  validar producto, escala, periodo y relación local.

## Límites conocidos (decirlos con honestidad en el pitch)
- NASA POWER usa cuadros de ~50 km; Valverde y Montecristi comparten datos.
- La lluvia de NASA POWER sale más baja que la real y no detectó la sequía de inicios de 2024.
- La nota de ingreso no usa precios; mide qué tan segura es la venta.
- El área de arroz por cuenca es una estimación (área nacional × % de producción).
- Las estimaciones económicas siguen pendientes: los costos públicos revisados son
  referencias de 2021 y los precios/rendimientos disponibles no coinciden todos en
  zona, período y población. No anunciar ahorro monetario ni rentabilidad hasta validar
  costos actuales y precios recibidos en el Cibao.
