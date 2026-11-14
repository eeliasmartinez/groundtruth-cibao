# Cómo funciona todo, de principio a fin

Documento para el equipo (en español). Redacción asistida por IA (Claude Code).

## 1. No hay base de datos

No usamos Supabase ni ninguna base de datos. Los datos son **archivos** dentro del
proyecto, y se pueden abrir y revisar:

| Qué | Dónde está | Cómo verlo |
|---|---|---|
| Datos diarios de la NASA, uno por zona (14 archivos) | carpeta `data/` | Abrir cualquier `.csv` con Excel o Google Sheets. En GitHub: https://github.com/eeliasmartinez/groundtruth-cibao/tree/main/data |
| Resultados ya calculados que usa la página | `web/data.js` | Es un archivo de texto generado por el motor |
| Costa y ríos del mapa | `web/geo.js` | Generado desde Natural Earth y OpenStreetMap |

Cada CSV tiene una fila por día desde el 1 de enero de 2001 y estas columnas:
temperatura media, máxima y mínima (°C), lluvia (mm/día), radiación solar, humedad del
aire (%), humedad del suelo en las raíces y en la superficie (0 a 1) y viento (m/s).

Para comparar contra la fuente original: https://power.larc.nasa.gov/data-access-viewer/
(elegir "Agroclimatology", un punto con la latitud y longitud de la zona, y "Daily").

## 2. Cómo llegan los datos de la NASA

1. `nasa_power.py` tiene la lista de zonas con su latitud, longitud y altitud.
2. Para cada zona le pide a NASA POWER (una dirección web pública, sin clave) todos los
   días desde 2001. La NASA responde con una tabla.
3. El programa guarda esa tabla como CSV en `data/`. Los días sin dato vienen como -999
   y se marcan como vacíos.
4. Al leer el CSV se ajusta la temperatura por altitud (6.5 °C por cada 1000 m), porque
   la NASA da el promedio de un cuadro de unos 50 km.

Para volver a descargar todo: `.venv/bin/python nasa_power.py`

## 3. Del dato al plan (el motor)

1. `water.py` calcula cuánta agua pierde el campo cada día (ET0, método FAO-56) con la
   temperatura, el sol, la humedad y el viento.
2. Multiplica por el coeficiente de cada cultivo (Kc, en `crops.py`) y resta la lluvia
   aprovechable. Queda el riego necesario por tarea, para cada año de 2001 a 2025.
3. `rotation.py` arma las cuatro estrategias con el agua asignada y les pone nota.
4. `build_web.py` corre todo eso para las 14 zonas, 3 suelos y 12 meses, y guarda los
   resultados en `web/data.js`.

La página no calcula el clima: lee `web/data.js`. Solo hace en el navegador la parte
final (repartir la finca según el agua), con `web/engine.js`, que es una copia exacta de
`rotation.py`. `check_web.js` comprueba que las dos den lo mismo.

## 4. Dónde está publicada (no hace falta Vercel)

La página son archivos estáticos (HTML, CSS y JavaScript), sin servidor. Está en
**GitHub Pages**, que es gratis y se actualiza sola con cada `git push`:
https://eeliasmartinez.github.io/groundtruth-cibao/

Vercel serviría igual, pero no aporta nada que GitHub Pages no dé para este proyecto.

## 5. App instalable (PWA)

La página se puede instalar como aplicación. En Chrome o Edge aparece el botón
"Instalar app"; en iPhone, Compartir → "Agregar a inicio". Después de abrirla una vez
con internet, funciona sin conexión, porque guarda una copia en el dispositivo
(`web/sw.js`).

## 6. Cuentas que el equipo puede comprobar frente al jurado

- 1 tarea = 628.86 m². 1 mm de agua sobre una tarea = 0.629 m³.
- Riego del arroz en Mao sembrando en diciembre: 887 m³ por tarea ÷ 0.629 ≈ 1,410 mm
  en el ciclo. (El valor exacto puede variar unas unidades si se regeneran los datos.)
