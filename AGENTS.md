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
- **PWA:** `web/manifest.webmanifest`, `web/sw.js` e iconos. Si se cambian archivos de
  la página, subir el número de `CACHE` en `web/sw.js`.
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
  Sin cristal, sin desenfoques, sin degradados decorativos y sin emojis.
- **Tipografías** (guardadas en `web/fonts/`, licencia abierta SIL OFL): Big Shoulders
  Display para títulos y números, Archivo para el texto.
- **Iconos:** dibujados en SVG con un solo grosor de línea (`VIEW_ICONS`,
  `PRIORITY_ICONS`, `ICONS` en `web/app.js`).
- **Dos momentos animados a propósito:** el mapa de la portada entra como una
  serigrafía y el plan recibe un sello rojo "Plan B". El resto del movimiento es mínimo.
- Reglas tomadas de las skills: no usar rótulo encima del título, no usar tarjetas de
  icono + título + texto como estructura, no usar cristal como adorno, un solo sistema
  de iconos, tipografía propia (no la del sistema) y revisar el resultado en pantalla.

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
3. Todo texto de la página va en los dos idiomas (objeto `T` en `web/app.js`).
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

## Límites conocidos (decirlos con honestidad en el pitch)
- NASA POWER usa cuadros de ~50 km; Valverde y Montecristi comparten datos.
- La lluvia de NASA POWER sale más baja que la real y no detectó la sequía de inicios de 2024.
- La nota de ingreso no usa precios; mide qué tan segura es la venta.
- El área de arroz por cuenca es una estimación (área nacional × % de producción).
