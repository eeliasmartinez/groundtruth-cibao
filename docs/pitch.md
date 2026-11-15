# Pitch de 6 minutos — GroundTruth Cibao · El Plan B del arrocero

Domingo 15-nov-2026, desde las 4:00 PM, ante 3 jueces. Español.
Criterios del jurado: **Impacto, Creatividad, Validez, Relevancia, Presentación**.
Cada cifra de abajo tiene fuente en `docs/investigacion.md`. No digan ninguna cifra que
no esté aquí. Redacción asistida por IA (Claude Code).

Página: https://eeliasmartinez.github.io/groundtruth-cibao/

---

## Antes de entrar (lista de control)

- [ ] Abrir la página en la computadora del pitch **y recargarla una vez** (así toma la
      versión nueva y queda guardada aunque falle el Wi-Fi).
- [ ] Probar que el relieve 3D se mueve y que el globo gira en esa computadora.
- [ ] Dejar la página en **Inicio**, en español, con el zoom del navegador al 100%.
- [ ] Tener abierta una segunda pestaña con la página por si la primera se traba.
- [ ] Cronómetro: una persona levanta la mano a los 5:00.
- [ ] Plan si no hay internet: la demo de RD funciona sin internet. Si el globo no carga
      provincias, mostrar solo el globo girando y decir "aquí se piden por internet".

---

## Reparto (6 personas)

| Tiempo | Quién | Parte |
|---|---|---|
| 0:00–0:30 | Persona 1 | Gancho |
| 0:30–1:30 | Persona 2 | El problema |
| 1:30–2:10 | Persona 3 | La idea y los datos de NASA |
| 2:10–4:10 | Persona 4 maneja, Persona 3 narra | Demo |
| 4:10–4:50 | Persona 5 | Por qué confiar (y qué falta) |
| 4:50–5:40 | Persona 6 | Impacto y siguiente paso (globo) |
| 5:40–6:00 | Persona 1 | Cierre |

---

## Guion

### 0:00 — Gancho (Persona 1)

> "Imaginen que ustedes siembran arroz en Mao. Llega el aviso: este ciclo el agua no
> alcanza, no siembren arroz. Y la pregunta que nadie les contesta es:
> **¿entonces qué siembro?** Nosotros somos GroundTruth Cibao y construimos
> el Plan B del arrocero."

### 0:30 — El problema (Persona 2)

> "El arroz dominicano es del Cibao: la región Norte produce el **91.5%** del arroz del
> país, y el **99.5%** se siembra bajo riego. Viven de él unos **30,000 productores**.
>
> Pero el agua del río Yaque del Norte ya está casi toda comprometida: la presión
> hídrica es de alrededor del **96%**. Por eso, cuando llueve poco, se raciona. En 2019
> el INDRHI **prohibió** el arroz de invierno en Tavera, Monción, Mao y Montecristi. Y
> este año, 2026, las lluvias estuvieron entre **20 y 45% por debajo de lo normal** y
> el riego se dio por turnos.
>
> En las notas oficiales que revisamos de 2018, 2019 y 2026 se dice cuándo **no**
> sembrar arroz. En ninguna se dice **qué sembrar** en su lugar. Ese es el hueco."

*(Fuentes: elDinero 25-mar-2026; UNCCD 2024; El Caribe 15-sep-2019; Diario Libre
11-ago-2026; Montecristi 24 Horas 28-ago-2026.)*

### 1:30 — La idea y los datos de NASA (Persona 3)

> "Nuestra herramienta no adivina cuánta agua va a dar el INDRHI: **el productor nos
> dice cuánta agua le tocó**. Con eso le mostramos qué puede sembrar.
>
> Usamos **25 años de datos diarios de NASA POWER**, de 2001 a 2025: temperatura,
> lluvia, sol, humedad y viento de cada zona arrocera. Con el método FAO-56 de la FAO
> calculamos cuánta agua de riego necesita cada cultivo en esa zona y en ese mes, en
> un año normal y en un año seco.
>
> Y comparamos cuatro planes: seguir con arroz, arroz con leguminosa, rotar con un
> cultivo que gaste poca agua, o abono verde."

### 2:10 — Demo (Persona 4 maneja, Persona 3 narra)

Ruta fija. No improvisar: hay más pantallas de las que caben en 2 minutos.

1. **Inicio** → tocar **Santiago (Navarrete)** en el mapa → aparece el **relieve 3D**
   real de la zona (elevación SRTM de NASA) con ríos y presas.
   > "Este es el terreno real de la zona, con datos de elevación de NASA."
