# Datos NASA y cobertura forestal: qué usamos y qué falta

Actualizado el 15-nov-2026. Documento de decisiones técnicas para el equipo.

## Ya procesado en la aplicación

Las series históricas de NASA POWER (2001–2025) que están guardadas por zona incluyen
temperatura media, máxima y mínima, lluvia corregida, radiación solar, humedad del aire,
viento y las variables modeladas de humedad de suelo superficial y en raíces. La web
muestra el resumen mensual de temperatura máxima, lluvia, ET₀, humedad del aire, viento y
ambos indicadores de humedad de suelo.

El motor de riego calcula ET₀ diaria con FAO-56 a partir de temperatura, radiación,
humedad, viento y altitud; aplica los coeficientes de cultivo y descuenta lluvia
aprovechable. Las dos variables de humedad de suelo son contexto exploratorio, no se
convierten en una medición del campo ni modifican el resultado de rotación.

NASA POWER sirve como señal regional histórica. Su celda puede cubrir decenas de
kilómetros: es útil para comparar patrones, pero no resuelve diferencias entre parcelas.
La documentación y parámetros del servicio están en la
[documentación oficial de NASA POWER](https://power.larc.nasa.gov/docs/services/).

## Capas NASA que recomendamos probar después

| Conjunto | Aporte posible | Uso sensato | Estado |
|---|---|---|---|
| GPM IMERG | Precipitación con mayor detalle espacial y temporal que la serie de POWER | Contrastar lluvia mensual y eventos; no sustituir estaciones sin validación | No integrado |
| SMAP L4 | Humedad de suelo superficial y de zona radicular, alrededor de 9 km | Comparar anomalías de humedad regional y sequía | No integrado |
| MODIS NDVI/EVI | Cambios en verdor de la vegetación, 250 m y revisita compuesta | Explorar calendario, vigor y periodos de baja cobertura; no identificar cultivo automáticamente | No integrado |
| ECOSTRESS | Temperatura de superficie y productos de evapotranspiración con observaciones irregulares | Buscar estrés térmico o hídrico donde haya observaciones válidas | No integrado |
| GRACE / GRACE-FO | Cambios de almacenamiento total de agua a escala muy amplia | Contexto de cuenca o país; nunca diagnóstico de parcela | No integrado |

Referencias oficiales para empezar: [GPM IMERG en Earthdata Search](https://search.earthdata.nasa.gov/search?q=GPM_3IMERGM_07),
[SMAP en Earthdata Search](https://search.earthdata.nasa.gov/search?q=SMAP),
[MODIS Vegetation Indices](https://cmr.earthdata.nasa.gov/search/concepts/C3560374404-INPE.html),
[ECOSTRESS Data](https://ecostress.jpl.nasa.gov/data) y
[NASA GRACE](https://grace.jpl.nasa.gov/).

Antes de añadir cualquiera: guardar el producto y versión, calcular agregados mensuales
con unidades explícitas, registrar valores faltantes y cobertura, cotejar con una fuente
local (estaciones, técnicos o campo), probar consistencia temporal y mostrar resolución,
fecha y límites en la interfaz. Debe seguir funcionando offline, por lo que la app debe
incluir los datos ya procesados, no depender de consultar APIs durante la demo.

## ¿Incluir deforestación?

**Sí, como contexto de cuenca y riesgo de degradación; no como nota automática de
“cultivo recomendado”.** La pérdida de cobertura forestal puede ayudar a explicar cambios
en escorrentía, erosión, sedimentos, regulación hídrica y exposición de laderas. Por sí
sola no demuestra que una finca se haya deforestado, que haya menos agua disponible en un
canal específico ni que un cultivo determinado vaya a fallar.

Una futura capa debe distinguir explícitamente pérdida de cobertura arbórea, cambio de
uso del suelo y deforestación. La pérdida anual de árboles también puede incluir fuego,
cosecha forestal o perturbaciones; por tanto, no debe rotularse automáticamente como
deforestación. Se recomienda calcular la señal aguas arriba por subcuenca, verificarla
contra mapas nacionales y conocimiento local, y presentarla como “cambio de cobertura
forestal observado”, con año y resolución. Mantenerla fuera del puntaje hasta validar la
relación con erosión o caudal en la cuenca elegida.

**Decisión para esta entrega:** no incorporarla al mapa ni a la recomendación todavía.
Primero validar qué capa nacional y periodo son apropiados; después construir una prueba
para una subcuenca del Cibao y pedir revisión a un especialista de recursos naturales.

## Fuentes de suelo, relieve y agricultura dominicana

- [ONE, estadísticas de agricultura, ganadería, silvicultura y pesca](https://www.one.gob.do/datos-y-estadisticas/temas/estadisticas-economicas/estadisticas-sectoriales/agricultura-ganaderia-silvicultura-y-pesca/).
- [ONE, Boletín de Estadísticas Agropecuarias enero–diciembre de 2025](https://www.one.gob.do/media/njpkonqj/bolet%C3%ADn-estad%C3%ADstico-agropecuario-enero-diciembre-2025.pdf).
- [Instituto Geográfico Nacional, medición GNSS de los tres picos más altos de las Antillas](https://ign.gob.do/medicion-por-sistema-global-de-navegacion-por-satelite-gnss-de-los-tres-picos-mas-altos-de-las-antillas/).
- [IGN, recursos hidrográficos superficiales y relieve de República Dominicana](https://ign.gob.do/wp-content/uploads/2024/11/RECURSOS-HIDROGRAFICOS-SUPERFICIALESDE-REP.-DOM-digital-op_compressed.pdf).
- [GeoNames, topónimos de República Dominicana](https://www.geonames.org/advanced-search.html?country=DO&featureClass=T), basado en gazetteer geográfico; las coordenadas de referencia no son levantamiento topográfico.

## Cumbres rotuladas en el relieve

`web/peaks.js` incluye diez nombres de referencia: Pico Duarte, La Pelona, La Rucilla,
Pico del Yaque, Alto de la Bandera, Loma Quita Espuela, Pico Diego de Ocampo, Pico
Murazo, Loma Isabel de Torres y Monte Gallo. Los nombres se cotejaron con el mapa y las
publicaciones del IGN; las posiciones individuales se tomaron como referencias
geográficas y pueden variar según el gazetteer. Por eso se rotulan los nombres, pero no se
atribuyen elevaciones a los puntos. Para los tres picos más altos existe un levantamiento
GNSS oficial reciente del IGN; sus alturas no se extrapolan al resto ni se leen del modelo
SRTM grueso que usa el relieve.
