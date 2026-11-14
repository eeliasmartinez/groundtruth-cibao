# El motor de cálculo — qué hace y qué tan confiable es

Documento de trabajo del equipo (en español). Código y redacción asistidos por IA (Claude Code).

## Qué calcula

1. **Cuánta agua pierde el campo cada día** (evapotranspiración de referencia), con
   temperatura, sol, humedad y viento de NASA POWER. Método: FAO-56 Penman-Monteith,
   el estándar mundial de riego.
2. **Cuánta agua de riego necesita cada cultivo por tarea**, para el mes de siembra
   elegido. Lo repite para cada año desde 2001 y da dos números: un año típico y un
   año seco (8 de cada 10 años necesitan menos).
3. **Cuatro estrategias** con el agua que el productor va a recibir:
   - *Actual:* solo arroz, en la tierra que el agua permita.
   - *Mixta:* arroz en una parte y una leguminosa en el resto.
   - *Rotación:* este ciclo sin arroz, con un cultivo de poco consumo para vender.
   - *Abono verde:* este ciclo sin arroz, sembrando sesbania para recuperar el suelo.
4. **Tres notas por estrategia** (0 a 100): agua, suelo e ingreso, más una nota
   general según la prioridad del productor, y una lista de advertencias.
5. **Efecto en la cuenca:** cuánta agua se ahorra si una parte de los arroceros del
   Yaque del Norte rota un ciclo, comparado con la capacidad de las presas.

## Ejemplo real (Mao, suelo arcilloso, siembra de julio, 100 tareas)

| Cultivo | Agua de riego por tarea (año típico) |
|---|---|
| Arroz | 923 m³ |
| Maíz | 273 m³ |
| Sorgo | 241 m³ |
| Auyama | 229 m³ |
| Habichuela | 229 m³ |
| Caupí | 187 m³ |
| Abono verde (sesbania) | 128 m³ |

Con el 60% del agua: la estrategia actual siembra 60 tareas de arroz y deja 40
vacías. La mixta, con la misma agua, siembra 50 de arroz y 50 de leguminosa: ninguna
tarea vacía y nitrógeno para el suelo equivalente a unos 7 sacos de urea.

## Cómo se calificó y mejoró

**Versión 1 — nota 6/10.** Fallos encontrados al revisarla:
- Premiaba dejar la tierra vacía (una finca sin sembrar sacaba 100 en "agua").
- El ahorro a nivel de cuenca se multiplicaba por la ineficiencia del riego y daba
  175% de la presa de Tavera: exagerado y difícil de defender.
- Faltaba el guandul, la leguminosa más importante en la mesa dominicana.
- No avisaba cuando un plan se queda sin agua en un año seco.

**Versión 2 — nota 8/10.** Corregidos los cuatro puntos. Ahora:
- El ahorro de agua solo cuenta en tierra que sigue produciendo.
- El efecto en la cuenca usa solo el ahorro medido en la finca (cifra conservadora).
- 31,782 verificaciones automáticas pasan: el arroz queda entre 9,000 y 25,000 m³
  por hectárea (rango de la literatura), ningún plan usa más agua ni más tierra de
  la disponible, y una finca vacía nunca gana cuando hay agua.
  Se corren con: `.venv/bin/python check_engine.py`

## Lo que le falta para un 10 (vacíos honestos)

- **Ingreso:** no usa precios ni rendimientos reales; usa una nota de 0 a 5 de qué
  tan segura es la venta. Hace falta el precio por quintal y el rendimiento por
  tarea de cada cultivo (Ministerio de Agricultura).
- **Agronomía local:** qué cultivos aguantan de verdad un suelo arrocero arcilloso,
  y los límites de calor, deben validarse con un agrónomo. Hoy son valores de
  referencia generales.
- **Temperatura máxima:** la de NASA POWER no se ha comparado con una estación local.
- **Área de arroz del Yaque del Norte:** se estimó repartiendo el área nacional según
  la producción de cada provincia. Es un supuesto.
- **Tabla de cultivos:** los coeficientes vienen de las tablas de FAO-56 citadas de
  memoria; hay que cotejarlos con el documento original.