2. **"Continuar con esta finca"** → las 5 preguntas, rápido:
   mes y tareas → suelo → **agua: poner 60%** → prioridad.
   > "Son las cinco cosas que el productor ya sabe: cuándo siembra, cuánta tierra
   > tiene, qué suelo, cuánta agua le dieron y qué le importa más."
3. **Sale el plan con el sello "Plan B"**. Leer la frase de arriba tal como sale en
   pantalla (las cifras cambian con el mes; ensayen con la computadora del pitch).
   > "Con el 60% del agua, en vez de dejar tierra sin sembrar, le proponemos..."
4. **"Ver la rotación"** → el calendario de dos ciclos.
5. Abrir **Inicio → "Agua y cultivos"**, bajar a la tabla:
   > "Y si quiere otro cultivo, aquí está cuánta agua pide cada uno de 31 cultivos en
   > su zona, y cuántas tareas le alcanzan con su agua."

### 4:10 — Por qué confiar (y qué falta) (Persona 5)

> "Lo comprobamos: el cálculo de la página y el del motor en Python coinciden en
> **63,548 comprobaciones**, sin una sola diferencia.
>
> Y decimos lo que no sabemos. NASA POWER usa cuadros de unos 50 km y su lluvia sale
> más baja que la real. Los valores de cada cultivo vienen de las tablas de la FAO y
> **todavía los tiene que validar un agrónomo dominicano**. Y no usamos precios: no
> prometemos ganancias. Es una herramienta de apoyo, no reemplaza al técnico."

### 4:50 — Impacto y siguiente paso (Persona 6)

> "Hoy funciona para las **14 zonas arroceras** del país, en español e inglés, en el
> celular y sin internet.
>
> Y el método sirve para cualquier lugar, porque los datos de NASA y de la FAO cubren
> todo el planeta. *(Persona 4 toca "Todo el mundo · prototipo": el globo de NASA gira.)*
> Este es nuestro prototipo mundial: eliges un país, una provincia, y con el clima de
> NASA te dice cuánta agua pide cada cultivo que se siembra allí. Es un prototipo:
> el siguiente paso es validarlo con agrónomos de cada país."

### 5:40 — Cierre (Persona 1)

> "Cuando falta el agua, el productor no necesita que le digan qué **no** sembrar.
> Necesita un **Plan B**. Gracias."

---

## Preguntas difíciles de los jueces (respuestas cortas y honestas)

**¿Hablaron con algún productor o agrónomo?**
"Todavía no validamos con un agrónomo; es lo primero que haremos. Por eso la página
dice en cada recomendación que es una herramienta de apoyo." *(Si un mentor revisó
algo durante el evento, decirlo aquí con su nombre.)*

**¿Cómo saben cuánta agua habrá?**
"No lo predecimos. Probamos predecirlo con la lluvia de NASA y falló con la sequía de
inicios de 2024, así que preferimos que el productor ponga el agua que le asignaron."

**¿Por qué NASA POWER y no estaciones locales?**
"Cubre todo el país de forma uniforme desde 2001 y es gratis. Su límite: cuadros de
~50 km y lluvia algo baja. Lo decimos en la página."

**¿Esos cultivos aguantan el suelo arrocero (pesado y encharcado)?**
"Algunos no. El motor penaliza los que no toleran suelo pesado, pero esos valores
deben validarse con un agrónomo."

**¿Y el dinero? ¿Le conviene al productor?**
"No lo sabemos todavía: no encontramos precios recientes confiables para el Cibao, así
que no prometemos ganancias. La nota de ingreso mide qué tan segura es la venta."

**¿Por qué la lechuga sale primero en la tabla de agua?**
"Porque esa tabla mira solo el agua. La página dice que no revisa suelo, calor ni
mercado. Para decidir, el plan principal sí considera suelo y calor."

**¿El modo mundial es real?**
"Es un prototipo: usa el clima de NASA POWER de cualquier punto y las tablas de la FAO,
pero con promedios por mes, sin año seco y sin validación por país. En Santiago da
entre 0 y 11% de diferencia con nuestro motor diario."

**¿Qué hizo la IA y qué hicieron ustedes?**
"Usamos IA (Claude Code y OpenAI Codex) para programar y redactar, y lo declaramos en
la página. Nosotros definimos el problema, elegimos la solución, revisamos las fuentes
y decidimos qué no prometer."

---

## No decir (no tiene fuente verificada)

- Costos por tarea, ahorro en pesos o ganancias.
- "15–25 sacos de urea", "esterilidad del arroz a 32 °C", "40% de pérdidas en canales".
- Que el semáforo es "oficial del INDRHI".
- Cifras de producción del catálogo de la ONE (no se pudieron cotejar).
